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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full font-mono select-none flex-shrink-0">
      {/* UP PRO CARD */}
      <div
        className={`px-3 py-1.5 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden ${
          isUpWinning
            ? isDark
              ? 'bg-gradient-to-r from-emerald-950/70 via-[#0d1c1c] to-[#0a1218] border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/40'
              : 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-400'
            : isDark
            ? 'bg-[#0b101a] border-[#1a2337] opacity-80 hover:opacity-100'
            : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black border ${
              isUpWinning
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
                : 'bg-slate-800/40 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className={`text-xs font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                UP (NAIK)
              </span>
              {isUpWinning && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
            <div className="text-[9px] text-slate-500">
              Target: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>≥ ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-base sm:text-lg font-black text-emerald-500 leading-none block">
              {(upPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[9px] text-emerald-600 font-bold">
              +{upRoi.toFixed(0)}% ROI
            </span>
          </div>
          <div
            className={`w-11 text-center py-0.5 px-1 rounded-lg border ${
              isDark ? 'bg-[#131d2b] border-[#223048]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{upPct}%</span>
            <span className="text-[7px] text-slate-500 block uppercase">Peluang</span>
          </div>
        </div>
      </div>

      {/* DOWN PRO CARD */}
      <div
        className={`px-3 py-1.5 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden ${
          !isUpWinning
            ? isDark
              ? 'bg-gradient-to-r from-rose-950/70 via-[#1c0d16] to-[#120a10] border-rose-500/80 shadow-sm ring-1 ring-rose-500/40'
              : 'bg-rose-50 border-rose-500 shadow-sm ring-1 ring-rose-400'
            : isDark
            ? 'bg-[#0b101a] border-[#1a2337] opacity-80 hover:opacity-100'
            : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black border ${
              !isUpWinning
                ? 'bg-rose-500/20 text-rose-500 border-rose-500/50'
                : 'bg-slate-800/40 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className={`text-xs font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                DOWN (TURUN)
              </span>
              {!isUpWinning && <CheckCircle2 className="w-3 h-3 text-rose-500" />}
            </div>
            <div className="text-[9px] text-slate-500">
              Target: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>&lt; ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-base sm:text-lg font-black text-rose-500 leading-none block">
              {(downPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[9px] text-rose-600 font-bold">
              +{downRoi.toFixed(0)}% ROI
            </span>
          </div>
          <div
            className={`w-11 text-center py-0.5 px-1 rounded-lg border ${
              isDark ? 'bg-[#131d2b] border-[#223048]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{downPct}%</span>
            <span className="text-[7px] text-slate-500 block uppercase">Peluang</span>
          </div>
        </div>
      </div>
    </div>
  );
};
