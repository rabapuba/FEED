import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CryptoAsset,
  TimeFrame,
  ChartMode,
  ChartStyle,
  OHLCData,
  OrderBookState,
  TradeItem,
  PolymarketEvent,
  PolymarketMarket,
  RoundSettlementState,
  LatencyStats,
} from '../types/market';
import {
  BinanceStreamManager,
  fetchBinanceKlines,
} from '../services/binanceFeed';
import {
  get5MinWindowTimestamp,
  getPolymarketSlug,
  fetchEventBySlug,
  fetchClobMidpoint,
  fetchOrderBook,
  fetchTradesHistory,
  fetchContractPricesHistory,
  PolymarketClobWsManager,
} from '../services/polymarketFeed';
import {
  TwapEngine,
  aggregateCandles,
  mergeCandleArrays,
  toHeikinAshi,
} from '../services/twapEngine';

export function useTradingTerminal() {
  const [asset, setAsset] = useState<CryptoAsset>('BTC');
  const [timeframe, setTimeframe] = useState<TimeFrame>('1m');
  const [chartMode, setChartMode] = useState<ChartMode>('SPOT');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');

  // Market & Event State
  const [currentWindowTs, setCurrentWindowTs] = useState<number>(() => get5MinWindowTimestamp());
  const [activeEvent, setActiveEvent] = useState<PolymarketEvent | null>(null);
  const [activeMarket, setActiveMarket] = useState<PolymarketMarket | null>(null);
  const [upTokenId, setUpTokenId] = useState<string>('');
  const [downTokenId, setDownTokenId] = useState<string>('');

  // Live Prices & Settlement
  const [spotPrice, setSpotPrice] = useState<number>(0);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [upPrice, setUpPrice] = useState<number>(0.50);
  const [downPrice, setDownPrice] = useState<number>(0.50);

  const [settlement, setSettlement] = useState<RoundSettlementState>({
    currentWindowTs: get5MinWindowTimestamp(),
    secondsLeft: 300,
    strikePrice: 0,
    currentPrice: 0,
    runningTwap: 0,
    strikeDelta: 0,
    strikeDeltaPct: 0,
    twapDelta: 0,
    twapDeltaPct: 0,
    requiredPriceToFlip: 0,
    isUpWinning: true,
    isUrgent: false,
    isCritical: false,
    progressPct: 0,
  });

  // Candlestick Storage (Granular 5s base buffer)
  const spotBaseCandlesRef = useRef<OHLCData[]>([]);
  const contractBaseCandlesRef = useRef<OHLCData[]>([]);
  const [activeCandles, setActiveCandles] = useState<OHLCData[]>([]);
  const [twapLineData, setTwapLineData] = useState<Array<{ time: number; value: number }>>([]);

  // Order Book & Trades
  const [orderBook, setOrderBook] = useState<OrderBookState>({
    bids: [],
    asks: [],
    lastPrice: 0.5,
    bestBid: 0.49,
    bestAsk: 0.51,
    spread: 0.02,
  });
  const [trades, setTrades] = useState<TradeItem[]>([]);

  // Latency & Health
  const [latencyStats, setLatencyStats] = useState<LatencyStats>({
    binanceWsPingMs: 0,
    polymarketWsConnected: false,
    binanceWsConnected: false,
    lastUpdateTimestamp: Date.now(),
  });

  // Services Refs
  const twapEngineRef = useRef<TwapEngine>(new TwapEngine(currentWindowTs));
  const binanceManagerRef = useRef<BinanceStreamManager | null>(null);
  const polyWsManagerRef = useRef<PolymarketClobWsManager | null>(null);
  const latestSpotRef = useRef<number>(0);
  const strikePriceRef = useRef<number>(0);
  const currentWindowRef = useRef<number>(currentWindowTs);
  currentWindowRef.current = currentWindowTs;

  // RAF Throttling for 60fps buttery UI
  const rafPendingRef = useRef<boolean>(false);
  const dirtyUiRef = useRef<{ spot: number; latency: number } | null>(null);

  // 1. Master Timer (1-second tick & Window Rollover)
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const windowFloor = Math.floor(nowSec / 300) * 300;

      // Handle window rollover
      if (windowFloor !== currentWindowRef.current) {
        currentWindowRef.current = windowFloor;
        setCurrentWindowTs(windowFloor);
        twapEngineRef.current.resetWindow(windowFloor, latestSpotRef.current);
        strikePriceRef.current = latestSpotRef.current;
      }

      // Compute latest settlement metrics
      if (latestSpotRef.current > 0) {
        twapEngineRef.current.recordPrice(latestSpotRef.current, nowSec);
        const st = twapEngineRef.current.computeRoundSettlement(latestSpotRef.current, nowSec);
        setSettlement(st);

        // Add to TWAP line series for chart
        if (nowSec >= windowFloor) {
          setTwapLineData((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.time === nowSec) {
              copy[copy.length - 1] = { time: nowSec, value: st.runningTwap };
              return copy;
            }
            copy.push({ time: nowSec, value: st.runningTwap });
            return copy.slice(-300);
          });
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // 2. Recompute Active Candles on TimeFrame / Mode / Style Change
  const refreshActiveCandles = useCallback(() => {
    const base = chartMode === 'SPOT' ? spotBaseCandlesRef.current : contractBaseCandlesRef.current;
    if (base.length === 0) {
      setActiveCandles([]);
      return;
    }

    let aggregated = aggregateCandles(base, timeframe, 300);
    if (chartStyle === 'heikin-ashi') {
      aggregated = toHeikinAshi(aggregated);
    }
    setActiveCandles(aggregated);
  }, [timeframe, chartMode, chartStyle]);

  // 3. Binance Low Latency Stream Manager
  useEffect(() => {
    let isSubscribed = true;

    // Load initial spot candles
    async function loadSpotHistory() {
      const klines1m = await fetchBinanceKlines(asset, '1m', 150);
      if (!isSubscribed || klines1m.length === 0) return;

      spotBaseCandlesRef.current = klines1m;
      const lastCandle = klines1m[klines1m.length - 1];
      latestSpotRef.current = lastCandle.close;
      setSpotPrice(lastCandle.close);

      // Set strike price if start of window has a candle
      const startCandle = klines1m.find((c) => c.time === currentWindowRef.current) || lastCandle;
      strikePriceRef.current = startCandle.open || startCandle.close;
      twapEngineRef.current.setStrikePrice(strikePriceRef.current);

      refreshActiveCandles();
    }

    loadSpotHistory();

    // Start WebSocket Stream
    binanceManagerRef.current = new BinanceStreamManager(
      asset,
      (tick) => {
        const prev = latestSpotRef.current;
        latestSpotRef.current = tick.price;

        // Micro-update active candle buffer
        const nowSec = tick.timeSec;
        const bucketTime = Math.floor(nowSec / 5) * 5; // 5-second micro-bucket
        const base = spotBaseCandlesRef.current;

        if (base.length > 0) {
          const last = base[base.length - 1];
          if (last.time === bucketTime) {
            last.high = Math.max(last.high, tick.price);
            last.low = Math.min(last.low, tick.price);
            last.close = tick.price;
            last.volume += tick.size;
          } else {
            base.push({
              time: bucketTime,
              open: tick.price,
              high: tick.price,
              low: tick.price,
              close: tick.price,
              volume: tick.size,
            });
            if (base.length > 600) base.shift();
          }
        } else {
          base.push({
            time: bucketTime,
            open: tick.price,
            high: tick.price,
            low: tick.price,
            close: tick.price,
            volume: tick.size,
          });
        }

        // Throttle UI re-render with RAF for silky 60fps
        dirtyUiRef.current = { spot: tick.price, latency: tick.latencyMs };
        if (!rafPendingRef.current) {
          rafPendingRef.current = true;
          requestAnimationFrame(() => {
            if (dirtyUiRef.current) {
              const currentP = dirtyUiRef.current.spot;
              setSpotPrice(currentP);
              setPriceDirection(currentP > prev ? 'up' : currentP < prev ? 'down' : 'neutral');
              setLatencyStats((prev) => ({
                ...prev,
                binanceWsPingMs: dirtyUiRef.current!.latency,
                lastUpdateTimestamp: Date.now(),
              }));
              refreshActiveCandles();
            }
            rafPendingRef.current = false;
          });
        }
      },
      (connected) => {
        setLatencyStats((prev) => ({ ...prev, binanceWsConnected: connected }));
      }
    );

    return () => {
      isSubscribed = false;
      binanceManagerRef.current?.destroy();
      binanceManagerRef.current = null;
    };
  }, [asset, refreshActiveCandles]);

  // 4. Polymarket 5M Market Resolver & CLOB Stream
  useEffect(() => {
    let isCancelled = false;

    async function loadMarketAndOrderBook() {
      const slug = getPolymarketSlug(asset, currentWindowTs);
      const evt = await fetchEventBySlug(slug);
      if (isCancelled) return;

      if (evt && evt.markets && evt.markets.length > 0) {
        setActiveEvent(evt);
        const m = evt.markets[0];
        setActiveMarket(m);

        let tUp = '';
        let tDown = '';
        try {
          const tokens = typeof m.clobTokenIds === 'string' ? JSON.parse(m.clobTokenIds) : m.clobTokenIds;
          if (Array.isArray(tokens) && tokens.length >= 2) {
            tUp = tokens[0];
            tDown = tokens[1];
          }
        } catch (e) {}

        setUpTokenId(tUp);
        setDownTokenId(tDown);

        if (tUp) {
          // Midpoint
          const mid = await fetchClobMidpoint(tUp);
          if (mid !== null && !isCancelled) {
            setUpPrice(mid);
            setDownPrice(parseFloat((1 - mid).toFixed(3)));
          } else if (m.outcomePrices) {
            try {
              const p = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;
              if (Array.isArray(p) && p.length >= 2) {
                setUpPrice(parseFloat(p[0]));
                setDownPrice(parseFloat(p[1]));
              }
            } catch (e) {}
          }

          // Order Book
          const book = await fetchOrderBook(tUp);
          if (book && !isCancelled) setOrderBook(book);

          // Contract Candle History
          const hist = await fetchContractPricesHistory(tUp, currentWindowTs - 1800, currentWindowTs + 300);
          if (!isCancelled && hist.length > 0) {
            contractBaseCandlesRef.current = hist;
            refreshActiveCandles();
          }

          // Connect / Subscribe CLOB WS
          polyWsManagerRef.current?.subscribeTokens(tUp, tDown);
        }

        if (m.conditionId) {
          const initialTrades = await fetchTradesHistory(m.conditionId);
          if (!isCancelled && initialTrades.length > 0) {
            setTrades(initialTrades);
          }
        }
      }
    }

    loadMarketAndOrderBook();

    // Setup Polymarket CLOB WebSocket
    polyWsManagerRef.current = new PolymarketClobWsManager({
      onTick: (_tokenId, price, size, side) => {
        if (price > 0 && price < 1) {
          setUpPrice(price);
          setDownPrice(parseFloat((1 - price).toFixed(3)));
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const newTrade: TradeItem = {
          id: `trade-${nowSec}-${Math.random().toString(36).substring(2, 6)}`,
          side,
          price,
          size,
          timestamp: nowSec,
          outcome: 'Up',
          pseudonym: 'CLOB Flow',
        };

        setTrades((prev) => [newTrade, ...prev.slice(0, 39)]);

        // Push to contract candle buffer
        const bucketTime = Math.floor(nowSec / 5) * 5;
        const cBase = contractBaseCandlesRef.current;
        if (cBase.length > 0) {
          const last = cBase[cBase.length - 1];
          if (last.time === bucketTime) {
            last.high = Math.max(last.high, price);
            last.low = Math.min(last.low, price);
            last.close = price;
            last.volume += size;
          } else {
            cBase.push({ time: bucketTime, open: price, high: price, low: price, close: price, volume: size });
          }
        }
      },
      onBook: (rawBids, rawAsks) => {
        const bids = rawBids
          .map((b: any) => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
          .sort((a, b) => b.price - a.price);
        const asks = rawAsks
          .map((a: any) => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
          .sort((a, b) => a.price - b.price);

        const bestBid = bids[0]?.price || 0.5;
        const bestAsk = asks[0]?.price || 0.5;
        setOrderBook({
          bids,
          asks,
          lastPrice: (bestBid + bestAsk) / 2,
          bestBid,
          bestAsk,
          spread: Math.max(0, bestAsk - bestBid),
        });
      },
      onStatus: (connected) => {
        setLatencyStats((prev) => ({ ...prev, polymarketWsConnected: connected }));
      },
    });

    // High frequency 2-second fallback polling for CLOB book
    const pollInterval = setInterval(async () => {
      if (!upTokenId) return;
      const b = await fetchOrderBook(upTokenId);
      if (b && !isCancelled) setOrderBook(b);
      const mid = await fetchClobMidpoint(upTokenId);
      if (mid !== null && !isCancelled) {
        setUpPrice(mid);
        setDownPrice(parseFloat((1 - mid).toFixed(3)));
      }
    }, 2000);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
      polyWsManagerRef.current?.destroy();
      polyWsManagerRef.current = null;
    };
  }, [asset, currentWindowTs, upTokenId, refreshActiveCandles]);

  return {
    asset,
    setAsset,
    timeframe,
    setTimeframe,
    chartMode,
    setChartMode,
    chartStyle,
    setChartStyle,
    spotPrice,
    priceDirection,
    upPrice,
    downPrice,
    currentWindowTs,
    settlement,
    activeCandles,
    twapLineData,
    orderBook,
    trades,
    latencyStats,
    activeEvent,
    activeMarket,
  };
}
