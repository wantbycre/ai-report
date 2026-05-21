"use client";

/**
 * light-chart 패널
 *
 * UI 옵션 (토글/표시)
 * 1. 최고·최저 금액 — HTML 오버레이 + mock buildPeriodStats
 * 2. 평균매수 라인 — createPriceLine(SAMPLE_AVG_BUY_PRICE)
 * 3. 하단 거래량 막대 — HistogramSeries + VOLUME_PANE_SCALE
 * 4. 크로스헤어 툴팁 — subscribeCrosshairMove + 모바일 touch 핸들러
 */

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  TrackingModeExitMode,
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
  HighLowLabelPosition,
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

/** [옵션 4] 크로스헤어 툴팁에 표시할 가격 문자열 포맷 */
function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** [옵션 4] 커스텀 툴팁 위치·가격 상태 */
interface CrosshairTooltip {
  price: number;
  x: number;
  y: number;
}

/** [옵션 4] 크로스헤어가 가리키는 시리즈에서 라인 value 또는 캔들 close 추출 */
function priceFromCrosshairData(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  if ("value" in data && typeof data.value === "number") return data.value;
  if ("close" in data && typeof data.close === "number") return data.close;
  return null;
}

/** [옵션 4] 모바일 터치 좌표 → setCrosshairPosition + 툴팁 갱신 (데스크톱은 subscribeCrosshairMove) */
function updateCrosshairFromTouch(
  chart: IChartApi,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any>,
  clientX: number,
  clientY: number,
  onUpdate: (tooltip: CrosshairTooltip) => void,
): void {
  const chartEl = chart.chartElement();
  const rect = chartEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const time = chart.timeScale().coordinateToTime(x);
  if (time === null) return;

  const price = series.coordinateToPrice(y);
  if (price === null) return;

  chart.setCrosshairPosition(price, time, series);
  onUpdate({ price: Number(price), x, y });
}

const toLineData = (bars: OhlcvBar[]): LineData[] =>
  bars.map((b) => ({ time: b.time, value: b.close }));

const toCandles = (bars: OhlcvBar[]): CandlestickData[] =>
  bars.map((b) => toCandlestick(b));

/** [옵션 1] 최고·최저 봉 앵커 → 차트 pane 픽셀 좌표 */
function computeHighLowLabelPositions(
  chart: IChartApi,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any>,
  stats: PeriodHighLow,
): { high: HighLowLabelPosition; low: HighLowLabelPosition } | null {
  const xHigh = chart.timeScale().timeToCoordinate(stats.highTime);
  const yHigh = series.priceToCoordinate(stats.highPrice);
  const xLow = chart.timeScale().timeToCoordinate(stats.lowTime);
  const yLow = series.priceToCoordinate(stats.lowPrice);

  if (xHigh === null || yHigh === null || xLow === null || yLow === null) {
    return null;
  }

  const pane = chart.paneSize(0);
  const pad = 4;
  const clampX = (x: number) => Math.max(pad, Math.min(x, pane.width - pad));
  const clampY = (y: number) => Math.max(pad, Math.min(y, pane.height - pad));

  return {
    high: { x: clampX(xHigh), y: clampY(yHigh) },
    low: { x: clampX(xLow), y: clampY(yLow) },
  };
}

/** [옵션 3] OhlcvBar.volume → 하단 회색 Histogram 데이터 */
const toVolumeData = (bars: OhlcvBar[]): HistogramData[] =>
  bars.map((b) => ({
    time: b.time,
    value: b.volume,
    color: CHART_COLORS.volumeBar,
  }));

/** [옵션 3] 거래량 ON/OFF에 따라 가격·거래량 scaleMargins 분할/복원 */
function applyVolumePaneLayout(chart: IChartApi, showVolume: boolean) {
  if (showVolume) {
    chart.priceScale("right").applyOptions({
      visible: false, // Y축 거래량 축 숨기기
      scaleMargins: VOLUME_PANE_SCALE.main,
    });
    chart.priceScale("").applyOptions({
      scaleMargins: VOLUME_PANE_SCALE.volume,
      visible: false, // Y축 거래량 축 숨기기
    });
  } else {
    chart.priceScale("right").applyOptions({
      visible: false,
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
    rightPriceScale: { visible: false, borderVisible: false }, // Y축 금액 축 숨기기
    /** [옵션 4] 크로스헤어 선 표시(축 기본 라벨은 끄고 커스텀 툴팁 사용) */
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
    /** [옵션 4] 모바일 롱프레스 추적 모드(터치 핸들러와 병행) */
    trackingMode: {
      exitMode: TrackingModeExitMode.OnTouchEnd,
    },
  });
}

interface ApplyOptions {
  chartType: ChartType;
  /** [옵션 3] 거래량 막대 표시 여부 */
  showVolume: boolean;
  /** [옵션 1] 최고·최저 오버레이 표시 여부 */
  showHighLow: boolean;
  /** [옵션 1] periodStats → setPeriodHighLow 콜백 */
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
  /** [옵션 3] 하단 거래량 Histogram 시리즈 */
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  /** [옵션 2] 평균매수 가격선 인스턴스 */
  const avgPriceLineRef = useRef<IPriceLine | null>(null);
  const onTickRef = useRef(onTick);
  const lastSeriesKindRef = useRef<ChartType | null>(null);
  /** [옵션 3] applyRangeData에서 최신 showVolume 참조 */
  const showVolumeRef = useRef(true);
  /** [옵션 1] applyRangeData에서 최신 showHighLow 참조 */
  const showHighLowRef = useRef(true);

  const [range, setRange] = useState<ChartRange>("1d");
  const [chartType, setChartType] = useState<ChartType>("line");
  /** [옵션 3] 거래량 토글 상태 */
  const [showVolume, setShowVolume] = useState(true);
  /** [옵션 1] 최고·최저 토글 상태 */
  const [showHighLow, setShowHighLow] = useState(true);
  /** [옵션 1] 최고·최저 오버레이 문구 데이터 */
  const [periodHighLow, setPeriodHighLow] = useState<PeriodHighLow | null>(
    null,
  );
  /** [옵션 1] 최고·최저 라벨 화면 좌표 (차트 데이터·레이아웃 반영 후 갱신) */
  const [highLowPositions, setHighLowPositions] = useState<{
    high: HighLowLabelPosition;
    low: HighLowLabelPosition;
  } | null>(null);
  const periodHighLowRef = useRef<PeriodHighLow | null>(null);
  /** [옵션 4] 크로스헤어 커스텀 툴팁 상태 */
  const [crosshairTooltip, setCrosshairTooltip] =
    useState<CrosshairTooltip | null>(null);

  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    showVolumeRef.current = showVolume;
    showHighLowRef.current = showHighLow;
  }, [showVolume, showHighLow]);

  useEffect(() => {
    periodHighLowRef.current = periodHighLow;
  }, [periodHighLow]);

  /** [옵션 1] 차트 렌더 후 최고·최저 라벨 좌표 동기화 */
  const syncHighLowLabelPositions = (stats: PeriodHighLow | null) => {
    if (!stats || !showHighLowRef.current) {
      setHighLowPositions(null);
      return;
    }
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    setHighLowPositions(computeHighLowLabelPositions(chart, series, stats));
  };

  /** 기간·차트타입 변경 시 시리즈 데이터 및 UI 옵션(1~4) 반영 */
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

    /** [옵션 2] 평균매수 수평 가격선 — 기간과 무관하게 SAMPLE_AVG_BUY_PRICE 고정 */
    if (avgPriceLineRef.current) {
      series.removePriceLine(avgPriceLineRef.current);
      avgPriceLineRef.current = null;
    }
    avgPriceLineRef.current = series.createPriceLine({
      price: SAMPLE_AVG_BUY_PRICE,
      color: CHART_COLORS.avgBuyLine,
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true, // 매수평균 라벨 숨기기
      title: "매수평균",
    });

    /** [옵션 3] 하단 거래량 패널 영역 비율 적용 */
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

    /** [옵션 1] 최고·최저 오버레이용 periodStats 반영 */
    if (options.showHighLow) {
      options.onPeriodStats(periodStats);
      requestAnimationFrame(() => syncHighLowLabelPositions(periodStats));
    } else {
      options.onPeriodStats(null);
      setHighLowPositions(null);
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

    /** [옵션 4] PC 마우스 hover 시 크로스헤어 이동 → 툴팁 갱신 */
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

    const chartEl = chart.chartElement();
    /** [옵션 4] 모바일 터치 시 페이지 스크롤과 크로스헤어 충돌 방지 */
    chartEl.style.touchAction = "none";

    /** [옵션 4] 모바일 터치 공통 처리 */
    const handleTouch = (clientX: number, clientY: number) => {
      const mainSeries = seriesRef.current;
      if (!mainSeries) return;
      updateCrosshairFromTouch(
        chart,
        mainSeries,
        clientX,
        clientY,
        setCrosshairTooltip,
      );
    };

    /** [옵션 4] 터치 시작 */
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      handleTouch(touch.clientX, touch.clientY);
    };

    /** [옵션 4] 터치 드래그 */
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      handleTouch(touch.clientX, touch.clientY);
    };

    /** [옵션 4] 터치 종료 시 크로스헤어·툴팁 제거 */
    const onTouchEnd = () => {
      chart.clearCrosshairPosition();
      setCrosshairTooltip(null);
    };

    chartEl.addEventListener("touchstart", onTouchStart, { passive: false });
    chartEl.addEventListener("touchmove", onTouchMove, { passive: false });
    chartEl.addEventListener("touchend", onTouchEnd);
    chartEl.addEventListener("touchcancel", onTouchEnd);

    const onResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
      requestAnimationFrame(() =>
        syncHighLowLabelPositions(periodHighLowRef.current),
      );
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chartEl.removeEventListener("touchstart", onTouchStart);
      chartEl.removeEventListener("touchmove", onTouchMove);
      chartEl.removeEventListener("touchend", onTouchEnd);
      chartEl.removeEventListener("touchcancel", onTouchEnd);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      avgPriceLineRef.current = null;
      setCrosshairTooltip(null);
      setHighLowPositions(null);
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
          /** [옵션 4] 라인 위 크로스헤어 마커 */
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          priceLineVisible: false,
        });
      }

      /** [옵션 3] priceScaleId "" = 차트 하단 오버레이 거래량 패널 */
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
          {/* [옵션 3] 거래량 막대 ON/OFF */}
          {/* <Button
            type="button"
            variant={showVolume ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVolume((v) => !v)}
          >
            거래량
          </Button> */}
          {/* [옵션 1] 최고·최저 금액 오버레이 ON/OFF */}
          {/* <Button
            type="button"
            variant={showHighLow ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHighLow((v) => !v)}
          >
            최고·최저
          </Button> */}
        </div>
      </div>
      <div className="relative w-full">
        <div ref={chartAreaRef} className="relative w-full touch-none">
          <div ref={containerRef} className="w-full" />
          {/* [옵션 1] 최고·최저 — timeToCoordinate / priceToCoordinate 앵커 */}
          {periodHighLow && showHighLow && highLowPositions ? (
            <>
              <div
                className="pointer-events-none absolute z-20 whitespace-nowrap text-sm font-semibold tracking-tight text-red-500/90"
                style={{
                  left: highLowPositions.high.x,
                  top: highLowPositions.high.y,
                  transform: "translate(-50%, calc(-100% - 6px))",
                }}
              >
                최고 {periodHighLow.high}({periodHighLow.highDate})
              </div>
              <div
                className="pointer-events-none absolute z-20 whitespace-nowrap text-sm font-semibold tracking-tight text-blue-500/90"
                style={{
                  left: highLowPositions.low.x,
                  top: highLowPositions.low.y,
                  transform: "translate(-50%, 6px)",
                }}
              >
                최저 {periodHighLow.low}({periodHighLow.lowDate})
              </div>
            </>
          ) : null}
          {/* [옵션 4] hover/터치 시 현재가 툴팁 */}
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
