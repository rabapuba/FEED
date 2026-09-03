import React from 'react';
import { TradeItem, ThemeMode } from '../types/market';
import { Activity, ExternalLink } from 'lucide-react';

interface LiveTradesTickerProps {
  trades: TradeItem[];
  theme?: ThemeMode;
}

export const LiveTradesTicker: React.FC<LiveTradesTickerProps> = ({ trades, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-xl p-2 flex flex-col h-full min-h-0 font-mono text-xs shadow-md select-none transition-colors overflow-hidden ${
        isDark ? 'bg-[#080b11] border-[#1a2337]' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-1 border-b mb-1 font-bold text-[10px] uppercase tracking-wider flex-shrink-0 ${
          isDark ? 'border-[#161f33] text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3 text-emerald-500" />
          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>LIVE TRANSAKSI (TAPE)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[9px] text-emerald-500 font-bold">STREAM</span>
        </div>
      </div>

      <div className="grid grid-cols-4 pb-0.5 text-[9px] font-bold text-slate-400 uppercase flex-shrink-0">
        <span>TIPE</span>
        <span className="text-right">HARGA</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">WAKTU</span>
      </div>

      {/* Trades List */}
      <div className="flex flex-col space-y-0.5 overflow-y-auto flex-1 min-h-0 scrollbar-thin">
        {trades.length === 0 ? (
          <div className="text-center text-slate-400 py-4 text-xs">Menunggu eksekusi order...</div>
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
                className={`grid grid-cols-4 py-0.5 px-1 rounded transition-colors text-[10px] items-center ${
                  isDark ? 'hover:bg-[#101726]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-black ${
                      isBuy ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                    }`}
                  >
                    {t.side}
                  </span>
                </div>

                <span className={`text-right font-black ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ${t.price.toFixed(3)}
                </span>

                <span className={`text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.size.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>

                <div className="flex items-center justify-end space-x-1 text-slate-400 text-[9px]">
                  <span>{timeStr}</span>
                  {t.transactionHash && (
                    <a
                      href={`https://polygonscan.com/tx/${t.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
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
