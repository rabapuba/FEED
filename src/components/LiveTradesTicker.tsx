import React from 'react';
import { TradeItem } from '../types/market';
import { Activity, ExternalLink } from 'lucide-react';

interface LiveTradesTickerProps {
  trades: TradeItem[];
}

export const LiveTradesTicker: React.FC<LiveTradesTickerProps> = ({ trades }) => {
  return (
    <div className="bg-[#080b11] border border-[#1a2337] rounded-xl p-3 flex flex-col h-full font-mono text-xs shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#161f33] mb-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
        <div className="flex items-center space-x-1.5 text-slate-200">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>LIVE TRANSAKSI (TAPE)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] text-emerald-400 font-bold">STREAM</span>
        </div>
      </div>

      <div className="grid grid-cols-4 pb-1 text-[10px] font-bold text-slate-500 uppercase">
        <span>TIPE</span>
        <span className="text-right">HARGA</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">WAKTU</span>
      </div>

      {/* Trades List */}
      <div className="flex flex-col space-y-1 overflow-y-auto max-h-[320px] scrollbar-thin">
        {trades.length === 0 ? (
          <div className="text-center text-slate-600 py-6 text-xs">Menunggu eksekusi order...</div>
        ) : (
          trades.slice(0, 30).map((t) => {
            const isBuy = t.side === 'BUY';
            const timeStr = new Date(t.timestamp * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            return (
              <div
                key={t.id}
                className="grid grid-cols-4 py-1 px-1.5 hover:bg-[#101726] rounded transition-colors text-[11px] items-center"
              >
                <div className="flex items-center space-x-1">
                  <span
                    className={`px-1 py-0.5 rounded text-[9px] font-black ${
                      isBuy ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {t.side}
                  </span>
                </div>

                <span className={`text-right font-black ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${t.price.toFixed(3)}
                </span>

                <span className="text-right text-slate-300 font-medium">
                  {t.size.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>

                <div className="flex items-center justify-end space-x-1 text-slate-500 text-[10px]">
                  <span>{timeStr}</span>
                  {t.transactionHash && (
                    <a
                      href={`https://polygonscan.com/tx/${t.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
