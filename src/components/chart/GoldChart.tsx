"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  LineSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
  type LineData,
  type Time,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { goldChartMockCandles } from "./goldChartMockData";

/**
 * CandlestickData 한 봉(캔들)의 핵심 필드입니다.
 * 
 * time
 * 이 봉이 속한 시각(또는 날짜) 입니다.
 * x축 위치를 결정합니다.
 * 여기서는 UTCTimestamp(초 단위 UTC)로 넣고 있습니다.

 * open
 * 해당 봉 시작 시점의 시가(첫 가격) 입니다.
 * 캔들 몸통의 한쪽 끝이 됩니다.
 * 캔들 몸통의 한쪽 끝이 됩니다.
 
 * high
 * 해당 봉 구간에서 나온 최고가 입니다.
 * 윗꼬리(upper wick)의 끝을 결정합니다.

 * low
 * 해당 봉 구간에서 나온 최저가 입니다.
 * 아랫꼬리(lower wick)의 끝을 결정합니다.

 * close
 * 해당 봉 종료 시점의 종가(마지막 가격) 입니다.
 * 캔들 몸통의 반대쪽 끝이 됩니다.
 * 추가로, open과 close의 관계로 상승/하락이 결정됩니다.

close > open → 상승봉 (upColor)
close < open → 하락봉 (downColor)
 * 
 */

// ─── 타입 ────────────────────────────────────────────────────────────────────

type Timeframe = "1m" | "1h" | "1d" | "1w" | "1M" | "1y";
type ChartType = "line" | "candle";

export interface TickerInfo {
  price: number;
  changeAmount: number;
  changePercent: number;
}

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "1m", label: "1분" },
  { key: "1h", label: "1시간" },
  { key: "1d", label: "일" },
  { key: "1w", label: "주" },
  { key: "1M", label: "월" },
  { key: "1y", label: "연" },
];

const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "line", label: "라인" },
  { key: "candle", label: "캔들" },
];

// ─── 데이터 취합 함수 ─────────────────────────────────────────────────────────

function aggregateDailyCandles(
  candles: CandlestickData[],
  timeframe: "1w" | "1M" | "1y",
): CandlestickData[] {
  const getKey = (dateStr: string): string => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    if (timeframe === "1w") {
      const dt = new Date(Date.UTC(y, mo - 1, d));
      const dow = dt.getUTCDay();
      dt.setUTCDate(d - (dow === 0 ? 6 : dow - 1));
      return dt.toISOString().slice(0, 10);
    }
    if (timeframe === "1M") return `${y}-${String(mo).padStart(2, "0")}-01`;
    return `${y}-01-01`;
  };

  const groupMap = new Map<string, CandlestickData[]>();
  for (const c of candles) {
    const key = getKey(c.time as string);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(c);
  }

  const result: CandlestickData[] = [];
  for (const [key, group] of groupMap) {
    result.push({
      time: key,
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close,
    });
  }
  return result;
}

function expandToIntraday(
  candles: CandlestickData[],
  timeframe: "1m" | "1h",
): CandlestickData<UTCTimestamp>[] {
  const minPerCandle = timeframe === "1m" ? 1 : 60;
  const tradingMinutes = 390;
  const candlesPerDay = Math.floor(tradingMinutes / minPerCandle);
  const daysToShow = timeframe === "1m" ? 5 : 30;
  const recent = candles.slice(-daysToShow);
  const result: CandlestickData<UTCTimestamp>[] = [];

  for (const daily of recent) {
    const [y, mo, d] = (daily.time as string).split("-").map(Number);
    const dayStart = Math.floor(Date.UTC(y, mo - 1, d, 0, 0, 0) / 1000);
    const { open, high, low, close } = daily;
    let cur = open;

    for (let j = 0; j < candlesPerDay; j++) {
      const seed = ((d * 1000 + j) * 1103515245 + 12345) >>> 0;
      const r1 = ((seed * 1103515245 + 12345) >>> 0) / 0x100000000;
      const r2 = ((seed * 1664525 + 1013904223) >>> 0) / 0x100000000;
      const r3 = ((seed * 134775813 + 1) >>> 0) / 0x100000000;

      const remaining = candlesPerDay - j;
      const target = open + ((close - open) * (j + 1)) / candlesPerDay;
      const drift = (target - cur) / remaining;
      const range = ((high - low) / candlesPerDay) * 1.5;

      const cOpen = Math.round(cur * 100) / 100;
      const rawClose = cur + drift + (r1 - 0.5) * range;
      const cClose =
        Math.round(Math.min(high, Math.max(low, rawClose)) * 100) / 100;
      const bodyTop = Math.max(cOpen, cClose);
      const bodyBot = Math.min(cOpen, cClose);
      const cHigh =
        Math.round(Math.min(high, bodyTop + r2 * range * 0.4) * 100) / 100;
      const cLow =
        Math.round(Math.max(low, bodyBot - r3 * range * 0.4) * 100) / 100;

      result.push({
        time: (dayStart + j * minPerCandle * 60) as UTCTimestamp,
        open: cOpen,
        high: cHigh,
        low: cLow,
        close: cClose,
      });
      cur = cClose;
    }
    if (result.length > 0)
      result[result.length - 1].close = Math.round(close * 100) / 100;
  }
  return result;
}

function buildData(tf: Timeframe): CandlestickData[] {
  switch (tf) {
    case "1m":
      return expandToIntraday(goldChartMockCandles, "1m") as CandlestickData[];
    case "1h":
      return expandToIntraday(goldChartMockCandles, "1h") as CandlestickData[];
    case "1d":
      return goldChartMockCandles;
    case "1w":
      return aggregateDailyCandles(goldChartMockCandles, "1w");
    case "1M":
      return aggregateDailyCandles(goldChartMockCandles, "1M");
    case "1y":
      return aggregateDailyCandles(goldChartMockCandles, "1y");
  }
}

const toLineData = (data: CandlestickData[]): LineData[] =>
  data.map((c) => ({ time: c.time, value: c.close }));

/** 전체 데이터 중 최근 2년치만 화면에 노출. 인트라데이는 fitContent 사용. */
function applyVisibleRange(
  chart: IChartApi,
  tf: Timeframe,
  data: CandlestickData[],
) {
  if (tf === "1m" || tf === "1h" || data.length === 0) {
    chart.timeScale().fitContent();
    return;
  }
  const lastStr = data[data.length - 1].time as string; // "YYYY-MM-DD"
  const [y, mo, d] = lastStr.split("-").map(Number);
  const fromStr = `${y - 2}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  chart
    .timeScale()
    .setVisibleRange({ from: fromStr as Time, to: lastStr as Time });
}

// ─── 라이브 캔들 상태 ─────────────────────────────────────────────────────────

interface LiveCandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  time: any;
  open: number;
  high: number;
  low: number;
  close: number;
  dayOpen: number;
}

function lastAsLive(data: CandlestickData[]): LiveCandle {
  const last = data[data.length - 1];
  return {
    time: last.time,
    open: last.open,
    high: last.high,
    low: last.low,
    close: last.close,
    dayOpen: last.open,
  };
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface GoldChartProps {
  onTick?: (ticker: TickerInfo) => void;
}

export default function GoldChart({ onTick }: GoldChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const liveRef = useRef<LiveCandle | null>(null);
  const onTickRef = useRef(onTick);
  const chartTypeRef = useRef<ChartType>("line");
  const timeframeRef = useRef<Timeframe>("1M");

  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [chartType, setChartType] = useState<ChartType>("line");

  // 최신 콜백 유지
  useEffect(() => {
    onTickRef.current = onTick;
  });

  // ── 차트 초기화 + 휠 줌 + 라이브 티커 (마운트 1회) ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#333",
      },
      width: containerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderVisible: false,
      },
      rightPriceScale: { borderVisible: false },
      grid: {
        vertLines: { color: "rgba(0,0,0,0.06)", style: LineStyle.Solid },
        horzLines: { color: "rgba(0,0,0,0.06)", style: LineStyle.Solid },
      },
      handleScale: {
        mouseWheel: false,
        pinch: true,
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
      },
    });

    chartRef.current = chart;

    // 커스텀 휠 줌
    const ZOOM_SENSITIVITY = 3.5;
    const container = containerRef.current;
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const ts = chart.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
      const factor = Math.exp(delta * 0.001 * ZOOM_SENSITIVITY);
      const span = range.to - range.from;
      const center = (range.from + range.to) / 2;
      ts.setVisibleLogicalRange({
        from: center - (span / 2) * factor,
        to: center + (span / 2) * factor,
      });
    };
    container.addEventListener("wheel", wheelHandler, { passive: false });

    // 라이브 티커
    const intervalId = setInterval(() => {
      if (!seriesRef.current || !liveRef.current) return;
      const live = liveRef.current;
      const pct = (Math.random() - 0.488) * 0.008;
      const newClose = Math.round(live.close * (1 + pct) * 100) / 100;
      const newHigh = Math.max(live.high, newClose);
      const newLow = Math.min(live.low, newClose);
      liveRef.current = {
        ...live,
        close: newClose,
        high: newHigh,
        low: newLow,
      };

      if (chartTypeRef.current === "candle") {
        seriesRef.current.update({
          time: live.time,
          open: live.open,
          high: newHigh,
          low: newLow,
          close: newClose,
        });
      } else {
        seriesRef.current.update({ time: live.time, value: newClose });
      }

      const changeAmount = newClose - live.dayOpen;
      onTickRef.current?.({
        price: newClose,
        changeAmount,
        changePercent: (changeAmount / live.dayOpen) * 100,
      });
    }, 2000);

    const onResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearInterval(intervalId);
      container.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ── 차트 타입 변경: 시리즈 재생성 ────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chartTypeRef.current = chartType;

    // 기존 시리즈 제거
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    const data = buildData(timeframeRef.current);

    if (chartType === "candle") {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: "#dd3c44",
        downColor: "#1375ec",
        borderVisible: false,
        wickUpColor: "#dd3c44",
        wickDownColor: "#1375ec",
      });
      s.setData(data);
      seriesRef.current = s;
    } else {
      const s = chart.addSeries(LineSeries, {
        color: "#dd3c44",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceLineVisible: true,
      });
      s.setData(toLineData(data));
      seriesRef.current = s;
    }

    applyVisibleRange(chart, timeframeRef.current, data);

    // 라이브 기준 갱신
    const prev = liveRef.current;
    const next = lastAsLive(data);
    liveRef.current = { ...next, dayOpen: prev?.dayOpen ?? next.dayOpen };

    // 초기 1회 틱 전달
    const { close, dayOpen } = liveRef.current;
    const changeAmount = close - dayOpen;
    onTickRef.current?.({
      price: close,
      changeAmount,
      changePercent: (changeAmount / dayOpen) * 100,
    });
  }, [chartType]);

  // ── 타임프레임 변경: 데이터 교체 ─────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    timeframeRef.current = timeframe;

    const isIntraday = timeframe === "1m" || timeframe === "1h";
    chart.applyOptions({
      timeScale: { timeVisible: isIntraday, secondsVisible: false },
    });

    const data = buildData(timeframe);
    if (chartTypeRef.current === "candle") {
      series.setData(data);
    } else {
      series.setData(toLineData(data));
    }
    applyVisibleRange(chart, timeframe, data);

    const prev = liveRef.current;
    const next = lastAsLive(data);
    liveRef.current = { ...next, dayOpen: prev?.dayOpen ?? next.dayOpen };
  }, [timeframe]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* 타임프레임 */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map(({ key, label }) => (
            <Button
              key={key}
              variant={timeframe === key ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        {/* 차트 타입 */}
        <div className="flex items-center gap-1">
          {CHART_TYPES.map(({ key, label }) => (
            <Button
              key={key}
              variant={chartType === key ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
    </>
  );
}
