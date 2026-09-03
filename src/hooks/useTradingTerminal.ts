import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CryptoAsset,
  TimeFrame,
  ChartMode,
  ChartStyle,
  ThemeMode,
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
  fetchMultiWindowContractHistory,
  loadCachedContractCandles,
  saveCachedContractCandles,
  mergeCandles,
  PolymarketClobWsManager,
} from '../services/polymarketFeed';
import {
  TwapEngine,
  aggregateCandles,
  toHeikinAshi,
} from '../services/twapEngine';

export function useTradingTerminal() {
  const [asset, setAsset] = useState<CryptoAsset>('BTC');
  const [timeframe, setTimeframe] = useState<TimeFrame>('1m');
  const [chartMode, setChartMode] = useState<ChartMode>('SPOT');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');

  // Theme Mode (Dark / Light)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('terminal_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem('terminal_theme', t);
      if (t === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Initial sync of html class
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Prediction Line (Proyeksi 30s) State
  const [showPrediction, setShowPrediction] = useState<boolean>(true);
  const [predictedPrice, setPredictedPrice] = useState<number>(0);
  const priceRollingQueueRef = useRef<Array<{ time: number; price: number }>>([]);

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

  // Candlestick Storage (Granular 5s base buffers)
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
  const latestContractRef = useRef<number>(0.5);
  const strikePriceRef = useRef<number>(0);
  const currentWindowRef = useRef<number>(currentWindowTs);
  currentWindowRef.current = currentWindowTs;

  // RAF Throttling for UI
  const rafPendingRef = useRef<boolean>(false);

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
    const isSpot = chartMode === 'SPOT';
    const base = isSpot ? spotBaseCandlesRef.current : contractBaseCandlesRef.current;
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

  // 3. Process Live Option / Contract Tick
  const processContractTick = useCallback((price: number, size: number, timestampSec: number) => {
    if (price > 0 && price < 1) {
      setUpPrice(price);
      setDownPrice(parseFloat((1 - price).toFixed(3)));
      latestContractRef.current = price;

      const bucketTime = Math.floor(timestampSec / 5) * 5;
      const base = contractBaseCandlesRef.current;
      if (base.length > 0) {
        const last = base[base.length - 1];
        if (last.time === bucketTime) {
          last.high = Math.max(last.high, price);
          last.low = Math.min(last.low, price);
          last.close = price;
          last.volume += size;
        } else {
          base.push({ time: bucketTime, open: price, high: price, low: price, close: price, volume: size });
          if (base.length > 600) base.shift();
        }
      } else {
        base.push({ time: bucketTime, open: price, high: price, low: price, close: price, volume: size });
      }

      saveCachedContractCandles(asset, base);

      if (chartMode === 'CONTRACT') {
        refreshActiveCandles();
      }
    }
  }, [asset, chartMode, refreshActiveCandles]);

  // 4. Binance Low Latency Stream Manager (Spot Data)
  useEffect(() => {
    let isSubscribed = true;

    async function loadSpotHistory() {
      const klines1m = await fetchBinanceKlines(asset, '1m', 150);
      if (!isSubscribed || klines1m.length === 0) return;

      spotBaseCandlesRef.current = klines1m;
      const lastCandle = klines1m[klines1m.length - 1];
      latestSpotRef.current = lastCandle.close;
      setSpotPrice(lastCandle.close);

      const startCandle = klines1m.find((c) => c.time === currentWindowRef.current) || lastCandle;
      strikePriceRef.current = startCandle.open || startCandle.close;
      twapEngineRef.current.setStrikePrice(strikePriceRef.current);

      if (chartMode === 'SPOT') {
        refreshActiveCandles();
      }
    }

    loadSpotHistory();

    binanceManagerRef.current = new BinanceStreamManager(
      asset,
      (tick) => {
        const prev = latestSpotRef.current;
        latestSpotRef.current = tick.price;

        // Calculate 30s Prediction (Rolling 15s Momentum Velocity)
        const nowMs = Date.now();
        priceRollingQueueRef.current.push({ time: nowMs, price: tick.price });
        priceRollingQueueRef.current = priceRollingQueueRef.current.filter((item) => nowMs - item.time <= 15000);

        if (priceRollingQueueRef.current.length >= 2) {
          const oldest = priceRollingQueueRef.current[0];
          const dtSec = (nowMs - oldest.time) / 1000;
          if (dtSec > 0.5) {
            const velocity = (tick.price - oldest.price) / dtSec; // $/sec
            const projected = tick.price + (velocity * 30);
            setPredictedPrice(projected);
          }
        } else {
          setPredictedPrice(tick.price);
        }

        // Micro-update active spot candle buffer
        const nowSec = tick.timeSec;
        const bucketTime = Math.floor(nowSec / 5) * 5;
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

        // Throttle UI re-render
        if (!rafPendingRef.current) {
          rafPendingRef.current = true;
          requestAnimationFrame(() => {
            setSpotPrice(tick.price);
            setPriceDirection(tick.price > prev ? 'up' : tick.price < prev ? 'down' : 'neutral');
            setLatencyStats((prev) => ({
              ...prev,
              binanceWsPingMs: tick.latencyMs,
              lastUpdateTimestamp: Date.now(),
            }));
            if (chartMode === 'SPOT') {
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
  }, [asset, chartMode, refreshActiveCandles]);

  // 5. Polymarket Contract History & Multi-Window Loading
  useEffect(() => {
    let isCancelled = false;

    // Load cached contract candles first for zero delay
    const cached = loadCachedContractCandles(asset);
    if (cached.length > 0) {
      contractBaseCandlesRef.current = cached;
      if (chartMode === 'CONTRACT') {
        refreshActiveCandles();
      }
    }

    async function loadContractMultiWindow() {
      try {
        const multiHistory = await fetchMultiWindowContractHistory(asset, currentWindowTs, 12);
        if (!isCancelled && multiHistory.length > 0) {
          contractBaseCandlesRef.current = mergeCandles(contractBaseCandlesRef.current, multiHistory, 300);
          saveCachedContractCandles(asset, contractBaseCandlesRef.current);
          if (chartMode === 'CONTRACT') {
            refreshActiveCandles();
          }
        }
      } catch (e) {
        console.error('Failed to load multi-window contract history:', e);
      }
    }

    loadContractMultiWindow();

    return () => {
      isCancelled = true;
    };
  }, [asset, currentWindowTs, chartMode, refreshActiveCandles]);

  // 6. Polymarket 5M Active Event & Live CLOB WebSocket
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
            processContractTick(mid, 10, Math.floor(Date.now() / 1000));
          } else if (m.outcomePrices) {
            try {
              const p = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;
              if (Array.isArray(p) && p.length >= 2) {
                const p0 = parseFloat(p[0]);
                setUpPrice(p0);
                setDownPrice(parseFloat(p[1]));
                processContractTick(p0, 10, Math.floor(Date.now() / 1000));
              }
            } catch (e) {}
          }

          // Order Book
          const book = await fetchOrderBook(tUp);
          if (book && !isCancelled) setOrderBook(book);

          // Recent token price history
          const hist = await fetchContractPricesHistory(tUp, currentWindowTs - 600, currentWindowTs + 300);
          if (!isCancelled && hist.length > 0) {
            contractBaseCandlesRef.current = mergeCandles(contractBaseCandlesRef.current, hist, 300);
            saveCachedContractCandles(asset, contractBaseCandlesRef.current);
            if (chartMode === 'CONTRACT') {
              refreshActiveCandles();
            }
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
        const nowSec = Math.floor(Date.now() / 1000);
        processContractTick(price, size, nowSec);

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

    // High frequency 1.5-second fallback polling for CLOB book & price
    const pollInterval = setInterval(async () => {
      if (!upTokenId) return;
      const b = await fetchOrderBook(upTokenId);
      if (b && !isCancelled) setOrderBook(b);
      const mid = await fetchClobMidpoint(upTokenId);
      if (mid !== null && !isCancelled) {
        setUpPrice(mid);
        setDownPrice(parseFloat((1 - mid).toFixed(3)));
        processContractTick(mid, 10, Math.floor(Date.now() / 1000));
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
      polyWsManagerRef.current?.destroy();
      polyWsManagerRef.current = null;
    };
  }, [asset, currentWindowTs, upTokenId, chartMode, processContractTick, refreshActiveCandles]);

  return {
    asset,
    setAsset,
    timeframe,
    setTimeframe,
    chartMode,
    setChartMode,
    chartStyle,
    setChartStyle,
    theme,
    setTheme,
    toggleTheme,
    showPrediction,
    setShowPrediction,
    predictedPrice,
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
