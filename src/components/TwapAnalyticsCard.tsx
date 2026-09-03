import React from 'react';
import { RoundSettlementState, PolymarketEvent, PolymarketMarket, ThemeMode } from '../types/market';
import { ShieldCheck, ExternalLink, Target } from 'lucide-react';

interface TwapAnalyticsCardProps {
  settlement: RoundSettlementState;
  eventData: PolymarketEvent | null;
  activeMarket: PolymarketMarket | null;
  slug: string;
  theme?: ThemeMode;
}

export const TwapAnalyticsCard: React.FC<TwapAnalyticsCardProps> = ({
  settlement,
  eventData,
  activeMarket,
  slug,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const {
    strikePrice,
    currentPrice,
    runningTwap,
    twapDelta,
    twapDeltaPct,
    requiredPriceToFlip,
    isUpWinning,
    secondsLeft,
  } = settlement;

  const volumeStr = activeMarket?.volume
    ? `$${parseFloat(activeMarket.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : eventData?.volume
    ? `$${eventData.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : '$0';

  return (
    <div
      className={`border rounded-xl p-2.5 flex flex-col font-mono text-xs shadow-md select-none transition-colors flex-shrink-0 ${
        isDark ? 'bg-[#080b11] border-[#1a2337]' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Title */}
      <div className={`flex items-center justify-between pb-1.5 border-b mb-2 ${isDark ? 'border-[#161f33]' : 'border-slate-200'}`}>
        <div className={`flex items-center space-x-1.5 font-bold text-[11px] uppercase ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
          <span>CHAINLINK TWAP BENCHMARK</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-500 font-black">
          STREAM 60S
        </span>
      </div>

      {/* Grid of Key Benchmark Stats */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Strike Price */}
        <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-[#0e1422] border-[#1b263d]' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[9px] text-slate-500 font-bold uppercase block">STRIKE (00:00)</span>
          <span className="text-sm font-black text-cyan-500">
            ${strikePrice > 0 ? strikePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
          </span>
          <span className="text-[8px] text-slate-500 block">Titik Awal Kontrak</span>
        </div>

        {/* Running TWAP */}
        <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-[#0e1422] border-[#1b263d]' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[9px] text-slate-500 font-bold uppercase block">RUNNING TWAP</span>
          <span className="text-sm font-black text-purple-500">
            ${runningTwap > 0 ? runningTwap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
          </span>
          <span className={`text-[9px] font-black ${isUpWinning ? 'text-emerald-500' : 'text-rose-500'}`}>
            {twapDelta >= 0 ? '+' : ''}${twapDelta.toFixed(2)} ({twapDeltaPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Flip Target Calculator */}
      <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#0e1422] border-[#1b263d]' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center space-x-1 text-slate-400 font-bold text-[10px]">
            <Target className="w-3 h-3 text-amber-500" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>TARGET HARGA BALIK:</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">Sisa {secondsLeft}s</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm sm:text-base font-black text-amber-500">
            ${requiredPriceToFlip > 0 ? requiredPriceToFlip.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
          </span>
          <span className="text-[9px] text-slate-400">
            Spot: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>${currentPrice.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {/* Market Link */}
      <div className={`flex items-center justify-between text-[10px] pt-1.5 border-t text-slate-400 mt-2 ${isDark ? 'border-[#161f33]' : 'border-slate-200'}`}>
        <span>Volume: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{volumeStr}</strong></span>
        <a
          href={`https://polymarket.com/id/event/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors font-bold"
        >
          <span>Polymarket</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
