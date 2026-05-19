"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
  type UTCTimestamp,
  type IPriceLine,
  type MouseEventParams,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import {
  CHART_COLORS,
  CHART_HEIGHT,
  CHART_TYPES,
  RANGES,
  SAMPLE_AVG_BUY_PRICE,
  VOLUME_PANE_SCALE,
} from "./lightChartConfig";
import { getLightChartMock } from "./getLightChartMock";
import type {
  ChartRange,
  ChartType,
  OhlcvBar,
  PeriodHighLow,
  TickerInfo,
} from "./lightChartTypes";
import { toCandlestick } from "./lightChartTypes";

function formatUtcHm(ts: number): string {
  const dt = new Date(ts * 1000);
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const mm = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface CrosshairTooltip {
  price: number;
  x: number;
  y: number;
}

function priceFromCrosshairData(
  data: unknown,
): number | null {
  if (!data || typeof data !== "object") return null;
  if ("value" in data && typeof data.value === "number") return data.value;
  if ("close" in data && typeof data.close === "number") return data.close;
  return null;
}

const toLineData = (bars: OhlcvBar[]): LineData[] =>
  bars.map((b) => ({ time: b.time, value: b.close }));

const toCandles = (bars: OhlcvBar[]): CandlestickData[] =>
  bars.map((b) => toCandlestick(b));

const toVolumeData = (bars: OhlcvBar[]): HistogramData[] =>
  bars.map((b) => ({
    time: b.time,
    value: b.volume,
    color: CHART_COLORS.volumeBar,
  }));

function applyVolumePaneLayout(chart: IChartApi, showVolume: boolean) {
  if (showVolume) {
    chart.priceScale("right").applyOptions({
      scaleMargins: VOLUME_PANE_SCALE.main,
    });
    chart.priceScale("").applyOptions({
      scaleMargins: VOLUME_PANE_SCALE.volume,
      visible: false,
    });
  } else {
    chart.priceScale("right").applyOptions({
      scaleMargins: VOLUME_PANE_SCALE.mainOnly,
    });
  }
}

function createLightChart(el: HTMLDivElement): IChartApi {
  return createChart(el, {
    layout: {
      background: { type: ColorType.Solid, color: "#ffffff" },
      textColor: "#333",
    },
    width: el.clientWidth,
    height: CHART_HEIGHT,
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderVisible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
      shiftVisibleRangeOnNewBar: false,
      lockVisibleTimeRangeOnResize: true,
      tickMarkFormatter: (time: Time) => {
        if (typeof time === "number") return formatUtcHm(time);
        if (typeof time === "string") return time.slice(5).replace("-", "/");
        return `${String(time.month).padStart(2, "0")}/${String(time.day).padStart(2, "0")}`;
      },
    },
    rightPriceScale: { borderVisible: false },
    crosshair: {
      mode: CrosshairMode.Magnet,
      horzLine: { visible: true, labelVisible: false },
      vertLine: { visible: true, labelVisible: false },
    },
    grid: {
      vertLines: { color: "rgba(0,0,0,0.06)", style: LineStyle.Solid },
      horzLines: { color: "rgba(0,0,0,0.06)", style: LineStyle.Solid },
    },
    handleScroll: {
      mouseWheel: false,
      pressedMouseMove: false,
      horzTouchDrag: false,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: false,
      pinch: false,
      axisPressedMouseMove: false,
      axisDoubleClickReset: false,
    },
  });
}

interface ApplyOptions {
  chartType: ChartType;
  showVolume: boolean;
  showHighLow: boolean;
  onPeriodStats: (stats: PeriodHighLow | null) => void;
  onTick?: (ticker: TickerInfo) => void;
}

interface LightChartPanelProps {
  onTick?: (ticker: TickerInfo) => void;
}

export default function LightChartPanel({ onTick }: LightChartPanelProps) {
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const avgPriceLineRef = useRef<IPriceLine | null>(null);
  const onTickRef = useRef(onTick);
  const lastSeriesKindRef = useRef<ChartType | null>(null);
  const showVolumeRef = useRef(true);
  const showHighLowRef = useRef(true);

  const [range, setRange] = useState<ChartRange>("1d");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [showVolume, setShowVolume] = useState(true);
  const [showHighLow, setShowHighLow] = useState(true);
  const [periodHighLow, setPeriodHighLow] = useState<PeriodHighLow | null>(
    null,
  );
  const [crosshairTooltip, setCrosshairTooltip] =
    useState<CrosshairTooltip | null>(null);

  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    showVolumeRef.current = showVolume;
    showHighLowRef.current = showHighLow;
  }, [showVolume, showHighLow]);

  const applyRangeData = (key: ChartRange, options: ApplyOptions) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const { bars, periodStats, ticker } = getLightChartMock(key);
    const isIntraday = key === "1d" || key === "1w";

    chart.applyOptions({
      timeScale: {
        timeVisible: isIntraday,
        secondsVisible: false,
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    const first = bars[0];
    const last = bars[bars.length - 1];
    if (!first || !last) return;

    if (options.chartType === "line") {
      series.setData(toLineData(bars));
    } else {
      series.setData(toCandles(bars));
    }

    if (avgPriceLineRef.current) {
      series.removePriceLine(avgPriceLineRef.current);
      avgPriceLineRef.current = null;
    }
    avgPriceLineRef.current = series.createPriceLine({
      price: SAMPLE_AVG_BUY_PRICE,
      color: CHART_COLORS.avgBuyLine,
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: "매수평균",
    });

    applyVolumePaneLayout(chart, options.showVolume);

    const volumeSeries = volumeSeriesRef.current;
    if (volumeSeries) {
      if (options.showVolume) {
        volumeSeries.setData(toVolumeData(bars));
      } else {
        volumeSeries.setData([]);
      }
    }

    chart.timeScale().setVisibleRange({
      from: first.time as Time,
      to:
        key === "1d" || key === "1w"
          ? (last.time as UTCTimestamp)
          : (last.time as Time),
    });

    if (options.showHighLow) {
      options.onPeriodStats(periodStats);
    } else {
      options.onPeriodStats(null);
    }

    onTickRef.current?.(ticker);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createLightChart(el);
    chartRef.current = chart;
    seriesRef.current = null;
    volumeSeriesRef.current = null;
    lastSeriesKindRef.current = null;

    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      if (
        param.point === undefined ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        !param.time
      ) {
        setCrosshairTooltip(null);
        return;
      }
      const mainSeries = seriesRef.current;
      if (!mainSeries) {
        setCrosshairTooltip(null);
        return;
      }
      const price = priceFromCrosshairData(param.seriesData.get(mainSeries));
      if (price === null) {
        setCrosshairTooltip(null);
        return;
      }
      setCrosshairTooltip({
        price,
        x: param.point.x,
        y: param.point.y,
      });
    };

    chart.subscribeCrosshairMove(onCrosshairMove);

    const onResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      avgPriceLineRef.current = null;
      setCrosshairTooltip(null);
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const needNewSeries =
      !seriesRef.current || lastSeriesKindRef.current !== chartType;

    if (needNewSeries) {
      if (seriesRef.current) {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }

      if (chartType === "candle") {
        seriesRef.current = chart.addSeries(CandlestickSeries, {
          upColor: CHART_COLORS.candleUp,
          downColor: CHART_COLORS.candleDown,
          borderVisible: false,
          wickUpColor: CHART_COLORS.candleUp,
          wickDownColor: CHART_COLORS.candleDown,
        });
      } else {
        seriesRef.current = chart.addSeries(LineSeries, {
          color: CHART_COLORS.line,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          priceLineVisible: false,
        });
      }

      volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "",
        lastValueVisible: false,
        priceLineVisible: false,
      });

      lastSeriesKindRef.current = chartType;
    }

    if (!seriesRef.current) return;

    const frameId = requestAnimationFrame(() =>
      applyRangeData(range, {
        chartType,
        showVolume: showVolumeRef.current,
        showHighLow: showHighLowRef.current,
        onPeriodStats: setPeriodHighLow,
      }),
    );
    return () => cancelAnimationFrame(frameId);
  }, [range, chartType, showVolume, showHighLow]);

  return (
    <div className="relative w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {RANGES.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={range === key ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {CHART_TYPES.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={chartType === key ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType(key)}
            >
              {label}
            </Button>
          ))}
          <Button
            type="button"
            variant={showVolume ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVolume((v) => !v)}
          >
            거래량
          </Button>
          <Button
            type="button"
            variant={showHighLow ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHighLow((v) => !v)}
          >
            최고·최저
          </Button>
        </div>
      </div>
      <div className="relative w-full">
        {periodHighLow && showHighLow ? (
          <>
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 text-sm font-semibold tracking-tight text-red-500/90">
              최고 {periodHighLow.high}({periodHighLow.highDate})
            </div>
            <div className="pointer-events-none absolute bottom-24 right-6 z-20 text-sm font-semibold tracking-tight text-blue-500/90">
              최저 {periodHighLow.low}({periodHighLow.lowDate})
            </div>
          </>
        ) : null}
        <div ref={chartAreaRef} className="relative w-full">
          <div ref={containerRef} className="w-full" />
          {crosshairTooltip ? (
            <div
              className="pointer-events-none absolute z-30 rounded-md border border-border bg-background/95 px-2 py-1 text-xs font-semibold text-foreground shadow-md"
              style={{
                left: Math.min(
                  crosshairTooltip.x + 12,
                  (chartAreaRef.current?.clientWidth ?? 300) - 132,
                ),
                top: Math.max(8, crosshairTooltip.y - 36),
              }}
            >
              {formatPrice(crosshairTooltip.price)} KRW
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
