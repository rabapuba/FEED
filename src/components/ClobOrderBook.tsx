import React from 'react';
import { OrderBookState } from '../types/market';
import { BookOpen } from 'lucide-react';

interface ClobOrderBookProps {
  orderBook: OrderBookState;
}

export const ClobOrderBook: React.FC<ClobOrderBookProps> = ({ orderBook }) => {
  const { bids, asks, lastPrice, spread } = orderBook;

  // Display top 7 asks (reversed to show lowest ask nearest to mid) and top 7 bids
  const displayAsks = asks.slice(0, 7).reverse();
  const displayBids = bids.slice(0, 7);

  const maxAskSize = Math.max(...displayAsks.map((a) => a.size), 10);
  const maxBidSize = Math.max(...displayBids.map((b) => b.size), 10);
  const maxSize = Math.max(maxAskSize, maxBidSize);

  return (
    <div className="bg-[#080b11] border border-[#1a2337] rounded-xl p-3 flex flex-col h-full font-mono text-xs shadow-xl select-none">
      {/* Book Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#161f33] mb-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
        <div className="flex items-center space-x-1.5 text-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>ORDER BOOK (CLOB)</span>
        </div>
        <span className="text-[10px] text-slate-500 font-normal">POLYGON L2</span>
      </div>

      <div className="grid grid-cols-3 pb-1 text-[10px] font-bold text-slate-500 uppercase">
        <span>HARGA</span>
        <span className="text-right">JUMLAH</span>
        <span className="text-right">TOTAL</span>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="flex flex-col space-y-0.5 overflow-hidden flex-1 justify-end">
        {displayAsks.length === 0 ? (
          <div className="text-center text-slate-600 py-3 text-[11px]">Memuat buku order...</div>
        ) : (
          displayAsks.map((ask, idx) => {
            const depthPct = Math.min(100, Math.max(5, (ask.size / maxSize) * 100));
            return (
              <div
                key={`ask-${idx}`}
                className="relative grid grid-cols-3 py-0.5 px-1.5 hover:bg-rose-950/20 rounded cursor-pointer transition-colors"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-r pointer-events-none"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="relative z-10 text-rose-400 font-black">
                  ${ask.price.toFixed(3)}
                </span>
                <span className="relative z-10 text-slate-300 font-medium text-right">
                  {ask.size.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="relative z-10 text-slate-500 text-right">
                  ${(ask.price * ask.size).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Mid Price & Spread Bar */}
      <div className="my-1.5 py-1.5 px-2.5 bg-[#0e1422] border border-[#1e2a44] rounded-lg flex items-center justify-between shadow-inner">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 text-[10px] font-bold">MID:</span>
          <span className="font-black text-sm text-white">${lastPrice.toFixed(3)}</span>
        </div>
        <div className="text-[10px] text-slate-400 font-bold">
          SPREAD: <span className="text-amber-400 font-black">${spread.toFixed(3)}</span>
        </div>
      </div>

      {/* Bids (Buy Orders) */}
      <div className="flex flex-col space-y-0.5 overflow-hidden flex-1">
        {displayBids.length === 0 ? (
          <div className="text-center text-slate-600 py-3 text-[11px]">Memuat antrean beli...</div>
        ) : (
          displayBids.map((bid, idx) => {
            const depthPct = Math.min(100, Math.max(5, (bid.size / maxSize) * 100));
            return (
              <div
                key={`bid-${idx}`}
                className="relative grid grid-cols-3 py-0.5 px-1.5 hover:bg-emerald-950/20 rounded cursor-pointer transition-colors"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-r pointer-events-none"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="relative z-10 text-emerald-400 font-black">
                  ${bid.price.toFixed(3)}
                </span>
                <span className="relative z-10 text-slate-300 font-medium text-right">
                  {bid.size.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="relative z-10 text-slate-500 text-right">
                  ${(bid.price * bid.size).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
