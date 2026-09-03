import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle, Zap } from 'lucide-react';
import { RoundSettlementState, ThemeMode } from '../types/market';

interface CompactOddsBarProps {
  upPrice: number;
  downPrice: number;
  settlement: RoundSettlementState;
  theme?: ThemeMode;
}

export const CompactOddsBar: React.FC<CompactOddsBarProps> = ({
  upPrice,
  downPrice,
  settlement,
  theme = 'dark',
}) => {
  const { strikePrice, isUpWinning, runningTwap } = settlement;
  const isDark = theme === 'dark';

  const upPct = Math.round(upPrice * 100);
  const downPct = Math.round(downPrice * 100);

  const upRoi = upPrice > 0 ? ((1 / upPrice) - 1) * 100 : 0;
  const downRoi = downPrice > 0 ? ((1 / downPrice) - 1) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full font-mono select-none flex-shrink-0">
      
      {/* UP (NAIK) ULTRA-VIBRANT CARD */}
      <div
        className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
          isUpWinning
            ? isDark
              ? 'bg-gradient-to-r from-[#02381b] via-[#044220] to-[#022b15] border-[#00ff88] shadow-[0_0_25px_rgba(0,255,136,0.35)] ring-2 ring-[#00ff88]/50'
              : 'bg-emerald-100/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400'
            : isDark
            ? 'bg-[#06140d]/80 border-emerald-950/80 opacity-75 hover:opacity-100'
            : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black border-2 transition-all ${
              isUpWinning
                ? 'bg-[#00ff88] text-slate-950 border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.6)] animate-pulse'
                : isDark
                ? 'bg-emerald-950/60 text-emerald-500 border-emerald-800/40'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
          >
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm sm:text-base font-black tracking-tight ${
                isUpWinning
                  ? isDark ? 'text-white' : 'text-slate-950'
                  : isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                UP (NAIK)
              </span>

              {isUpWinning && (
                <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00ff88] text-slate-950 shadow-sm animate-pulse">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>MEMIMPIN</span>
                </span>
              )}
            </div>

            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Target Strike: <span className="font-extrabold text-cyan-400">≥ ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        {/* Right side: Large Odds & ROI */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight leading-none block ${
                isUpWinning
                  ? 'text-[#00ff88] drop-shadow-[0_0_12px_rgba(0,255,136,0.8)]'
                  : 'text-emerald-500'
              }`}
            >
              {(upPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#00ff88] block mt-0.5">
              +{upRoi.toFixed(0)}% ROI
            </span>
          </div>

          <div
            className={`w-14 text-center py-1 px-1 rounded-xl border-2 transition-all ${
              isUpWinning
                ? 'bg-[#00ff88]/20 border-[#00ff88] text-white shadow-sm'
                : isDark
                ? 'bg-[#0e2116] border-emerald-900/50 text-slate-300'
                : 'bg-emerald-50 border-emerald-200 text-slate-800'
            }`}
          >
            <span className="text-sm font-black block leading-none text-[#00ff88]">
              {upPct}%
            </span>
            <span className="text-[8px] text-slate-400 block uppercase font-bold mt-0.5">
              Peluang
            </span>
          </div>
        </div>
      </div>

      {/* DOWN (TURUN) ULTRA-VIBRANT CARD */}
      <div
        className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center justify-between relative overflow-hidden ${
          !isUpWinning
            ? isDark
              ? 'bg-gradient-to-r from-[#3d0a15] via-[#4a0d1a] to-[#300710] border-[#ff2a5f] shadow-[0_0_25px_rgba(255,42,95,0.35)] ring-2 ring-[#ff2a5f]/50'
              : 'bg-rose-100/90 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-400'
            : isDark
            ? 'bg-[#17060a]/80 border-rose-950/80 opacity-75 hover:opacity-100'
            : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black border-2 transition-all ${
              !isUpWinning
                ? 'bg-[#ff2a5f] text-white border-[#ff2a5f] shadow-[0_0_15px_rgba(255,42,95,0.6)] animate-pulse'
                : isDark
                ? 'bg-rose-950/60 text-rose-500 border-rose-800/40'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            <TrendingDown className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm sm:text-base font-black tracking-tight ${
                !isUpWinning
                  ? isDark ? 'text-white' : 'text-slate-950'
                  : isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                DOWN (TURUN)
              </span>

              {!isUpWinning && (
                <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#ff2a5f] text-white shadow-sm animate-pulse">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>MEMIMPIN</span>
                </span>
              )}
            </div>

            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Target Strike: <span className="font-extrabold text-cyan-400">&lt; ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        {/* Right side: Large Odds & ROI */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight leading-none block ${
                !isUpWinning
                  ? 'text-[#ff2a5f] drop-shadow-[0_0_12px_rgba(255,42,95,0.8)]'
                  : 'text-rose-500'
              }`}
            >
              {(downPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#ff4d79] block mt-0.5">
              +{downRoi.toFixed(0)}% ROI
            </span>
          </div>

          <div
            className={`w-14 text-center py-1 px-1 rounded-xl border-2 transition-all ${
              !isUpWinning
                ? 'bg-[#ff2a5f]/20 border-[#ff2a5f] text-white shadow-sm'
                : isDark
                ? 'bg-[#290d14] border-rose-900/50 text-slate-300'
                : 'bg-rose-50 border-rose-200 text-slate-800'
            }`}
          >
            <span className="text-sm font-black block leading-none text-[#ff2a5f]">
              {downPct}%
            </span>
            <span className="text-[8px] text-slate-400 block uppercase font-bold mt-0.5">
              Peluang
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
