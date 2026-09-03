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

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<'chart' | 'book' | 'trades' | 'twap'>('chart');
  // Desktop secondary tab switcher
  const [desktopTab, setDesktopTab] = useState<'all' | 'book' | 'trades'>('all');

  const slug = getPolymarketSlug(asset, currentWindowTs);
  const activeLastPrice = chartMode === 'SPOT' ? spotPrice : upPrice;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Pro Header */}
      <ProHeader
        asset={asset}
        setAsset={setAsset}
        spotPrice={spotPrice}
        priceDirection={priceDirection}
        settlement={settlement}
        latencyStats={latencyStats}
        upPrice={upPrice}
        downPrice={downPrice}
      />

      {/* Main Terminal Grid */}
      <main className="flex-1 p-2 sm:p-3.5 max-w-[1920px] w-full mx-auto flex flex-col gap-2.5">
        
        {/* Mobile Tab Switcher (Visible on small screens) */}
        <div className="lg:hidden flex items-center bg-[#0d131f] p-1 rounded-xl border border-[#1a2337] text-xs font-mono">
          <button
            onClick={() => setMobileTab('chart')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'chart' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>CHART</span>
          </button>
          <button
            onClick={() => setMobileTab('book')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'book' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>BOOK</span>
          </button>
          <button
            onClick={() => setMobileTab('trades')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'trades' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>TRADES</span>
          </button>
          <button
            onClick={() => setMobileTab('twap')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 font-bold transition-all ${
              mobileTab === 'twap' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TWAP</span>
          </button>
        </div>

        {/* Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          
          {/* LEFT / PRIMARY SECTION: Odds + Pro Chart (Col 8 or 9) */}
          <section className={`lg:col-span-8 xl:col-span-9 flex flex-col space-y-2.5 ${
            mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Compact Odds Bar */}
            <CompactOddsBar
              upPrice={upPrice}
              downPrice={downPrice}
              settlement={settlement}
            />

            {/* TradingView Lightweight Pro Chart */}
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
                lastPrice={activeLastPrice}
                strikePrice={settlement.strikePrice}
                runningTwap={settlement.runningTwap}
                assetName={asset}
              />
            </div>
          </section>

          {/* RIGHT / SECONDARY SECTION: Order Book + Trades + TWAP Analytics (Col 4 or 3) */}
          <section className={`lg:col-span-4 xl:col-span-3 flex flex-col space-y-2.5 ${
            mobileTab !== 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Mobile Single Tab Render */}
            <div className="lg:hidden flex-1 flex flex-col">
              {mobileTab === 'book' && <ClobOrderBook orderBook={orderBook} />}
              {mobileTab === 'trades' && <LiveTradesTicker trades={trades} />}
              {mobileTab === 'twap' && (
                <TwapAnalyticsCard
                  settlement={settlement}
                  eventData={activeEvent}
                  activeMarket={activeMarket}
                  slug={slug}
                />
              )}
            </div>

            {/* Desktop Structured View */}
            <div className="hidden lg:flex flex-col space-y-2.5 flex-1">
              {/* TWAP Analytics Card on Top */}
              <TwapAnalyticsCard
                settlement={settlement}
                eventData={activeEvent}
                activeMarket={activeMarket}
                slug={slug}
              />

              {/* Order Book & Trades Split Panels */}
              <div className="flex-1 grid grid-rows-2 gap-2.5 min-h-[460px]">
                <ClobOrderBook orderBook={orderBook} />
                <LiveTradesTicker trades={trades} />
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default App;
