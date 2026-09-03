import { CryptoAsset, PolymarketEvent, OrderBookState, TradeItem, OHLCData } from '../types/market';

export const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
export const CLOB_API_BASE = 'https://clob.polymarket.com';
export const DATA_API_BASE = 'https://data-api.polymarket.com';
export const CLOB_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

/**
 * Returns current 5-minute floor timestamp in seconds.
 */
export function get5MinWindowTimestamp(offsetSec: number = 0): number {
  const now = Math.floor(Date.now() / 1000) + offsetSec;
  return Math.floor(now / 300) * 300;
}

/**
 * Formats window timestamp into HH:MM - HH:MM string (local time).
 */
export function formatWindowTimeRange(windowTs: number): string {
  const start = new Date(windowTs * 1000);
  const end = new Date((windowTs + 300) * 1000);
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(start)} - ${fmt(end)}`;
}

/**
 * Generates the Polymarket slug for an asset and window timestamp.
 * e.g. btc-updown-5m-1788450300
 */
export function getPolymarketSlug(asset: CryptoAsset, windowTs: number): string {
  const sym = asset.toLowerCase();
  return `${sym}-updown-5m-${windowTs}`;
}

/**
 * Fetches Polymarket Event by slug from Gamma API.
 */
export async function fetchEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  try {
    const res = await fetch(`${GAMMA_API_BASE}/events?slug=${slug}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as PolymarketEvent;
    }
    return null;
  } catch (err) {
    console.error(`[Polymarket API] Error fetching event for ${slug}:`, err);
    return null;
  }
}

/**
 * Fetches CLOB Midpoint price for a token.
 */
export async function fetchClobMidpoint(tokenId: string): Promise<number | null> {
  try {
    const res = await fetch(`${CLOB_API_BASE}/midpoint?token_id=${tokenId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.mid) {
      const mid = parseFloat(data.mid);
      if (!isNaN(mid) && mid > 0) return mid;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetches current CLOB order book snapshot.
 */
export async function fetchOrderBook(tokenId: string): Promise<OrderBookState | null> {
  try {
    const res = await fetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`);
    if (!res.ok) return null;
    const data = await res.json();

    const rawBids = Array.isArray(data.bids) ? data.bids : [];
    const rawAsks = Array.isArray(data.asks) ? data.asks : [];

    const bids = rawBids
      .map((b: any) => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
      .filter((b: any) => b.price >= 0.001 && b.price <= 0.999)
      .sort((a: any, b: any) => b.price - a.price);

    const asks = rawAsks
      .map((a: any) => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
      .filter((a: any) => a.price >= 0.001 && a.price <= 0.999)
      .sort((a: any, b: any) => a.price - b.price);

    const bestBid = bids[0]?.price || 0.5;
    const bestAsk = asks[0]?.price || 0.5;
    const lastPrice = (bestBid + bestAsk) / 2;
    const spread = Math.max(0, bestAsk - bestBid);

    return {
      bids,
      asks,
      lastPrice,
      bestBid,
      bestAsk,
      spread,
    };
  } catch (err) {
    console.error('[Polymarket API] Error fetching orderbook:', err);
    return null;
  }
}

/**
 * Fetches recent trades history for a market conditionId.
 */
export async function fetchTradesHistory(conditionId: string): Promise<TradeItem[]> {
  try {
    const res = await fetch(`${DATA_API_BASE}/trades?market=${conditionId}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((t: any, index: number) => ({
      id: `${t.transactionHash || t.timestamp}-${index}`,
      side: t.side === 'BUY' ? 'BUY' : 'SELL',
      price: parseFloat(t.price),
      size: parseFloat(t.size),
      timestamp: t.timestamp,
      outcome: t.outcome === 'Up' ? 'Up' : 'Down',
      transactionHash: t.transactionHash,
      pseudonym: t.pseudonym || t.name || 'Trader',
    }));
  } catch (err) {
    console.error('[Polymarket API] Error fetching trades history:', err);
    return [];
  }
}

/**
 * Fetches historical price history from Polymarket CLOB and builds continuous candles.
 */
export async function fetchContractPricesHistory(tokenId: string, startTs: number, endTs: number): Promise<OHLCData[]> {
  try {
    const url = `${CLOB_API_BASE}/prices-history?market=${tokenId}&startTs=${startTs}&endTs=${endTs}&fidelity=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const history = data.history || [];

    if (history.length === 0) return [];

    const minuteMap = new Map<number, { prices: number[]; time: number }>();

    for (const item of history) {
      const t = item.t;
      const p = parseFloat(item.p);
      if (isNaN(p) || p <= 0) continue;
      const minuteTime = Math.floor(t / 60) * 60;

      if (!minuteMap.has(minuteTime)) {
        minuteMap.set(minuteTime, { prices: [], time: minuteTime });
      }
      minuteMap.get(minuteTime)!.prices.push(p);
    }

    const candles: OHLCData[] = [];
    const sortedMinutes = Array.from(minuteMap.keys()).sort((a, b) => a - b);

    for (const mTime of sortedMinutes) {
      const bucket = minuteMap.get(mTime)!;
      const ps = bucket.prices;
      candles.push({
        time: mTime,
        open: ps[0],
        high: Math.max(...ps),
        low: Math.min(...ps),
        close: ps[ps.length - 1],
        volume: ps.length * 100,
      });
    }

    return candles;
  } catch (err) {
    return [];
  }
}

/**
 * Real-time Polymarket CLOB WebSocket client with auto-resubscription.
 */
export class PolymarketClobWsManager {
  private ws: WebSocket | null = null;
  private upTokenId: string = '';
  private downTokenId: string = '';
  private reconnectTimer: any = null;
  private isDestroyed = false;

  private onTickCallback: ((token: string, price: number, size: number, side: 'BUY' | 'SELL') => void) | null = null;
  private onBookCallback: ((bids: any[], asks: any[]) => void) | null = null;
  private onStatusCallback: ((connected: boolean) => void) | null = null;

  constructor(
    callbacks: {
      onTick: (token: string, price: number, size: number, side: 'BUY' | 'SELL') => void;
      onBook?: (bids: any[], asks: any[]) => void;
      onStatus?: (connected: boolean) => void;
    }
  ) {
    this.onTickCallback = callbacks.onTick;
    this.onBookCallback = callbacks.onBook || null;
    this.onStatusCallback = callbacks.onStatus || null;
  }

  public subscribeTokens(upToken: string, downToken: string) {
    this.upTokenId = upToken;
    this.downTokenId = downToken;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      this.sendSub();
    }
  }

  private connect() {
    if (this.isDestroyed || !this.upTokenId) return;

    try {
      this.ws = new WebSocket(CLOB_WS_URL);

      this.ws.onopen = () => {
        this.onStatusCallback?.(true);
        this.sendSub();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const item = Array.isArray(data) ? data[0] : data;
          if (!item) return;

          if (item.asset_id === this.upTokenId) {
            // Book updates
            if (item.bids || item.asks) {
              this.onBookCallback?.(item.bids || [], item.asks || []);
            }

            // Price change ticks
            if (item.price_changes) {
              for (const pc of item.price_changes) {
                const price = parseFloat(pc.price);
                const size = parseFloat(pc.size || '10');
                const side = pc.side === 'BUY' ? 'BUY' : 'SELL';
                this.onTickCallback?.(item.asset_id, price, size, side);
              }
            }
          }
        } catch (e) {
          // parse error
        }
      };

      this.ws.onerror = () => {
        this.onStatusCallback?.(false);
      };

      this.ws.onclose = () => {
        this.onStatusCallback?.(false);
        if (!this.isDestroyed) {
          this.reconnectTimer = setTimeout(() => this.connect(), 2500);
        }
      };
    } catch (err) {
      if (!this.isDestroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 2500);
      }
    }
  }

  private sendSub() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.upTokenId) {
      const assets = [this.upTokenId];
      if (this.downTokenId) assets.push(this.downTokenId);

      this.ws.send(JSON.stringify({
        type: 'market',
        assets_ids: assets,
      }));
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.onTickCallback = null;
    this.onBookCallback = null;
    this.onStatusCallback = null;
  }
}
