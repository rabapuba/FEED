import React from 'react';
import { RoundSettlementState, PolymarketEvent, PolymarketMarket } from '../types/market';
import { ShieldCheck, ExternalLink, Target, Scale, Zap } from 'lucide-react';

interface TwapAnalyticsCardProps {
  settlement: RoundSettlementState;
  eventData: PolymarketEvent | null;
  activeMarket: PolymarketMarket | null;
  slug: string;
}

export const TwapAnalyticsCard: React.FC<TwapAnalyticsCardProps> = ({
  settlement,
  eventData,
  activeMarket,
  slug,
}) => {
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

  const liquidityStr = activeMarket?.liquidity
    ? `$${parseFloat(activeMarket.liquidity).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : eventData?.liquidity
    ? `$${eventData.liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : '$0';

  return (
    <div className="bg-[#080b11] border border-[#1a2337] rounded-xl p-3 sm:p-4 flex flex-col font-mono text-xs shadow-xl select-none">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#161f33] mb-3">
        <div className="flex items-center space-x-1.5 text-slate-200 font-bold text-xs uppercase">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>CHAINLINK TWAP ANALYTICS</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold">
          STREAM 60S
        </span>
      </div>

      {/* Grid of Key Benchmark Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Strike Price */}
        <div className="bg-[#0e1422] p-2.5 rounded-lg border border-[#1b263d]">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">STRIKE (00:00)</span>
          <span className="text-sm sm:text-base font-black text-cyan-400">
            ${strikePrice > 0 ? strikePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
          </span>
          <span className="text-[9px] text-slate-500 block">Titik Awal Kontrak</span>
        </div>

        {/* Running TWAP */}
        <div className="bg-[#0e1422] p-2.5 rounded-lg border border-[#1b263d]">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">RUNNING TWAP</span>
          <span className="text-sm sm:text-base font-black text-purple-300">
            ${runningTwap > 0 ? runningTwap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
          </span>
          <span className={`text-[10px] font-black ${isUpWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
            {twapDelta >= 0 ? '+' : ''}${twapDelta.toFixed(2)} ({twapDeltaPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Flip Target Calculator */}
      <div className="bg-[#0e1422] p-3 rounded-lg border border-[#1b263d] mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold text-[11px]">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>TARGET HARGA UNTUK MEMBALIKKAN POSISI:</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Sisa {secondsLeft}s</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-base sm:text-lg font-black text-amber-300">
            ${requiredPriceToFlip > 0 ? requiredPriceToFlip.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
          </span>
          <span className="text-[10px] text-slate-400">
            Spot saat ini: <strong className="text-slate-200">${currentPrice.toFixed(2)}</strong>
          </span>
        </div>
        <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
          Harga rata-rata yang harus dipertahankan spot selama sisa waktu agar TWAP melampaui strike.
        </p>
      </div>

      {/* Market Details & Links */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#161f33] text-slate-400">
        <div className="flex items-center space-x-4">
          <span>Vol: <strong className="text-slate-200">{volumeStr}</strong></span>
          <span>Likuiditas: <strong className="text-slate-200">{liquidityStr}</strong></span>
        </div>
        <a
          href={`https://polymarket.com/id/event/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors font-bold"
        >
          <span>Polymarket</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
