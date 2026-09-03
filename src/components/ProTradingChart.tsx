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
import { OHLCData, TimeFrame, ChartMode, ChartStyle } from '../types/market';
import {
  Maximize2,
  Minimize2,
  BarChart2,
  Activity,
  Layers,
  Eye,
  EyeOff,
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
  lastPrice: number;
  strikePrice: number;
  runningTwap?: number;
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
  lastPrice,
  strikePrice,
  runningTwap,
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

  // Hover state for interactive legend
  const [hoveredCandle, setHoveredCandle] = useState<OHLCData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTwapLine, setShowTwapLine] = useState<boolean>(true);
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

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isSpot = chartMode === 'SPOT';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 480,
      layout: {
        background: { color: '#080b11' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#131b2c' },
        horzLines: { color: '#131b2c' },
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true,
        borderVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.22, // Space for volume histogram
        },
        alignLabels: true,
      },
      timeScale: {
        borderColor: '#1e293b',
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
      color: '#334155',
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
        topColor: isSpot ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.4)',
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

    // Add Chainlink TWAP Line Series (Neon Purple)
    const twapSeries = chart.addSeries(LineSeries, {
      color: '#c084fc',
      lineWidth: 2,
      lineStyle: 0, // Solid
      priceScaleId: 'right',
      title: 'TWAP',
      priceFormat: isSpot
        ? { type: 'price', precision: 2, minMove: 0.01 }
        : { type: 'price', precision: 3, minMove: 0.001 },
    });
    twapSeriesRef.current = twapSeries;

    chartRef.current = chart;

    // Subscribe crosshair move for real-time legend
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

    // Resize observer
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
    };
  }, [chartMode, chartStyle]);

  // 2. Feed Data to Chart Series
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Format for Candles
    if (candleSeriesRef.current) {
      const formatted = data.map((d) => ({
        time: d.time as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      candleSeriesRef.current.setData(formatted);
    }

    // Format for Area
    if (areaSeriesRef.current) {
      const formatted = data.map((d) => ({
        time: d.time as any,
        value: d.close,
      }));
      areaSeriesRef.current.setData(formatted);
    }

    // Format for Volume
    if (volumeSeriesRef.current && showVolume) {
      const volFormatted = data.map((d) => ({
        time: d.time as any,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      }));
      volumeSeriesRef.current.setData(volFormatted);
    }

    // Update TWAP Series
    if (twapSeriesRef.current) {
      if (showTwapLine && twapData.length > 0) {
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

    // Update Strike Price Horizontal Line
    const targetSeries = candleSeriesRef.current || areaSeriesRef.current;
    if (targetSeries && chartMode === 'SPOT' && strikePrice > 0) {
      if (strikeLineRef.current) {
        targetSeries.removePriceLine(strikeLineRef.current);
      }
      strikeLineRef.current = targetSeries.createPriceLine({
        price: strikePrice,
        color: '#06b6d4',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `STRIKE: $${strikePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      });
    }
  }, [data, twapData, chartMode, strikePrice, showTwapLine, showVolume]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Active or hovered values for display
  const activeCandle = hoveredCandle || (data.length > 0 ? data[data.length - 1] : null);
  const isUpFromOpen = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const candleChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleChangePct = activeCandle && activeCandle.open > 0 ? (candleChange / activeCandle.open) * 100 : 0;
  const deltaFromStrike = activeCandle && strikePrice > 0 ? activeCandle.close - strikePrice : 0;
  const isAboveStrike = deltaFromStrike >= 0;

  return (
    <div
      ref={chartWrapperRef}
      className={`relative w-full h-full flex flex-col bg-[#080b11] border border-[#1a2337] rounded-xl overflow-hidden shadow-2xl ${
        isFullscreen ? 'p-3' : ''
      }`}
    >
      {/* Top Pro Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#0d131f] border-b border-[#1a2337] gap-2 z-10 select-none">
        
        {/* Left: Timeframe Switcher */}
        <div className="flex items-center space-x-1 bg-[#141b2a] p-1 rounded-lg border border-[#222e47]">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all ${
                timeframe === tf.id
                  ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Center: Mode & Style Switcher */}
        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#141b2a] p-1 rounded-lg border border-[#222e47] text-xs font-mono">
            <button
              onClick={() => setChartMode('SPOT')}
              className={`px-2.5 py-1 rounded transition-colors font-bold ${
                chartMode === 'SPOT'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SPOT ($)
            </button>
            <button
              onClick={() => setChartMode('CONTRACT')}
              className={`px-2.5 py-1 rounded transition-colors font-bold ${
                chartMode === 'CONTRACT'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              KONTRAK (¢)
            </button>
          </div>

          {/* Style Switcher */}
          <div className="hidden sm:flex items-center bg-[#141b2a] p-1 rounded-lg border border-[#222e47] text-xs font-mono">
            <button
              onClick={() => setChartStyle('candles')}
              className={`p-1.5 rounded transition-colors ${
                chartStyle === 'candles' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Candlesticks"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartStyle('heikin-ashi')}
              className={`p-1.5 rounded transition-colors ${
                chartStyle === 'heikin-ashi' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Heikin Ashi (Trend Smoothed)"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartStyle('area')}
              className={`p-1.5 rounded transition-colors ${
                chartStyle === 'area' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Area Line"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Overlays Toggle & Fullscreen */}
        <div className="flex items-center space-x-1.5">
          {/* TWAP Toggle */}
          <button
            onClick={() => setShowTwapLine(!showTwapLine)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs font-mono font-bold rounded border transition-colors ${
              showTwapLine
                ? 'bg-purple-950/70 border-purple-500/60 text-purple-300'
                : 'bg-[#141b2a] border-[#222e47] text-slate-500'
            }`}
            title="Toggle Chainlink TWAP Line"
          >
            {showTwapLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>TWAP</span>
          </button>

          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`hidden md:flex items-center space-x-1 px-2 py-1 text-xs font-mono font-bold rounded border transition-colors ${
              showVolume
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-[#141b2a] border-[#222e47] text-slate-500'
            }`}
            title="Toggle Volume Histogram"
          >
            <span>VOL</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-[#141b2a] hover:bg-[#1f293d] border border-[#222e47] rounded text-slate-300 transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Floating Interactive OHLCV & Strike Delta Header Legend */}
      <div className="px-3 py-1.5 bg-[#0a0e17]/95 border-b border-[#141b2a] flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-mono gap-2 select-none">
        
        {/* Pair & Current Price Readout */}
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-white">
            {assetName} {chartMode === 'SPOT' ? 'SPOT' : 'KONTRAK'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400 font-bold uppercase">{timeframe}</span>
          <span className="text-slate-500">•</span>
          <span className={`font-black ${isUpFromOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
            {chartMode === 'SPOT'
              ? `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${(lastPrice * 100).toFixed(1)}¢`}
          </span>
          {activeCandle && (
            <span className={`text-[10px] font-bold ${isUpFromOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({candleChange >= 0 ? '+' : ''}{candleChangePct.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* OHLCV Detailed Values */}
        {activeCandle && (
          <div className="hidden lg:flex items-center space-x-3 text-slate-400">
            <span>O: <strong className="text-slate-200">{activeCandle.open.toFixed(2)}</strong></span>
            <span>H: <strong className="text-slate-200">{activeCandle.high.toFixed(2)}</strong></span>
            <span>L: <strong className="text-slate-200">{activeCandle.low.toFixed(2)}</strong></span>
            <span>C: <strong className="text-slate-200">{activeCandle.close.toFixed(2)}</strong></span>
          </div>
        )}

        {/* Strike & TWAP Benchmarks */}
        <div className="flex items-center space-x-3">
          {strikePrice > 0 && chartMode === 'SPOT' && (
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">STRIKE:</span>
              <span className="font-bold text-cyan-400">
                ${strikePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-black px-1 rounded ${
                isAboveStrike ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
              }`}>
                {deltaFromStrike >= 0 ? '+' : ''}{deltaFromStrike.toFixed(2)}
              </span>
            </div>
          )}

          {runningTwap !== undefined && runningTwap > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-purple-400 font-bold">TWAP:</span>
              <span className="font-bold text-purple-300">
                ${runningTwap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div ref={chartContainerRef} className="w-full flex-1 min-h-[420px]" />
    </div>
  );
};
