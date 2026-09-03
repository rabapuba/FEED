import React from 'react';
import { CryptoAsset, RoundSettlementState, LatencyStats } from '../types/market';
import { Clock, Zap, ShieldCheck, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { formatWindowTimeRange } from '../services/polymarketFeed';

interface ProHeaderProps {
  asset: CryptoAsset;
  setAsset: (a: CryptoAsset) => void;
  spotPrice: number;
  priceDirection: 'up' | 'down' | 'neutral';
  settlement: RoundSettlementState;
  latencyStats: LatencyStats;
  upPrice: number;
  downPrice: number;
}

export const ProHeader: React.FC<ProHeaderProps> = ({
  asset,
  setAsset,
  spotPrice,
  priceDirection,
  settlement,
  latencyStats,
  upPrice,
  downPrice,
}) => {
  const { secondsLeft, strikePrice, runningTwap, isUpWinning, isUrgent, isCritical, progressPct } = settlement;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const timeWindowStr = settlement.currentWindowTs > 0 ? formatWindowTimeRange(settlement.currentWindowTs) : '5-Min Round';

  const ASSETS: Array<{ id: CryptoAsset; label: string; icon: string }> = [
    { id: 'BTC', label: 'BTC 5M', icon: '₿' },
    { id: 'ETH', label: 'ETH 5M', icon: 'Ξ' },
    { id: 'SOL', label: 'SOL 5M', icon: '◎' },
  ];

  return (
    <header className="bg-[#0a0d15] border-b border-[#1a2337] px-3 sm:px-6 py-2.5 sticky top-0 z-30 shadow-2xl backdrop-blur select-none">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        {/* LEFT SECTION: Asset Switcher & Live Spot Ticker */}
        <div className="flex items-center justify-between w-full md:w-auto space-x-3 sm:space-x-4">
          
          {/* Asset Pills */}
          <div className="flex items-center bg-[#101624] p-1 rounded-xl border border-[#1e293b]">
            {ASSETS.map((item) => (
              <button
                key={item.id}
                onClick={() => setAsset(item.id)}
                className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold transition-all ${
                  asset === item.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-sm font-black">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Live Price Flash Card */}
          <div className="flex items-center space-x-2.5 font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                SPOT PRICE (BINANCE)
              </div>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`text-base sm:text-xl font-black transition-colors ${
                    priceDirection === 'up'
                      ? 'text-emerald-400'
                      : priceDirection === 'down'
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  ${spotPrice > 0 ? spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
                </span>
                {priceDirection === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" />}
                {priceDirection === 'down' && <TrendingDown className="w-4 h-4 text-rose-400 animate-bounce" />}
              </div>
            </div>

            {/* Quick Strike Delta */}
            {strikePrice > 0 && (
              <div className="hidden sm:flex flex-col text-right pl-3 border-l border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold">VS STRIKE</span>
                <span className={`text-xs font-black ${isUpWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {settlement.strikeDelta >= 0 ? '+' : ''}${settlement.strikeDelta.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER SECTION: ROUND COUNTDOWN & CHAINLINK BENCHMARK */}
        <div className="w-full md:w-auto flex items-center justify-center">
          <div
            className={`w-full md:w-auto px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border transition-all flex items-center justify-between md:justify-center space-x-4 sm:space-x-6 relative overflow-hidden shadow-lg ${
              isCritical
                ? 'bg-rose-950/80 border-rose-500 glow-urgent text-rose-200'
                : isUrgent
                ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-amber-500/10'
                : 'bg-[#101624] border-[#1e293b] text-slate-200'
            }`}
          >
            {/* Progress Background Tint */}
            <div
              className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-1000 ${
                isCritical ? 'bg-rose-500' : isUrgent ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />

            {/* Round info */}
            <div className="flex flex-col text-left relative z-10 font-mono">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400">
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
                <span>SISA WAKTU</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{timeWindowStr}</span>
            </div>

            {/* Digital Giant Countdown */}
            <div className="relative z-10 font-mono font-black tracking-widest text-2xl sm:text-3xl md:text-4xl leading-none">
              <span
                className={
                  isCritical
                    ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                    : isUrgent
                    ? 'text-amber-400'
                    : 'text-cyan-300'
                }
              >
                {formattedCountdown}
              </span>
            </div>

            {/* Chainlink Oracle Verdict Pill */}
            <div className="relative z-10 flex flex-col items-end font-mono">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                  isUpWinning
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}
              >
                {isUpWinning ? '▲ UP WINNING' : '▼ DOWN WINNING'}
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">
                TWAP: ${runningTwap > 0 ? runningTwap.toFixed(2) : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Odds Preview, Latency & Connection Ping */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-3 font-mono text-xs">
          
          {/* Quick Odds Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-[#101624] px-3 py-1.5 rounded-xl border border-[#1e293b]">
            <span className="text-emerald-400 font-extrabold">UP {(upPrice * 100).toFixed(0)}¢</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400 font-extrabold">DOWN {(downPrice * 100).toFixed(0)}¢</span>
          </div>

          {/* Ultra-Low Latency Ping Badge */}
          <div className="flex items-center space-x-1.5 bg-[#101624] px-2.5 py-1.5 rounded-xl border border-[#1e293b]">
            <Zap className={`w-3.5 h-3.5 ${latencyStats.binanceWsConnected ? 'text-amber-400' : 'text-slate-600'}`} />
            <span className="text-[11px] font-bold text-slate-300">
              {latencyStats.binanceWsPingMs > 0 ? `${latencyStats.binanceWsPingMs}ms` : '<20ms'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                latencyStats.binanceWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>

          {/* Oracle Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-[#101624] px-2.5 py-1.5 rounded-xl border border-[#1e293b]">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-black text-purple-300">CHAINLINK TWAP</span>
          </div>
        </div>

      </div>
    </header>
  );
};
