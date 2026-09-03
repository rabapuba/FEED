import React, { useState } from 'react';
import { useTradingTerminal } from './hooks/useTradingTerminal';
import { ProHeader } from './components/ProHeader';
import { CompactOddsBar } from './components/CompactOddsBar';
import { ProTradingChart } from './components/ProTradingChart';
import { ClobOrderBook } from './components/ClobOrderBook';
import { LiveTradesTicker } from './components/LiveTradesTicker';
import { TwapAnalyticsCard } from './components/TwapAnalyticsCard';
import { getPolymarketSlug } from './services/polymarketFeed';
import { BarChart2, BookOpen, Activity, ShieldCheck } from 'lucide-react';

export function App() {
  const {
    asset,
    setAsset,
    timeframe,
    setTimeframe,
    chartMode,
    setChartMode,
    chartStyle,
    setChartStyle,
    theme,
    toggleTheme,
    showPrediction,
    setShowPrediction,
    predictedPrice,
    spotPrice,
    priceDirection,
    upPrice,
    downPrice,
    currentWindowTs,
    settlement,
    activeCandles,
    twapLineData,
    orderBook,
    trades,
    latencyStats,
    activeEvent,
    activeMarket,
  } = useTradingTerminal();

  // Mobile navigation tab state
  const [mobileTab, setMobileTab] = useState<'chart' | 'book' | 'trades' | 'twap'>('chart');

  const slug = getPolymarketSlug(asset, currentWindowTs);
  const activeLastPrice = chartMode === 'SPOT' ? spotPrice : upPrice;
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-black transition-colors ${
        isDark ? 'bg-[#07090e] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Top Pro Sticky Header */}
      <ProHeader
        asset={asset}
        setAsset={setAsset}
        spotPrice={spotPrice}
        priceDirection={priceDirection}
        settlement={settlement}
        latencyStats={latencyStats}
        upPrice={upPrice}
        downPrice={downPrice}
        theme={theme}
        toggleTheme={toggleTheme}
        showPrediction={showPrediction}
        setShowPrediction={setShowPrediction}
      />

      {/* Main Terminal Area */}
      <main className="flex-1 p-2 sm:p-3.5 max-w-[1920px] w-full mx-auto flex flex-col gap-2.5">
        
        {/* Mobile Tab Switcher (Visible only on mobile/tablet) */}
        <div
          className={`lg:hidden flex items-center p-1 rounded-xl border text-xs font-mono select-none ${
            isDark ? 'bg-[#0d131f] border-[#1a2337]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <button
            onClick={() => setMobileTab('chart')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'chart'
                ? 'bg-cyan-500 text-black shadow font-black'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>CHART</span>
          </button>
          <button
            onClick={() => setMobileTab('book')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'book'
                ? 'bg-cyan-500 text-black shadow font-black'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>BOOK</span>
          </button>
          <button
            onClick={() => setMobileTab('trades')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'trades'
                ? 'bg-cyan-500 text-black shadow font-black'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>TRADES</span>
          </button>
          <button
            onClick={() => setMobileTab('twap')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'twap'
                ? 'bg-cyan-500 text-black shadow font-black'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TWAP</span>
          </button>
        </div>

        {/* Dual Layout Grid (Desktop vs Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          
          {/* LEFT / PRIMARY: Compact Odds + TradingView Chart */}
          <section className={`lg:col-span-8 xl:col-span-9 flex flex-col space-y-2.5 ${
            mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Compact Odds Bar */}
            <CompactOddsBar
              upPrice={upPrice}
              downPrice={downPrice}
              settlement={settlement}
              theme={theme}
            />

            {/* TradingView Pro Chart */}
            <div className="flex-1 min-h-[500px] flex flex-col">
              <ProTradingChart
                data={activeCandles}
                twapData={twapLineData}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                chartMode={chartMode}
                setChartMode={setChartMode}
                chartStyle={chartStyle}
                setChartStyle={setChartStyle}
                theme={theme}
                lastPrice={activeLastPrice}
                strikePrice={settlement.strikePrice}
                runningTwap={settlement.runningTwap}
                showPrediction={showPrediction}
                setShowPrediction={setShowPrediction}
                predictedPrice={predictedPrice}
                assetName={asset}
              />
            </div>
          </section>

          {/* RIGHT / SECONDARY: Order Book + Live Trades + TWAP Analytics */}
          <section className={`lg:col-span-4 xl:col-span-3 flex flex-col space-y-2.5 ${
            mobileTab !== 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Mobile View */}
            <div className="lg:hidden flex-1 flex flex-col">
              {mobileTab === 'book' && <ClobOrderBook orderBook={orderBook} theme={theme} />}
              {mobileTab === 'trades' && <LiveTradesTicker trades={trades} theme={theme} />}
              {mobileTab === 'twap' && (
                <TwapAnalyticsCard
                  settlement={settlement}
                  eventData={activeEvent}
                  activeMarket={activeMarket}
                  slug={slug}
                  theme={theme}
                />
              )}
            </div>

            {/* Desktop Structured View */}
            <div className="hidden lg:flex flex-col space-y-2.5 flex-1">
              {/* Chainlink TWAP Settlement Card */}
              <TwapAnalyticsCard
                settlement={settlement}
                eventData={activeEvent}
                activeMarket={activeMarket}
                slug={slug}
                theme={theme}
              />

              {/* Order Book & Live Trades Split View */}
              <div className="flex-1 grid grid-rows-2 gap-2.5 min-h-[460px]">
                <ClobOrderBook orderBook={orderBook} theme={theme} />
                <LiveTradesTicker trades={trades} theme={theme} />
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default App;
