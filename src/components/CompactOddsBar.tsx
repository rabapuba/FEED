import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { RoundSettlementState } from '../types/market';

interface CompactOddsBarProps {
  upPrice: number;
  downPrice: number;
  settlement: RoundSettlementState;
}

export const CompactOddsBar: React.FC<CompactOddsBarProps> = ({
  upPrice,
  downPrice,
  settlement,
}) => {
  const { strikePrice, isUpWinning } = settlement;

  const upPct = Math.round(upPrice * 100);
  const downPct = Math.round(downPrice * 100);

  // Return calculation (e.g. at 0.55 -> payout is (1 / 0.55) - 1 = +81.8% ROI)
  const upRoi = upPrice > 0 ? ((1 / upPrice) - 1) * 100 : 0;
  const downRoi = downPrice > 0 ? ((1 / downPrice) - 1) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full font-mono select-none">
      {/* UP (NAIK) PRO CARD */}
      <div
        className={`p-3 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden ${
          isUpWinning
            ? 'bg-gradient-to-r from-emerald-950/60 via-[#0d1c1c] to-[#0a1218] border-emerald-500/70 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
            : 'bg-[#0b101a] border-[#1a2337] opacity-80 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black border ${
              isUpWinning
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-800/40 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black text-white tracking-tight">UP (NAIK)</span>
              {isUpWinning && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="text-[10px] text-slate-400">
              Target: <span className="text-slate-200 font-bold">≥ ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-emerald-400 leading-none block">
              {(upPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[10px] text-emerald-500/80 font-bold">
              +{upRoi.toFixed(0)}% ROI
            </span>
          </div>
          <div className="w-12 text-center bg-[#131d2b] py-1 px-1.5 rounded-lg border border-[#223048]">
            <span className="text-xs font-black text-white">{upPct}%</span>
            <span className="text-[8px] text-slate-500 block uppercase">Peluang</span>
          </div>
        </div>
      </div>

      {/* DOWN (TURUN) PRO CARD */}
      <div
        className={`p-3 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden ${
          !isUpWinning
            ? 'bg-gradient-to-r from-rose-950/60 via-[#1c0d16] to-[#120a10] border-rose-500/70 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
            : 'bg-[#0b101a] border-[#1a2337] opacity-80 hover:opacity-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black border ${
              !isUpWinning
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                : 'bg-slate-800/40 text-slate-400 border-slate-700'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black text-white tracking-tight">DOWN (TURUN)</span>
              {!isUpWinning && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
            </div>
            <div className="text-[10px] text-slate-400">
              Target: <span className="text-slate-200 font-bold">&lt; ${strikePrice > 0 ? strikePrice.toFixed(2) : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-rose-400 leading-none block">
              {(downPrice * 100).toFixed(1)}¢
            </span>
            <span className="text-[10px] text-rose-500/80 font-bold">
              +{downRoi.toFixed(0)}% ROI
            </span>
          </div>
          <div className="w-12 text-center bg-[#131d2b] py-1 px-1.5 rounded-lg border border-[#223048]">
            <span className="text-xs font-black text-white">{downPct}%</span>
            <span className="text-[8px] text-slate-500 block uppercase">Peluang</span>
          </div>
        </div>
      </div>
    </div>
  );
};
