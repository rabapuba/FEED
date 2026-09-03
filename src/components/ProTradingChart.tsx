import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  IPriceLine,
} from 'lightweight-charts';
import { OHLCData, TimeFrame, ChartMode, ChartStyle, ThemeMode } from '../types/market';
import {
  Maximize2,
  Minimize2,
  BarChart2,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';

interface ProTradingChartProps {
  data: OHLCData[];
  twapData?: Array<{ time: number; value: number }>;
  timeframe: TimeFrame;
  setTimeframe: (tf: TimeFrame) => void;
  chartMode: ChartMode;
  setChartMode: (cm: ChartMode) => void;
  chartStyle: ChartStyle;
  setChartStyle: (cs: ChartStyle) => void;
  theme: ThemeMode;
  lastPrice: number;
  strikePrice: number;
  runningTwap?: number;
  showPrediction: boolean;
  setShowPrediction: (sp: boolean) => void;
  predictedPrice: number;
  assetName: string;
}

export const ProTradingChart: React.FC<ProTradingChartProps> = ({
  data,
  twapData = [],
  timeframe,
  setTimeframe,
  chartMode,
  setChartMode,
  chartStyle,
  setChartStyle,
  theme,
  lastPrice,
  strikePrice,
  runningTwap,
  showPrediction,
  setShowPrediction,
  predictedPrice,
  assetName,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const twapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const strikeLineRef = useRef<IPriceLine | null>(null);
  const predictionLineRef = useRef<IPriceLine | null>(null);

  // State tracking refs for smart zero-flicker updating
  const prevTimeframeRef = useRef<TimeFrame>(timeframe);
  const prevModeRef = useRef<ChartMode>(chartMode);
  const prevStyleRef = useRef<ChartStyle>(chartStyle);
  const prevDataLengthRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Hover state for interactive legend
  const [hoveredCandle, setHoveredCandle] = useState<OHLCData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTwapLine, setShowTwapLine] = useState<boolean>(true);
  const [showStrike, setShowStrike] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  // Timeframe buttons list
  const TIMEFRAMES: Array<{ id: TimeFrame; label: string }> = [
    { id: '5s', label: '5s' },
    { id: '15s', label: '15s' },
    { id: '30s', label: '30s' },
    { id: '1m', label: '1m' },
    { id: '5m', label: '5m' },
    { id: '15m', label: '15m' },
  ];

  const isDark = theme === 'dark';

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isSpot = chartMode === 'SPOT';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 450,
      layout: {
        background: { color: isDark ? '#080b11' : '#ffffff' },
        textColor: isDark ? '#94a3b8' : '#334155',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: isDark ? '#131b2c' : '#f1f5f9' },
        horzLines: { color: isDark ? '#131b2c' : '#f1f5f9' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? '#38bdf8' : '#0284c7',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#0f172a' : '#e2e8f0',
        },
        horzLine: {
          color: isDark ? '#38bdf8' : '#0284c7',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#0f172a' : '#e2e8f0',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1e293b' : '#cbd5e1',
        autoScale: true,
        borderVisible: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.2,
        },
        alignLabels: true,
      },
      timeScale: {
        borderColor: isDark ? '#1e293b' : '#cbd5e1',
        timeVisible: true,
        secondsVisible: timeframe === '5s' || timeframe === '15s' || timeframe === '30s',
        borderVisible: true,
        rightOffset: 8,
        barSpacing: 8,
        minBarSpacing: 2,
      },
    });

    // Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: isDark ? '#334155' : '#cbd5e1',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Add Main Price Series (Candles or Area)
    if (chartStyle === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: isSpot ? 'rgba(56, 189, 248, 0.35)' : 'rgba(16, 185, 129, 0.35)',
        bottomColor: 'rgba(56, 189, 248, 0.0)',
        lineColor: isSpot ? '#38bdf8' : '#10b981',
        lineWidth: 2,
        priceFormat: isSpot
          ? { type: 'price', precision: 2, minMove: 0.01 }
          : { type: 'price', precision: 3, minMove: 0.001 },
      });
      areaSeriesRef.current = areaSeries;
      candleSeriesRef.current = null;
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
        priceFormat: isSpot
          ? { type: 'price', precision: 2, minMove: 0.01 }
          : { type: 'price', precision: 3, minMove: 0.001 },
      });
      candleSeriesRef.current = candleSeries;
      areaSeriesRef.current = null;
    }

    // Add Chainlink TWAP Line Series
    const twapSeries = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
      lineStyle: 0,
      priceScaleId: 'right',
      title: 'TWAP',
      priceFormat: isSpot
        ? { type: 'price', precision: 2, minMove: 0.01 }
        : { type: 'price', precision: 3, minMove: 0.001 },
    });
    twapSeriesRef.current = twapSeries;

    chartRef.current = chart;
    isInitializedRef.current = false;

    // Crosshair move listener
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        setHoveredCandle(null);
      } else {
        const activeSeries = candleSeriesRef.current || areaSeriesRef.current;
        if (activeSeries) {
          const bar = param.seriesData.get(activeSeries) as any;
          if (bar) {
            setHoveredCandle({
              time: Number(param.time),
              open: bar.open ?? bar.value,
              high: bar.high ?? bar.value,
              low: bar.low ?? bar.value,
              close: bar.close ?? bar.value,
              volume: 0,
            });
          }
        }
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      areaSeriesRef.current = null;
      volumeSeriesRef.current = null;
      twapSeriesRef.current = null;
      strikeLineRef.current = null;
      predictionLineRef.current = null;
      isInitializedRef.current = false;
    };
  }, [chartMode, chartStyle, theme, isDark]);

  // 2. High-Performance Zero-Flicker Data Updating
  useEffect(() => {
    if (!data || data.length === 0) return;

    const modeChanged = prevModeRef.current !== chartMode;
    const timeframeChanged = prevTimeframeRef.current !== timeframe;
    const styleChanged = prevStyleRef.current !== chartStyle;
    const lengthDiff = Math.abs(data.length - prevDataLengthRef.current);

    prevModeRef.current = chartMode;
    prevTimeframeRef.current = timeframe;
    prevStyleRef.current = chartStyle;
    prevDataLengthRef.current = data.length;

    const needsFullReset = !isInitializedRef.current || modeChanged || timeframeChanged || styleChanged || lengthDiff > 1;

    // Update Candles Series
    if (candleSeriesRef.current) {
      if (needsFullReset) {
        const formatted = data.map((d) => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candleSeriesRef.current.setData(formatted);
        chartRef.current?.timeScale().fitContent();
        isInitializedRef.current = true;
      } else {
        const last = data[data.length - 1];
        candleSeriesRef.current.update({
          time: last.time as any,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        });
      }
    }

    // Update Area Series
    if (areaSeriesRef.current) {
      if (needsFullReset) {
        const formatted = data.map((d) => ({
          time: d.time as any,
          value: d.close,
        }));
        areaSeriesRef.current.setData(formatted);
        chartRef.current?.timeScale().fitContent();
        isInitializedRef.current = true;
      } else {
        const last = data[data.length - 1];
        areaSeriesRef.current.update({
          time: last.time as any,
          value: last.close,
        });
      }
    }

    // Update Volume Series
    if (volumeSeriesRef.current && showVolume) {
      if (needsFullReset) {
        const volFormatted = data.map((d) => ({
          time: d.time as any,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
        }));
        volumeSeriesRef.current.setData(volFormatted);
      } else {
        const last = data[data.length - 1];
        volumeSeriesRef.current.update({
          time: last.time as any,
          value: last.volume,
          color: last.close >= last.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
        });
      }
    }

    // Update TWAP Series
    if (twapSeriesRef.current) {
      if (showTwapLine && twapData.length > 0 && chartMode === 'SPOT') {
        const formattedTwap = twapData
          .filter((pt) => pt.value > 0)
          .map((pt) => ({
            time: pt.time as any,
            value: pt.value,
          }));
        twapSeriesRef.current.setData(formattedTwap);
      } else {
        twapSeriesRef.current.setData([]);
      }
    }

    const targetSeries = candleSeriesRef.current || areaSeriesRef.current;

    // Update Strike Price Horizontal Line
    if (targetSeries) {
      if (strikeLineRef.current) {
        targetSeries.removePriceLine(strikeLineRef.current);
        strikeLineRef.current = null;
      }

      if (showStrike) {
        if (chartMode === 'SPOT' && strikePrice > 0) {
          strikeLineRef.current = targetSeries.createPriceLine({
            price: strikePrice,
            color: '#06b6d4',
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `STRIKE: $${strikePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          });
        } else if (chartMode === 'CONTRACT') {
          strikeLineRef.current = targetSeries.createPriceLine({
            price: 0.50,
            color: '#06b6d4',
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `50¢ PARITAS`,
          });
        }
      }
    }

    // 30s Prediction Line (Proyeksi 30s)
    if (targetSeries) {
      if (predictionLineRef.current) {
        targetSeries.removePriceLine(predictionLineRef.current);
        predictionLineRef.current = null;
      }

      if (showPrediction && predictedPrice > 0) {
        const isSpot = chartMode === 'SPOT';
        const titleText = isSpot
          ? `PROYEKSI 30S: $${predictedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `PROYEKSI 30S: ${(predictedPrice * 100).toFixed(1)}¢`;

        predictionLineRef.current = targetSeries.createPriceLine({
          price: predictedPrice,
          color: '#eab308',
          lineWidth: 2,
          lineStyle: 3,
          axisLabelVisible: true,
          title: titleText,
        });
      }
    }
  }, [
    data,
    twapData,
    chartMode,
    timeframe,
    chartStyle,
    strikePrice,
    showTwapLine,
    showStrike,
    showVolume,
    showPrediction,
    predictedPrice,
  ]);

  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const activeCandle = hoveredCandle || (data.length > 0 ? data[data.length - 1] : null);
  const isUpFromOpen = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const candleChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleChangePct = activeCandle && activeCandle.open > 0 ? (candleChange / activeCandle.open) * 100 : 0;
  const deltaFromStrike = activeCandle && strikePrice > 0 ? activeCandle.close - strikePrice : 0;
  const isAboveStrike = deltaFromStrike >= 0;

  return (
    <div
      ref={chartWrapperRef}
      className={`relative w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl transition-colors ${
        isDark ? 'bg-[#080b11] border border-[#1a2337]' : 'bg-white border border-slate-200'
      } ${isFullscreen ? 'p-2' : ''}`}
    >
      {/* Top Pro Toolbar (Compact & Sleek) */}
      <div
        className={`flex flex-wrap items-center justify-between px-2.5 py-1.5 border-b gap-1.5 z-10 select-none flex-shrink-0 ${
          isDark ? 'bg-[#0d131f] border-[#1a2337]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Left: Timeframe Switcher */}
        <div
          className={`flex items-center space-x-1 p-0.5 rounded-lg border ${
            isDark ? 'bg-[#141b2a] border-[#222e47]' : 'bg-slate-200/70 border-slate-300'
          }`}
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-2 py-0.5 text-xs font-mono font-extrabold rounded transition-all ${
                timeframe === tf.id
                  ? 'bg-cyan-500 text-black shadow font-black'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Center: Mode & Style Switcher */}
        <div className="flex items-center space-x-1.5">
          {/* Mode Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-[#141b2a] border-[#222e47]' : 'bg-slate-200/70 border-slate-300'
            }`}
          >
            <button
              onClick={() => setChartMode('SPOT')}
              className={`px-2.5 py-0.5 rounded transition-colors font-extrabold ${
                chartMode === 'SPOT'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              SPOT ($)
            </button>
            <button
              onClick={() => setChartMode('CONTRACT')}
              className={`px-2.5 py-0.5 rounded transition-colors font-extrabold ${
                chartMode === 'CONTRACT'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              KONTRAK (¢)
            </button>
          </div>

          {/* Style Switcher */}
          <div
            className={`hidden sm:flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-[#141b2a] border-[#222e47]' : 'bg-slate-200/70 border-slate-300'
            }`}
          >
            <button
              onClick={() => setChartStyle('candles')}
              className={`p-1 rounded transition-colors ${
                chartStyle === 'candles'
                  ? 'bg-blue-600 text-white font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartStyle('heikin-ashi')}
              className={`p-1 rounded transition-colors ${
                chartStyle === 'heikin-ashi'
                  ? 'bg-blue-600 text-white font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
              title="Heikin Ashi Chart"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartStyle('area')}
              className={`p-1 rounded transition-colors ${
                chartStyle === 'area'
                  ? 'bg-blue-600 text-white font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
              title="Area Line Chart"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Feature Toggles */}
        <div className="flex items-center space-x-1">
          {/* Proyeksi 30s Toggle */}
          <button
            onClick={() => setShowPrediction(!showPrediction)}
            className={`flex items-center space-x-1 px-2 py-0.5 text-xs font-mono font-black rounded border transition-all ${
              showPrediction
                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/60 shadow'
                : isDark
                ? 'bg-[#141b2a] border-[#222e47] text-slate-500 hover:text-slate-300'
                : 'bg-slate-200 border-slate-300 text-slate-500 hover:text-slate-800'
            }`}
            title="Garis Proyeksi 30 Detik (Kuning)"
          >
            <Zap className={`w-3 h-3 ${showPrediction ? 'animate-pulse text-yellow-400' : ''}`} />
            <span>PROYEKSI: {showPrediction ? 'ON' : 'OFF'}</span>
          </button>

          {/* TWAP Toggle */}
          {chartMode === 'SPOT' && (
            <button
              onClick={() => setShowTwapLine(!showTwapLine)}
              className={`px-1.5 py-0.5 text-xs font-mono font-bold rounded border transition-colors ${
                showTwapLine
                  ? 'bg-purple-950/70 border-purple-500/60 text-purple-300'
                  : isDark
                  ? 'bg-[#141b2a] border-[#222e47] text-slate-500'
                  : 'bg-slate-200 border-slate-300 text-slate-500'
              }`}
              title="Chainlink TWAP"
            >
              TWAP
            </button>
          )}

          {/* Strike Toggle */}
          <button
            onClick={() => setShowStrike(!showStrike)}
            className={`hidden sm:inline px-1.5 py-0.5 text-xs font-mono font-bold rounded border transition-colors ${
              showStrike
                ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
                : isDark
                ? 'bg-[#141b2a] border-[#222e47] text-slate-500'
                : 'bg-slate-200 border-slate-300 text-slate-500'
            }`}
            title="Strike Line"
          >
            STRIKE
          </button>

          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`hidden md:inline px-1.5 py-0.5 text-xs font-mono font-bold rounded border transition-colors ${
              showVolume
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : isDark
                ? 'bg-[#141b2a] border-[#222e47] text-slate-500'
                : 'bg-slate-200 border-slate-300 text-slate-500'
            }`}
            title="Volume Histogram"
          >
            VOL
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-1 border rounded transition-colors ${
              isDark
                ? 'bg-[#141b2a] hover:bg-[#1f293d] border-[#222e47] text-slate-300'
                : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700'
            }`}
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Floating Legend Bar (Compact & Sleek) */}
      <div
        className={`px-2.5 py-1 border-b flex flex-wrap items-center justify-between text-[11px] font-mono gap-1.5 select-none flex-shrink-0 ${
          isDark ? 'bg-[#0a0e17]/95 border-[#141b2a]' : 'bg-slate-100/95 border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {assetName} {chartMode === 'SPOT' ? 'SPOT' : 'KONTRAK'}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-cyan-500 font-bold uppercase">{timeframe}</span>
          <span className="text-slate-400">•</span>
          <span className={`font-black ${isUpFromOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
            {chartMode === 'SPOT'
              ? `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${(lastPrice * 100).toFixed(1)}¢ ($${lastPrice.toFixed(3)})`}
          </span>
          {activeCandle && (
            <span className={`text-[10px] font-bold ${isUpFromOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
              ({candleChange >= 0 ? '+' : ''}{candleChangePct.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* OHLCV Values */}
        {activeCandle && (
          <div className="hidden md:flex items-center space-x-2.5 text-slate-500 text-[10px]">
            <span>O: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.open.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
            <span>H: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.high.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
            <span>L: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.low.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
            <span>C: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.close.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
          </div>
        )}

        {/* Strike & TWAP readouts */}
        <div className="flex items-center space-x-2.5">
          {strikePrice > 0 && chartMode === 'SPOT' && (
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">STRIKE:</span>
              <span className="font-bold text-cyan-500">
                ${strikePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-black px-1 rounded ${
                isAboveStrike ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
              }`}>
                {deltaFromStrike >= 0 ? '+' : ''}{deltaFromStrike.toFixed(2)}
              </span>
            </div>
          )}

          {runningTwap !== undefined && runningTwap > 0 && chartMode === 'SPOT' && (
            <div className="flex items-center space-x-1">
              <span className="text-purple-500 font-bold">TWAP:</span>
              <span className="font-bold text-purple-400">
                ${runningTwap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area - Automatically fits remaining space */}
      <div ref={chartContainerRef} className="w-full flex-1 min-h-0" />
    </div>
  );
};
