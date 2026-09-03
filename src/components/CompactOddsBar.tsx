import React from 'react';
import { RoundSettlementState, ThemeMode } from '../types/market';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

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
  const isDark = theme === 'dark';
  const { isUpWinning } = settlement;

  const validUpPrice = Math.max(0.01, Math.min(0.99, isNaN(upPrice) ? 0.50 : upPrice));
  const validDownPrice = Math.max(0.01, Math.min(0.99, isNaN(downPrice) ? 0.50 : downPrice));

  const upCents = (validUpPrice * 100).toFixed(1);
  const downCents = (validDownPrice * 100).toFixed(1);

  const upRoi = ((1 / validUpPrice) - 1) * 100;
  const downRoi = ((1 / validDownPrice) - 1) * 100;

  return (
    <div className="w-full grid grid-cols-2 gap-2 select-none flex-shrink-0">
      {/* UP CARD - EYE COMFORT DEEP EMERALD */}
      <div
        className={`relative overflow-hidden rounded-xl p-2 sm:p-2.5 border transition-all ${
          isUpWinning
            ? isDark
              ? 'bg-[#0d2b20] border-[#089981] shadow-[0_0_20px_rgba(8,153,129,0.3)] ring-1 ring-[#089981]'
              : 'bg-emerald-50 border-[#089981] shadow-md ring-1 ring-[#089981]'
            : isDark
            ? 'bg-[#131722] border-[#2a2e39]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 rounded-md bg-[#089981]/20 text-[#089981]">
              <ArrowUpRight className="w-4 h-4 font-black" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#089981] block">
                UP (NAIK)
              </span>
              <span className="text-[9px] text-[#787b86] font-mono block">
                Target: TWAP &gt; Strike
              </span>
            </div>
          </div>

          {isUpWinning && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#089981] text-slate-950 uppercase tracking-wider animate-pulse flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>MEMIMPIN</span>
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline justify-between font-mono">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-[#089981]">
              {upCents}¢
            </span>
            <span className="text-xs font-bold text-[#787b86]">
              (${validUpPrice.toFixed(3)})
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#787b86] block">POTENSI ROI</span>
            <span className="text-xs sm:text-sm font-black text-[#089981]">
              +{upRoi.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* DOWN CARD - EYE COMFORT DEEP WINE */}
      <div
        className={`relative overflow-hidden rounded-xl p-2 sm:p-2.5 border transition-all ${
          !isUpWinning
            ? isDark
              ? 'bg-[#2e1219] border-[#f23645] shadow-[0_0_20px_rgba(242,54,69,0.3)] ring-1 ring-[#f23645]'
              : 'bg-rose-50 border-[#f23645] shadow-md ring-1 ring-[#f23645]'
            : isDark
            ? 'bg-[#131722] border-[#2a2e39]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 rounded-md bg-[#f23645]/20 text-[#f23645]">
              <ArrowDownRight className="w-4 h-4 font-black" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#f23645] block">
                DOWN (TURUN)
              </span>
              <span className="text-[9px] text-[#787b86] font-mono block">
                Target: TWAP &lt; Strike
              </span>
            </div>
          </div>

          {!isUpWinning && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#f23645] text-white uppercase tracking-wider animate-pulse flex items-center space-x-1">
              <TrendingDown className="w-3 h-3" />
              <span>MEMIMPIN</span>
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline justify-between font-mono">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-[#f23645]">
              {downCents}¢
            </span>
            <span className="text-xs font-bold text-[#787b86]">
              (${validDownPrice.toFixed(3)})
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#787b86] block">POTENSI ROI</span>
            <span className="text-xs sm:text-sm font-black text-[#f23645]">
              +{downRoi.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
