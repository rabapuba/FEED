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

  // State tracking refs to prevent backwards jump or disappearing bars
  const prevTimeframeRef = useRef<TimeFrame>(timeframe);
  const prevModeRef = useRef<ChartMode>(chartMode);
  const prevStyleRef = useRef<ChartStyle>(chartStyle);
  const prevAssetRef = useRef<string>(assetName);
  const prevFirstTimeRef = useRef<number>(0);
  const prevLastTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Hover state for interactive legend
  const [hoveredCandle, setHoveredCandle] = useState<OHLCData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTwapLine, setShowTwapLine] = useState<boolean>(true);
  const [showStrike, setShowStrike] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  const TIMEFRAMES: Array<{ id: TimeFrame; label: string }> = [
    { id: '5s', label: '5s' },
    { id: '15s', label: '15s' },
    { id: '30s', label: '30s' },
    { id: '1m', label: '1m' },
    { id: '5m', label: '5m' },
    { id: '15m', label: '15m' },
  ];

  const isDark = theme === 'dark';

  // 1. Initialize Chart (Authentic Binance Pro Color Scheme)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isSpot = chartMode === 'SPOT';

    // Binance Pro Palette
    const bg = isDark ? '#181a20' : '#ffffff';
    const gridColor = isDark ? '#202630' : '#f0f3f6';
    const textColor = isDark ? '#848e9c' : '#474d57';
    const borderColor = isDark ? '#2b313a' : '#eaecef';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 450,
      layout: {
        background: { color: bg },
        textColor: textColor,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Inter', -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isDark ? '#5e6673' : '#b7bdc6',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#2b313a' : '#dcdfe6',
        },
        horzLine: {
          color: isDark ? '#5e6673' : '#b7bdc6',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#2b313a' : '#dcdfe6',
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        autoScale: true,
        borderVisible: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.2,
        },
        alignLabels: true,
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: timeframe === '5s' || timeframe === '15s' || timeframe === '30s',
        borderVisible: true,
        rightOffset: 6,
        barSpacing: 8,
        minBarSpacing: 2,
      },
    });

    // Add Volume Histogram Series (Binance Pro Green / Red Volume)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: isDark ? '#2b313a' : '#cbd5e1',
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

    // Add Main Price Series (Authentic Binance Green #0ecb81 and Red #f6465d)
    if (chartStyle === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: isSpot ? 'rgba(240, 185, 11, 0.35)' : 'rgba(14, 203, 129, 0.35)',
        bottomColor: 'rgba(240, 185, 11, 0.0)',
        lineColor: isSpot ? '#f0b90b' : '#0ecb81',
        lineWidth: 2,
        priceFormat: isSpot
          ? { type: 'price', precision: 2, minMove: 0.01 }
          : { type: 'price', precision: 3, minMove: 0.001 },
      });
      areaSeriesRef.current = areaSeries;
      candleSeriesRef.current = null;
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderUpColor: '#0ecb81',
        borderDownColor: '#f6465d',
        wickUpColor: '#0ecb81',
        wickDownColor: '#f6465d',
        priceFormat: isSpot
          ? { type: 'price', precision: 2, minMove: 0.01 }
          : { type: 'price', precision: 3, minMove: 0.001 },
      });
      candleSeriesRef.current = candleSeries;
      areaSeriesRef.current = null;
    }

    // Add Chainlink TWAP Line Series (Smooth Purple Neon)
    const twapSeries = chart.addSeries(LineSeries, {
      color: '#9353d3',
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

  // 2. High-Precision Continuous Data Updates
  useEffect(() => {
    if (!data || data.length === 0) return;

    const modeChanged = prevModeRef.current !== chartMode;
    const timeframeChanged = prevTimeframeRef.current !== timeframe;
    const styleChanged = prevStyleRef.current !== chartStyle;
    const assetChanged = prevAssetRef.current !== assetName;

    const firstTime = data[0].time;
    const lastTime = data[data.length - 1].time;
    const historyReset = firstTime !== prevFirstTimeRef.current;

    const mustFullReset =
      !isInitializedRef.current ||
      modeChanged ||
      timeframeChanged ||
      styleChanged ||
      assetChanged ||
      historyReset;

    prevModeRef.current = chartMode;
    prevTimeframeRef.current = timeframe;
    prevStyleRef.current = chartStyle;
    prevAssetRef.current = assetName;
    prevFirstTimeRef.current = firstTime;
    prevLastTimeRef.current = lastTime;

    // Update Candles Series
    if (candleSeriesRef.current) {
      if (mustFullReset) {
        const formatted = data.map((d) => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candleSeriesRef.current.setData(formatted);

        // ONLY fitContent on explicit user actions (asset/timeframe/mode change)
        if (!isInitializedRef.current || timeframeChanged || assetChanged || modeChanged) {
          chartRef.current?.timeScale().fitContent();
        }
        isInitializedRef.current = true;
      } else {
        // Continuous live bar update / append - smoothly keeps time scale moving forward
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
      if (mustFullReset) {
        const formatted = data.map((d) => ({
          time: d.time as any,
          value: d.close,
        }));
        areaSeriesRef.current.setData(formatted);
        if (!isInitializedRef.current || timeframeChanged || assetChanged || modeChanged) {
          chartRef.current?.timeScale().fitContent();
        }
        isInitializedRef.current = true;
      } else {
        const last = data[data.length - 1];
        areaSeriesRef.current.update({
          time: last.time as any,
          value: last.close,
        });
      }
    }

    // Update Volume Series (Binance Green / Red)
    if (volumeSeriesRef.current && showVolume) {
      if (mustFullReset) {
        const volFormatted = data.map((d) => ({
          time: d.time as any,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)',
        }));
        volumeSeriesRef.current.setData(volFormatted);
      } else {
        const last = data[data.length - 1];
        volumeSeriesRef.current.update({
          time: last.time as any,
          value: last.volume,
          color: last.close >= last.open ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)',
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

    // Strike Price Line (axisLabelVisible: false so it NEVER blocks the live candle price!)
    if (targetSeries) {
      if (strikeLineRef.current) {
        targetSeries.removePriceLine(strikeLineRef.current);
        strikeLineRef.current = null;
      }

      if (showStrike) {
        if (chartMode === 'SPOT' && strikePrice > 0) {
          strikeLineRef.current = targetSeries.createPriceLine({
            price: strikePrice,
            color: '#f0b90b', // Binance Gold
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: false, // Protected: DOES NOT OBSTRUCT LIVE CANDLE PRICE
            title: `STRIKE $${strikePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          });
        } else if (chartMode === 'CONTRACT') {
          strikeLineRef.current = targetSeries.createPriceLine({
            price: 0.50,
            color: '#f0b90b',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: false,
            title: `50¢ PARITAS`,
          });
        }
      }
    }

    // 30s Prediction Line (axisLabelVisible: false so it NEVER blocks the live candle price!)
    if (targetSeries) {
      if (predictionLineRef.current) {
        targetSeries.removePriceLine(predictionLineRef.current);
        predictionLineRef.current = null;
      }

      if (showPrediction && predictedPrice > 0) {
        const isSpot = chartMode === 'SPOT';
        const titleText = isSpot
          ? `PROYEKSI $${predictedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `PROYEKSI ${(predictedPrice * 100).toFixed(1)}¢`;

        predictionLineRef.current = targetSeries.createPriceLine({
          price: predictedPrice,
          color: '#38bdf8', // Cyan
          lineWidth: 1,
          lineStyle: 3, // Dotted
          axisLabelVisible: false, // Protected: DOES NOT OBSTRUCT LIVE CANDLE PRICE
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
    assetName,
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
        isDark ? 'bg-[#181a20] border border-[#2b313a]' : 'bg-white border border-[#eaecef]'
      } ${isFullscreen ? 'p-2' : ''}`}
    >
      {/* Top Binance Pro Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between px-2.5 py-1.5 border-b gap-1.5 z-10 select-none flex-shrink-0 ${
          isDark ? 'bg-[#181a20] border-[#2b313a]' : 'bg-[#fafafa] border-[#eaecef]'
        }`}
      >
        {/* Left: Timeframe Switcher (Binance Style) */}
        <div
          className={`flex items-center space-x-1 p-0.5 rounded-lg border ${
            isDark ? 'bg-[#1e2329] border-[#2b313a]' : 'bg-slate-100 border-slate-300'
          }`}
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-2.5 py-0.5 text-xs font-mono font-black rounded transition-all ${
                timeframe === tf.id
                  ? 'bg-[#f0b90b] text-slate-950 font-black shadow-sm'
                  : isDark
                  ? 'text-[#848e9c] hover:text-[#eaecef]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Center: Mode & Style Switcher (Binance Pro) */}
        <div className="flex items-center space-x-1.5">
          {/* Mode Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-[#1e2329] border-[#2b313a]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setChartMode('SPOT')}
              className={`px-3 py-0.5 rounded transition-colors font-black ${
                chartMode === 'SPOT'
                  ? 'bg-[#f0b90b] text-slate-950 shadow-sm'
                  : isDark
                  ? 'text-[#848e9c] hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              SPOT ($)
            </button>
            <button
              onClick={() => setChartMode('CONTRACT')}
              className={`px-3 py-0.5 rounded transition-colors font-black ${
                chartMode === 'CONTRACT'
                  ? 'bg-[#0ecb81] text-slate-950 shadow-sm'
                  : isDark
                  ? 'text-[#848e9c] hover:text-white'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              KONTRAK (¢)
            </button>
          </div>

          {/* Style Switcher */}
          <div
            className={`hidden sm:flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-[#1e2329] border-[#2b313a]' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setChartStyle('candles')}
              className={`p-1 rounded transition-colors ${
                chartStyle === 'candles'
                  ? 'bg-[#f0b90b] text-slate-950 font-bold'
                  : isDark
                  ? 'text-[#848e9c] hover:text-white'
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
                  ? 'bg-[#f0b90b] text-slate-950 font-bold'
                  : isDark
                  ? 'text-[#848e9c] hover:text-white'
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
                  ? 'bg-[#f0b90b] text-slate-950 font-bold'
                  : isDark
                  ? 'text-[#848e9c] hover:text-white'
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
            className={`flex items-center space-x-1 px-2.5 py-0.5 text-xs font-mono font-black rounded border transition-all ${
              showPrediction
                ? 'bg-[#f0b90b]/20 text-[#f0b90b] border-[#f0b90b]/60 shadow-sm'
                : isDark
                ? 'bg-[#1e2329] border-[#2b313a] text-slate-500 hover:text-slate-300'
                : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-800'
            }`}
            title="Garis Proyeksi 30 Detik (Kuning)"
          >
            <Zap className={`w-3 h-3 ${showPrediction ? 'animate-pulse text-[#f0b90b]' : ''}`} />
            <span>PROYEKSI: {showPrediction ? 'ON' : 'OFF'}</span>
          </button>

          {/* TWAP Toggle */}
          {chartMode === 'SPOT' && (
            <button
              onClick={() => setShowTwapLine(!showTwapLine)}
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded border transition-colors ${
                showTwapLine
                  ? 'bg-[#9353d3]/20 border-[#9353d3]/60 text-[#b57bee]'
                  : isDark
                  ? 'bg-[#1e2329] border-[#2b313a] text-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
              title="Chainlink TWAP"
            >
              TWAP
            </button>
          )}

          {/* Strike Toggle */}
          <button
            onClick={() => setShowStrike(!showStrike)}
            className={`hidden sm:inline px-2 py-0.5 text-xs font-mono font-bold rounded border transition-colors ${
              showStrike
                ? 'bg-[#f0b90b]/20 border-[#f0b90b]/60 text-[#f0b90b]'
                : isDark
                ? 'bg-[#1e2329] border-[#2b313a] text-slate-500'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
            title="Strike Benchmark Line"
          >
            STRIKE
          </button>

          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`hidden md:inline px-2 py-0.5 text-xs font-mono font-bold rounded border transition-colors ${
              showVolume
                ? 'bg-[#2b313a] border-[#3e4652] text-slate-200'
                : isDark
                ? 'bg-[#1e2329] border-[#2b313a] text-slate-500'
                : 'bg-slate-100 border-slate-300 text-slate-500'
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
                ? 'bg-[#1e2329] hover:bg-[#2b313a] border-[#2b313a] text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Binance Pro Floating Header Bar (Clear, Non-Obtrusive OHLCV + Polymarket TWAP Context) */}
      <div
        className={`px-3 py-1 border-b flex flex-wrap items-center justify-between text-[11px] font-mono gap-1.5 select-none flex-shrink-0 ${
          isDark ? 'bg-[#181a20]/95 border-[#2b313a]' : 'bg-[#f7f9fa]/95 border-[#eaecef]'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {assetName}/USDT {chartMode === 'SPOT' ? 'SPOT' : 'KONTRAK'}
          </span>
          <span className="text-[#848e9c]">•</span>
          <span className="text-[#f0b90b] font-extrabold uppercase">{timeframe}</span>
          <span className="text-[#848e9c]">•</span>
          <span className={`font-black text-xs ${isUpFromOpen ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {chartMode === 'SPOT'
              ? `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${(lastPrice * 100).toFixed(1)}¢ ($${lastPrice.toFixed(3)})`}
          </span>
          {activeCandle && (
            <span className={`text-[10px] font-extrabold ${isUpFromOpen ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              ({candleChange >= 0 ? '+' : ''}{candleChangePct.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* Binance OHLC Values */}
        {activeCandle && (
          <div className="hidden md:flex items-center space-x-2.5 text-[#848e9c] text-[10px]">
            <span>O: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.open.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
            <span>H: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.high.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
            <span>L: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.low.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
            <span>C: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeCandle.close.toFixed(chartMode === 'SPOT' ? 2 : 3)}</strong></span>
          </div>
        )}

        {/* Polymarket Strike & TWAP readouts (Clear & High Contrast) */}
        <div className="flex items-center space-x-3">
          {strikePrice > 0 && chartMode === 'SPOT' && (
            <div className="flex items-center space-x-1">
              <span className="text-[#848e9c]">STRIKE:</span>
              <span className="font-bold text-[#f0b90b]">
                ${strikePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-black px-1 rounded ${
                isAboveStrike ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'
              }`}>
                {deltaFromStrike >= 0 ? '+' : ''}{deltaFromStrike.toFixed(2)}
              </span>
            </div>
          )}

          {runningTwap !== undefined && runningTwap > 0 && chartMode === 'SPOT' && (
            <div className="flex items-center space-x-1">
              <span className="text-[#b57bee] font-bold">TWAP:</span>
              <span className="font-bold text-[#b57bee]">
                ${runningTwap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div ref={chartContainerRef} className="w-full flex-1 min-h-0" />
    </div>
  );
};
