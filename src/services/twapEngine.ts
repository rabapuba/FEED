import { OHLCData, TimeFrame, RoundSettlementState } from '../types/market';

/**
 * Real-time Chainlink TWAP (Time-Weighted Average Price) Accumulator
 * Calculates exact running settlement benchmark for 5-minute Polymarket Up/Down rounds.
 */
export class TwapEngine {
  private windowTs: number = 0;
  private strikePrice: number = 0;
  private secondPriceMap: Map<number, number> = new Map(); // second -> price

  constructor(windowTs: number, initialStrike: number = 0) {
    this.resetWindow(windowTs, initialStrike);
  }

  public resetWindow(windowTs: number, strikePrice: number = 0) {
    this.windowTs = windowTs;
    this.strikePrice = strikePrice > 0 ? strikePrice : 0;
    this.secondPriceMap.clear();
  }

  public setStrikePrice(price: number) {
    if (this.strikePrice === 0 && price > 0) {
      this.strikePrice = price;
    }
  }

  public recordPrice(price: number, timestampSec: number) {
    if (price <= 0) return;

    // Only record within current window
    if (timestampSec >= this.windowTs && timestampSec <= this.windowTs + 300) {
      const secondIndex = timestampSec - this.windowTs;
      this.secondPriceMap.set(secondIndex, price);

      if (this.strikePrice === 0) {
        this.strikePrice = price;
      }
    }
  }

  /**
   * Calculates real-time running settlement statistics for the active round.
   * Fully protected against period transition division-by-zero or NaN.
   */
  public computeRoundSettlement(currentPrice: number, nowSec: number): RoundSettlementState {
    const elapsedRaw = Math.max(0, nowSec - this.windowTs);
    const elapsed = Math.min(300, elapsedRaw);
    const secondsLeft = Math.max(0, 300 - elapsed);
    const progressPct = Math.min(100, Math.max(0, (elapsed / 300) * 100));

    const strike = this.strikePrice > 0 ? this.strikePrice : (currentPrice > 0 ? currentPrice : 1);

    // Calculate TWAP across elapsed seconds
    let runningTwap = currentPrice > 0 ? currentPrice : strike;
    if (this.secondPriceMap.size > 0 && elapsed > 0) {
      let sumPrice = 0;
      let lastKnown = strike;

      for (let s = 0; s <= elapsed; s++) {
        if (this.secondPriceMap.has(s)) {
          lastKnown = this.secondPriceMap.get(s)!;
        }
        sumPrice += lastKnown;
      }
      runningTwap = sumPrice / (elapsed + 1);
    } else {
      runningTwap = strike;
    }

    const strikeDelta = currentPrice > 0 ? currentPrice - strike : 0;
    const strikeDeltaPct = strike > 0 ? (strikeDelta / strike) * 100 : 0;

    const twapDelta = runningTwap - strike;
    const twapDeltaPct = strike > 0 ? (twapDelta / strike) * 100 : 0;

    // Required price to flip result before window close
    let requiredPriceToFlip = strike;
    if (secondsLeft > 0 && elapsed > 0) {
      const currentSum = runningTwap * (elapsed + 1);
      const remainingSec = Math.max(1, 300 - elapsed);
      const neededSum = (strike * 300) - currentSum;
      const target = neededSum / remainingSec;
      requiredPriceToFlip = isFinite(target) && !isNaN(target) ? Math.max(0, target) : strike;
    }

    const isUpWinning = runningTwap >= strike;
    const isUrgent = secondsLeft <= 60 && secondsLeft > 0;
    const isCritical = secondsLeft <= 15 && secondsLeft > 0;

    return {
      currentWindowTs: this.windowTs,
      secondsLeft,
      strikePrice: strike,
      currentPrice: currentPrice > 0 ? currentPrice : strike,
      runningTwap,
      strikeDelta,
      strikeDeltaPct,
      twapDelta,
      twapDeltaPct,
      requiredPriceToFlip,
      isUpWinning,
      isUrgent,
      isCritical,
      progressPct,
    };
  }
}

/**
 * Aggregates granular candles into target timeframe candles.
 */
export function aggregateCandles(candles: OHLCData[], tf: TimeFrame, maxCount: number = 300): OHLCData[] {
  if (candles.length === 0) return [];

  const tfSecondsMap: Record<TimeFrame, number> = {
    '5s': 5,
    '15s': 15,
    '30s': 30,
    '1m': 60,
    '5m': 300,
    '15m': 900,
  };

  const periodSec = tfSecondsMap[tf] || 60;
  const bucketMap = new Map<number, OHLCData>();

  for (const c of candles) {
    const bucketTime = Math.floor(c.time / periodSec) * periodSec;
    const existing = bucketMap.get(bucketTime);

    if (!existing) {
      bucketMap.set(bucketTime, {
        time: bucketTime,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
      existing.volume += c.volume;
    }
  }

  const sorted = Array.from(bucketMap.values()).sort((a, b) => a.time - b.time);
  return sorted.slice(-maxCount);
}

/**
 * Merges two candle arrays without duplicate timestamps.
 */
export function mergeCandleArrays(existing: OHLCData[], incoming: OHLCData[], maxCount: number = 300): OHLCData[] {
  const map = new Map<number, OHLCData>();
  for (const c of existing) map.set(c.time, c);
  for (const c of incoming) {
    const prev = map.get(c.time);
    if (!prev) {
      map.set(c.time, c);
    } else {
      map.set(c.time, {
        time: c.time,
        open: prev.open,
        high: Math.max(prev.high, c.high),
        low: Math.min(prev.low, c.low),
        close: c.close,
        volume: Math.max(prev.volume, c.volume),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.time - b.time).slice(-maxCount);
}

/**
 * Converts regular candlestick data to Heikin-Ashi candles for smooth trend visualization.
 */
export function toHeikinAshi(candles: OHLCData[]): OHLCData[] {
  if (candles.length === 0) return [];

  const haCandles: OHLCData[] = [];
  let prevHaOpen = candles[0].open;
  let prevHaClose = candles[0].close;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return haCandles;
}
