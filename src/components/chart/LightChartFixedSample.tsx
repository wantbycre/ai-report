"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineType,
  LineSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import type { TickerInfo } from "@/components/chart/GoldChart";
import {
  type LightChartMockKey,
  buildLightChartMockData,
} from "@/components/chart/lightChartMockData";

const RANGES: { key: LightChartMockKey; label: string }[] = [
  { key: "day", label: "일" },
  { key: "week", label: "주" },
  { key: "quarter", label: "분기" },
  { key: "year", label: "년" },
];

type ChartType = "line" | "candle";

const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "line", label: "라인" },
  { key: "candle", label: "캔들" },
];

const toLineData = (data: CandlestickData[]): LineData[] =>
  data.map((c) => ({ time: c.time, value: c.close }));

const toVolumeData = (data: CandlestickData[]): HistogramData[] =>
  data.map((c, i) => {
    const isSpike = i % 180 === 0 || i % 127 === 0;
    const body = Math.abs(c.close - c.open);
    return {
      time: c.time,
      value: Math.max(1, Math.round((isSpike ? 24 : 4) + body * 0.18)),
      color: "rgba(160,160,160,0.55)",
    };
  });

function formatUtcHm(ts: number): string {
  const dt = new Date(ts * 1000);
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const mm = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function lastTickerFromCandles(data: CandlestickData[]): TickerInfo | null {
  if (data.length === 0) return null;
  const last = data[data.length - 1];
  const first = data[0];
  const dayOpen = first.open;
  const close = last.close;
  const changeAmount = close - dayOpen;
  return {
    price: close,
    changeAmount,
    changePercent: dayOpen !== 0 ? (changeAmount / dayOpen) * 100 : 0,
  };
}

interface Props {
  onTick?: (ticker: TickerInfo) => void;
}

export default function LightChartFixedSample({ onTick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const onTickRef = useRef(onTick);
  const chartTypeRef = useRef<ChartType>("line");
  const lastSeriesKindRef = useRef<ChartType | null>(null);

  const [range, setRange] = useState<LightChartMockKey>("day");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [weekLabel, setWeekLabel] = useState<{
    high: string;
    low: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#333",
      },
      width: el.clientWidth,
      height: 500,
      timeScale: {
        // 2. 시간축 여백 고정 및 전체 보기 강제
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
      grid: {
        vertLines: { color: "rgba(0,0,0,0.06)", style: LineStyle.Solid },
        horzLines: { color: "rgba(0,0,0,0.06)", style: LineStyle.Solid },
      },
      // / 1. 모든 인터랙션(이동/확대) 차단
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      // 1. 모든 인터랙션(이동/확대) 차단
      handleScale: {
        mouseWheel: false,
        pinch: false,
        axisPressedMouseMove: false,
        axisDoubleClickReset: false,
      },
    });

    chartRef.current = chart;
    seriesRef.current = null;
    volumeSeriesRef.current = null;
    lastSeriesKindRef.current = null;

    const onResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  const applySeriesData = (key: LightChartMockKey) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const full = buildLightChartMockData(key);
    const isIntraday = key !== "year";
    chart.applyOptions({
      timeScale: {
        timeVisible: isIntraday,
        secondsVisible: false,
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    const first = full[0];
    const last = full[full.length - 1];
    if (!first || !last) return;
    const volumeSeries = volumeSeriesRef.current;
    if (chartTypeRef.current === "line") {
      series.setData(toLineData(full));
    } else {
      series.setData(full);
    }
    chart.timeScale().setVisibleRange({
      from: first.time as Time,
      to: key === "year" ? (last.time as Time) : (last.time as UTCTimestamp),
    });
    if (volumeSeries && key === "week" && chartTypeRef.current === "line") {
      volumeSeries.setData(toVolumeData(full));
      const hi = full.reduce((a, b) => (a.high > b.high ? a : b));
      const lo = full.reduce((a, b) => (a.low < b.low ? a : b));
      const date =
        typeof hi.time === "number"
          ? (() => {
              const d = new Date(hi.time * 1000);
              const yy = String(d.getUTCFullYear()).slice(2);
              const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
              const dd = String(d.getUTCDate()).padStart(2, "0");
              return `${yy}/${mm}/${dd}`;
            })()
          : "";
      setWeekLabel({
        high: Math.round(hi.high).toLocaleString("ko-KR"),
        low: Math.round(lo.low).toLocaleString("ko-KR"),
        date,
      });
    } else {
      if (volumeSeries) volumeSeries.setData([]);
      setWeekLabel(null);
    }
    const tick = lastTickerFromCandles(full);
    if (tick) onTickRef.current?.(tick);
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chartTypeRef.current = chartType;

    const needNewSeries =
      !seriesRef.current || lastSeriesKindRef.current !== chartType;
    if (needNewSeries) {
      if (seriesRef.current) {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
      if (chartType === "candle") {
        seriesRef.current = chart.addSeries(CandlestickSeries, {
          upColor: "#dd3c44",
          downColor: "#1375ec",
          borderVisible: false,
          wickUpColor: "#dd3c44",
          wickDownColor: "#1375ec",
        });
      } else {
        seriesRef.current = chart.addSeries(LineSeries, {
          color: "#dd3c44",
          lineWidth: 2,
          lineType: LineType.WithSteps,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          priceLineVisible: false,
        });
      }
      if (!volumeSeriesRef.current) {
        volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "",
          lastValueVisible: false,
          priceLineVisible: false,
        });
      }
      lastSeriesKindRef.current = chartType;
    }

    if (!seriesRef.current) return;
    const frameId = requestAnimationFrame(() => applySeriesData(range));
    return () => cancelAnimationFrame(frameId);
  }, [range, chartType]);

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
        </div>
      </div>
      <div className="relative w-full">
        {weekLabel && range === "week" && chartType === "line" ? (
          <>
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 text-3xl font-semibold tracking-tight text-red-500/90">
              최고 {weekLabel.high}({weekLabel.date})
            </div>
            <div className="pointer-events-none absolute bottom-24 right-6 z-20 text-3xl font-semibold tracking-tight text-blue-500/90">
              최저 {weekLabel.low}({weekLabel.date})
            </div>
          </>
        ) : null}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
