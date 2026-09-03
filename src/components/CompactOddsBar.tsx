import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
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
  const { strikePrice, isUpWinning } = settlement;
  const isDark = theme === 'dark';

  const upPct = Math.round(upPrice * 100);
  const downPct = Math.round(downPrice * 100);

  const upRoi = upPrice > 0 ? ((1 / upPrice) - 1) * 100 : 0;
  const downRoi = downPrice > 0 ? ((1 / downPrice) - 1) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full font-mono select-none">
      {/* UP PRO CARD */}
      <div
        className={`p-3 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden ${
          isUpWinning
            ? isDark
              ? 'bg-gradient-to-r from-emerald-950/70 via-[#0d1c1c] to-[#0a1218] border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
              : 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-400'
            : isDark
            ? 'bg-[#0b101a] border-[#1a2337] opacity-80 hover:opacity-100'
            : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black border ${
              isUpWinning
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
                : 'bg-slate-800/40 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                UP (NAIK)
              </span>
              {isUpWinning && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
            <div className="text-[10px] text-slate-500">
              Target: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>≥ ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-emerald-500 leading-none block">
              {(upPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              +{upRoi.toFixed(0)}% ROI
            </span>
          </div>
          <div
            className={`w-12 text-center py-1 px-1.5 rounded-lg border ${
              isDark ? 'bg-[#131d2b] border-[#223048]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{upPct}%</span>
            <span className="text-[8px] text-slate-500 block uppercase">Peluang</span>
          </div>
        </div>
      </div>

      {/* DOWN PRO CARD */}
      <div
        className={`p-3 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden ${
          !isUpWinning
            ? isDark
              ? 'bg-gradient-to-r from-rose-950/70 via-[#1c0d16] to-[#120a10] border-rose-500/80 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
              : 'bg-rose-50 border-rose-500 shadow-md ring-1 ring-rose-400'
            : isDark
            ? 'bg-[#0b101a] border-[#1a2337] opacity-80 hover:opacity-100'
            : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black border ${
              !isUpWinning
                ? 'bg-rose-500/20 text-rose-500 border-rose-500/50'
                : 'bg-slate-800/40 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                DOWN (TURUN)
              </span>
              {!isUpWinning && <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />}
            </div>
            <div className="text-[10px] text-slate-500">
              Target: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>&lt; ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-rose-500 leading-none block">
              {(downPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[10px] text-rose-600 font-bold">
              +{downRoi.toFixed(0)}% ROI
            </span>
          </div>
          <div
            className={`w-12 text-center py-1 px-1.5 rounded-lg border ${
              isDark ? 'bg-[#131d2b] border-[#223048]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{downPct}%</span>
            <span className="text-[8px] text-slate-500 block uppercase">Peluang</span>
          </div>
        </div>
      </div>
    </div>
  );
};
