"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { goldChartMockCandles } from "./goldChartMockData";

// ─── 타입 ────────────────────────────────────────────────────────────────────

type Timeframe = "1m" | "1h" | "1d" | "1w" | "1M" | "1y";

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
      const cClose = Math.round(Math.min(high, Math.max(low, rawClose)) * 100) / 100;
      const bodyTop = Math.max(cOpen, cClose);
      const bodyBot = Math.min(cOpen, cClose);
      const cHigh = Math.round(Math.min(high, bodyTop + r2 * range * 0.4) * 100) / 100;
      const cLow = Math.round(Math.max(low, bodyBot - r3 * range * 0.4) * 100) / 100;

      result.push({
        time: (dayStart + j * minPerCandle * 60) as UTCTimestamp,
        open: cOpen,
        high: cHigh,
        low: cLow,
        close: cClose,
      });
      cur = cClose;
    }

    if (result.length > 0) {
      result[result.length - 1].close = Math.round(close * 100) / 100;
    }
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

// ─── 라이브 캔들 상태 ─────────────────────────────────────────────────────────

interface LiveCandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  time: any;
  open: number;
  high: number;
  low: number;
  close: number;
  dayOpen: number; // 등락 기준
}

function lastAsLive(data: CandlestickData[]): LiveCandle {
  const last = data[data.length - 1];
  return { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close, dayOpen: last.open };
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface GoldChartProps {
  onTick?: (ticker: TickerInfo) => void;
}

export default function GoldChart({ onTick }: GoldChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const liveRef = useRef<LiveCandle | null>(null);
  const onTickRef = useRef(onTick);
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");

  // 최신 콜백 유지 (effect 재실행 없이)
  useEffect(() => {
    onTickRef.current = onTick;
  });

  // 차트 초기화 + 라이브 티커 (마운트 1회)
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
      // 기본 마우스휠 줌 비활성 → 커스텀 핸들러로 감도 조정
      handleScale: {
        mouseWheel: false,
        pinch: true,
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#dd3c44",
      downColor: "#1375ec",
      borderVisible: false,
      wickUpColor: "#dd3c44",
      wickDownColor: "#1375ec",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const initial = buildData("1M");
    series.setData(initial);
    chart.timeScale().fitContent();

    liveRef.current = lastAsLive(initial);

    // 초기 가격 즉시 전달
    const { close, dayOpen } = liveRef.current;
    onTickRef.current?.({
      price: close,
      changeAmount: close - dayOpen,
      changePercent: ((close - dayOpen) / dayOpen) * 100,
    });

    // 2초마다 라이브 업데이트
    const intervalId = setInterval(() => {
      if (!seriesRef.current || !liveRef.current) return;
      const live = liveRef.current;

      // ±0.4% 랜덤 워크 (약간 상향 편향)
      const pct = (Math.random() - 0.488) * 0.008;
      const newClose = Math.round((live.close * (1 + pct)) * 100) / 100;
      const newHigh = Math.max(live.high, newClose);
      const newLow = Math.min(live.low, newClose);

      liveRef.current = { ...live, close: newClose, high: newHigh, low: newLow };

      seriesRef.current.update({
        time: live.time,
        open: live.open,
        high: newHigh,
        low: newLow,
        close: newClose,
      });

      const changeAmount = newClose - live.dayOpen;
      const changePercent = (changeAmount / live.dayOpen) * 100;
      onTickRef.current?.({ price: newClose, changeAmount, changePercent });
    }, 2000);

    // 커스텀 휠 줌 — Mac 트랙패드는 deltaY가 작아 감도 배율 적용
    const ZOOM_SENSITIVITY = 3.5;
    const container = containerRef.current;
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const ts = chart.timeScale();
      const range = ts.getVisibleLogicalRange();
      if (!range) return;

      // deltaMode: 0=픽셀(트랙패드), 1=라인(마우스휠)
      const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
      const factor = Math.exp(delta * 0.001 * ZOOM_SENSITIVITY);
      const span = range.to - range.from;
      const center = (range.from + range.to) / 2;
      const newHalf = (span / 2) * factor;

      ts.setVisibleLogicalRange({
        from: center - newHalf,
        to: center + newHalf,
      });
    };
    container.addEventListener("wheel", wheelHandler, { passive: false });

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

  // 타임프레임 변경: 데이터 교체 + liveRef 갱신
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const isIntraday = timeframe === "1m" || timeframe === "1h";
    chart.applyOptions({
      timeScale: { timeVisible: isIntraday, secondsVisible: false },
    });

    const data = buildData(timeframe);
    series.setData(data);
    chart.timeScale().fitContent();

    // 라이브 기준 캔들 교체 (기존 dayOpen은 유지하여 등락 연속성 보존)
    const prev = liveRef.current;
    const next = lastAsLive(data);
    liveRef.current = { ...next, dayOpen: prev?.dayOpen ?? next.dayOpen };
  }, [timeframe]);

  return (
    <>
      <div className="flex items-center gap-1 mb-2">
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
      <div ref={containerRef} className="w-full" />
    </>
  );
}
