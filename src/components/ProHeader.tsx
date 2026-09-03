import React from 'react';
import { CryptoAsset, RoundSettlementState, LatencyStats, ThemeMode } from '../types/market';
import { Clock, Zap, ShieldCheck, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';
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
  theme: ThemeMode;
  toggleTheme: () => void;
  showPrediction: boolean;
  setShowPrediction: (sp: boolean) => void;
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
  theme,
  toggleTheme,
  showPrediction,
  setShowPrediction,
}) => {
  const { secondsLeft, strikePrice, runningTwap, isUpWinning, isUrgent, isCritical, progressPct } = settlement;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const timeWindowStr = settlement.currentWindowTs > 0 ? formatWindowTimeRange(settlement.currentWindowTs) : '5-Min Round';
  const isDark = theme === 'dark';

  const ASSETS: Array<{ id: CryptoAsset; label: string; icon: string }> = [
    { id: 'BTC', label: 'BTC 5M', icon: '₿' },
    { id: 'ETH', label: 'ETH 5M', icon: 'Ξ' },
    { id: 'SOL', label: 'SOL 5M', icon: '◎' },
  ];

  return (
    <header
      className={`border-b px-3 sm:px-6 py-2.5 sticky top-0 z-30 shadow-2xl backdrop-blur select-none transition-colors ${
        isDark ? 'bg-[#0a0d15] border-[#1a2337]' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        {/* LEFT SECTION: Asset Switcher & Live Spot Ticker */}
        <div className="flex items-center justify-between w-full md:w-auto space-x-3 sm:space-x-4">
          
          {/* Asset Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-[#101624] border-[#1e293b]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            {ASSETS.map((item) => (
              <button
                key={item.id}
                onClick={() => setAsset(item.id)}
                className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold transition-all ${
                  asset === item.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
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
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                BINANCE SPOT
              </div>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`text-base sm:text-xl font-black transition-colors ${
                    priceDirection === 'up'
                      ? 'text-emerald-500'
                      : priceDirection === 'down'
                      ? 'text-rose-500'
                      : isDark
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}
                >
                  ${spotPrice > 0 ? spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
                </span>
                {priceDirection === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {priceDirection === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
              </div>
            </div>

            {/* Quick Strike Delta */}
            {strikePrice > 0 && (
              <div className="hidden sm:flex flex-col text-right pl-3 border-l border-slate-300 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold">VS STRIKE</span>
                <span className={`text-xs font-black ${isUpWinning ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {settlement.strikeDelta >= 0 ? '+' : ''}${settlement.strikeDelta.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER SECTION: ROUND COUNTDOWN & CHAINLINK VERDICT */}
        <div className="w-full md:w-auto flex items-center justify-center">
          <div
            className={`w-full md:w-auto px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border transition-all flex items-center justify-between md:justify-center space-x-4 sm:space-x-6 relative overflow-hidden shadow-lg ${
              isCritical
                ? 'bg-rose-950/80 border-rose-500 glow-urgent text-rose-200'
                : isUrgent
                ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-amber-500/10'
                : isDark
                ? 'bg-[#101624] border-[#1e293b] text-slate-200'
                : 'bg-slate-100 border-slate-300 text-slate-800'
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
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-cyan-500'}`} />
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
                    : 'text-cyan-500'
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
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                }`}
              >
                {isUpWinning ? '▲ UP WIN' : '▼ DOWN WIN'}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5 font-bold">
                TWAP: ${runningTwap > 0 ? runningTwap.toFixed(2) : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Odds, Proyeksi Toggle, Theme Switcher, Latency Ping */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-2.5 font-mono text-xs">
          
          {/* Quick Odds Badge */}
          <div
            className={`hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${
              isDark ? 'bg-[#101624] border-[#1e293b]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className="text-emerald-500 font-extrabold">UP {(upPrice * 100).toFixed(0)}¢</span>
            <span className="text-slate-400">/</span>
            <span className="text-rose-500 font-extrabold">DOWN {(downPrice * 100).toFixed(0)}¢</span>
          </div>

          {/* Proyeksi 30s Header Button */}
          <button
            onClick={() => setShowPrediction(!showPrediction)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-black border transition-all ${
              showPrediction
                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/60 shadow'
                : isDark
                ? 'bg-[#101624] border-[#1e293b] text-slate-500 hover:text-slate-300'
                : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-800'
            }`}
            title="Garis Proyeksi 30-Detik (Warna Kuning)"
          >
            <Zap className={`w-3.5 h-3.5 ${showPrediction ? 'text-yellow-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">PROYEKSI:</span>
            <span>{showPrediction ? 'ON' : 'OFF'}</span>
          </button>

          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
              isDark
                ? 'bg-[#101624] border-[#1e293b] text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
            }`}
            title={isDark ? 'Beralih ke Mode Terang (Light)' : 'Beralih ke Mode Gelap (Dark)'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
            <span className="font-extrabold">{isDark ? 'LIGHT' : 'DARK'}</span>
          </button>

          {/* Latency Ping Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border ${
              isDark ? 'bg-[#101624] border-[#1e293b]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-500">
              {latencyStats.binanceWsPingMs > 0 ? `${latencyStats.binanceWsPingMs}ms` : '<20ms'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                latencyStats.binanceWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>

        </div>

      </div>
    </header>
  );
};
