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
      className={`min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col font-sans selection:bg-[#f0b90b] selection:text-black transition-colors ${
        isDark ? 'bg-[#12161c] text-[#eaecef]' : 'bg-[#f7f9fa] text-[#1e2329]'
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

      {/* Main Terminal Area (100% Fit in Single PC Viewport without Scrolling) */}
      <main className="flex-1 min-h-0 p-2 max-w-[1920px] w-full mx-auto flex flex-col lg:overflow-hidden">
        
        {/* Mobile Tab Switcher (Visible only on mobile/tablet) */}
        <div
          className={`lg:hidden flex items-center p-1 rounded-xl border text-xs font-mono select-none mb-2 ${
            isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-white border-[#eaecef] shadow-sm'
          }`}
        >
          <button
            onClick={() => setMobileTab('chart')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'chart'
                ? 'bg-[#f0b90b] text-black shadow font-black'
                : isDark
                ? 'text-[#848e9c]'
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
                ? 'bg-[#f0b90b] text-black shadow font-black'
                : isDark
                ? 'text-[#848e9c]'
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
                ? 'bg-[#f0b90b] text-black shadow font-black'
                : isDark
                ? 'text-[#848e9c]'
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
                ? 'bg-[#f0b90b] text-black shadow font-black'
                : isDark
                ? 'text-[#848e9c]'
                : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TWAP</span>
          </button>
        </div>

        {/* Dual Layout Grid (Desktop vs Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-1 min-h-0">
          
          {/* LEFT / PRIMARY: Compact Odds + Binance Pro Chart */}
          <section className={`lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0 space-y-2 ${
            mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Compact Odds Bar (Super Vibrant Glowing) */}
            <CompactOddsBar
              upPrice={upPrice}
              downPrice={downPrice}
              settlement={settlement}
              theme={theme}
            />

            {/* TradingView / Binance Pro Chart (Dynamic Full Height) */}
            <div className="flex-1 min-h-0 h-full w-full flex flex-col">
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
          <section className={`lg:col-span-4 xl:col-span-3 flex flex-col h-full min-h-0 space-y-2 ${
            mobileTab !== 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Mobile View */}
            <div className="lg:hidden flex-1 flex flex-col space-y-2">
              {mobileTab === 'book' && <div className="h-[480px]"><ClobOrderBook orderBook={orderBook} theme={theme} /></div>}
              {mobileTab === 'trades' && <div className="h-[480px]"><LiveTradesTicker trades={trades} theme={theme} /></div>}
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

            {/* Desktop Structured View (Zero Scroll, Exact Fit) */}
            <div className="hidden lg:flex flex-col h-full min-h-0 space-y-2">
              {/* Chainlink TWAP Settlement Card */}
              <TwapAnalyticsCard
                settlement={settlement}
                eventData={activeEvent}
                activeMarket={activeMarket}
                slug={slug}
                theme={theme}
              />

              {/* Order Book & Live Trades Split View */}
              <div className="flex-1 min-h-0 grid grid-rows-2 gap-2">
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
