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
  LineType,
  TickMarkType,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CHART_COLORS,
  CHART_HEIGHT,
  CHART_TYPES,
  makeAvgBuyAutoscaleProvider,
  RANGES,
  SAMPLE_AVG_BUY_PRICE,
  VOLUME_PANE_SCALE,
} from "./lightChartConfig";
import { getLightChartMock } from "./getLightChartMock";
import { ChartTypeIcon } from "./ChartTypeIcons";
import type {
  ChartRange,
  ChartType,
  HighLowLabelPosition,
  OhlcvBar,
  PeriodHighLow,
  TickerInfo,
} from "./lightChartTypes";
import { toCandlestick } from "./lightChartTypes";

/** 국내 금거래소 기준 → 모든 시각 라벨은 KST(UTC+9)로 표기 */
const KST_OFFSET_SEC = 9 * 60 * 60;

/** [옵션 4] 크로스헤어 툴팁 레이아웃 상수 */
const TOOLTIP_WIDTH = 132;
const TOOLTIP_OFFSET_X = 12;
const TOOLTIP_OFFSET_Y = 36;

/** 거래정보 샘플 테이블 데이터 */
const SAMPLE_TRADE_ROWS = [
  {
    datetime: "2026-06-10 14:30",
    type: "매수",
    price: "220,000",
    quantity: "1g",
  },
  {
    datetime: "2026-06-09 11:15",
    type: "매도",
    price: "218,500",
    quantity: "0.5g",
  },
  {
    datetime: "2026-06-08 09:42",
    type: "매수",
    price: "217,800",
    quantity: "2g",
  },
] as const;

function formatKstHm(ts: number): string {
  const dt = new Date((ts + KST_OFFSET_SEC) * 1000);
  const hh = String(dt.getUTCHours()).padStart(2, "0");
  const mm = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatKstMonthDay(ts: number): string {
  const dt = new Date((ts + KST_OFFSET_SEC) * 1000);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function formatKstDate(ts: number): string {
  const dt = new Date((ts + KST_OFFSET_SEC) * 1000);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatKstDateTime(ts: number): string {
  return `${formatKstDate(ts)} ${formatKstHm(ts)}`;
}

function businessDayToDateString(
  time: string | { year: number; month: number; day: number },
): string {
  if (typeof time === "string") return time;
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
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
  timeLabel: string;
  x: number;
  y: number;
}

/** [옵션 4] 기간별 크로스헤어 시각 포맷 (KST) */
function formatCrosshairTime(time: Time, range: ChartRange): string {
  if (typeof time === "number") {
    switch (range) {
      case "1d":
        return formatKstHm(time);
      case "1w":
        return formatKstDateTime(time);
      case "3m":
      case "1y":
      case "all":
        return formatKstDate(time);
    }
  }
  return businessDayToDateString(time);
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
  range: ChartRange,
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
  onUpdate({
    price: Number(price),
    timeLabel: formatCrosshairTime(time, range),
    x,
    y,
  });
}

const toLineData = (bars: OhlcvBar[]): LineData[] =>
  bars.map((b) => ({ time: b.time, value: b.close }));

const toCandles = (bars: OhlcvBar[]): CandlestickData[] =>
  bars.map((b) => toCandlestick(b));

/** [옵션 1] 최고·최저 라벨 예상 반폭(px) — text-[10px] 기준 대략치 */
const HIGH_LOW_LABEL_HALF_WIDTH = 72;
const HIGH_LOW_EDGE_PAD = 4;

/** 앵커 X를 pane 안에 맞추고, 좌/우 끝에서는 정렬 방식을 바꿔 overflow 방지 */
function resolveHighLowLabelHorizontal(
  anchorX: number,
  paneWidth: number,
): Pick<HighLowLabelPosition, "left" | "translateX"> {
  const minCenter = HIGH_LOW_LABEL_HALF_WIDTH + HIGH_LOW_EDGE_PAD;
  const maxCenter = paneWidth - HIGH_LOW_LABEL_HALF_WIDTH - HIGH_LOW_EDGE_PAD;

  if (anchorX < minCenter) {
    return { left: HIGH_LOW_EDGE_PAD, translateX: "0%" };
  }
  if (anchorX > maxCenter) {
    return {
      left: paneWidth - HIGH_LOW_EDGE_PAD,
      translateX: "-100%",
    };
  }
  return { left: anchorX, translateX: "-50%" };
}

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
  const clampY = (y: number) =>
    Math.max(HIGH_LOW_EDGE_PAD, Math.min(y, pane.height - HIGH_LOW_EDGE_PAD));

  return {
    high: {
      ...resolveHighLowLabelHorizontal(xHigh, pane.width),
      top: clampY(yHigh),
    },
    low: {
      ...resolveHighLowLabelHorizontal(xLow, pane.width),
      top: clampY(yLow),
    },
  };
}

/** [옵션 3] OhlcvBar.volume → 하단 회색 Histogram 데이터 */
const toVolumeData = (bars: OhlcvBar[]): HistogramData[] =>
  bars.map((b) => ({
    time: b.time,
    value: b.volume,
    color: CHART_COLORS.volumeBar,
  }));

/** [옵션 2] 매수평균 수평 가격선 — 레이아웃 확정 후 attach */
function attachAvgBuyPriceLine(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any>,
  lineRef: React.MutableRefObject<IPriceLine | null>,
) {
  if (lineRef.current) {
    series.removePriceLine(lineRef.current);
    lineRef.current = null;
  }
  lineRef.current = series.createPriceLine({
    price: SAMPLE_AVG_BUY_PRICE,
    color: CHART_COLORS.avgBuyLine,
    lineWidth: 2,
    lineStyle: LineStyle.Dotted,
    lineVisible: true,
    axisLabelVisible: false,
    // title은 우측 가격축 영역에 그려져 visible:false일 때 보이지 않음 → HTML 오버레이 사용
    title: "",
  });
}

/** [옵션 2] 매수평균 라벨 Y좌표 — priceToCoordinate 기준 */
function computeAvgBuyLabelTop(
  chart: IChartApi,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any>,
): number | null {
  const y = series.priceToCoordinate(SAMPLE_AVG_BUY_PRICE);
  if (y === null) return null;
  const pane = chart.paneSize(0);
  const pad = 4;
  return Math.max(pad, Math.min(y, pane.height - pad));
}

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
    // 거래량(빈 데이터) 오버레이 스케일을 화면 밖으로 밀어 잔여 레이아웃 제거
    chart.priceScale("").applyOptions({
      visible: false,
      scaleMargins: { top: 1, bottom: 0 },
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
      // intraday(1d/1w)는 KST 시:분, 날짜 경계 눈금은 MM/DD로 표기해
      // 1주(7일치)에서도 어느 날인지 구분되게 한다.
      tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) => {
        if (typeof time === "number") {
          const isTimeTick =
            tickMarkType === TickMarkType.Time ||
            tickMarkType === TickMarkType.TimeWithSeconds;
          return isTimeTick ? formatKstHm(time) : formatKstMonthDay(time);
        }
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
      vertLines: { visible: false },
      horzLines: { visible: false },
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
  /** [옵션 4] 크로스헤어 툴팁 시간 포맷용 최신 range */
  const rangeRef = useRef<ChartRange>("1d");

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
  /** [옵션 2] 매수평균 라벨 Y좌표 (HTML 오버레이) */
  const [avgBuyLabelTop, setAvgBuyLabelTop] = useState<number | null>(null);
  /** [옵션 4] 크로스헤어 커스텀 툴팁 상태 */
  const [crosshairTooltip, setCrosshairTooltip] =
    useState<CrosshairTooltip | null>(null);

  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    showVolumeRef.current = showVolume;
    showHighLowRef.current = showHighLow;
    rangeRef.current = range;
  }, [showVolume, showHighLow, range]);

  useEffect(() => {
    periodHighLowRef.current = periodHighLow;
  }, [periodHighLow]);

  /** [옵션 2] 차트 렌더 후 매수평균 라벨 Y좌표 동기화 */
  const syncAvgBuyLabelPosition = () => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) {
      setAvgBuyLabelTop(null);
      return;
    }
    setAvgBuyLabelTop(computeAvgBuyLabelTop(chart, series));
  };

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

    // 레이아웃·가시범위 확정 후 매수평균선·라벨을 붙여 pane 밖으로 밀리는 현상 방지
    requestAnimationFrame(() => {
      attachAvgBuyPriceLine(series, avgPriceLineRef);
      syncAvgBuyLabelPosition();
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
        timeLabel: formatCrosshairTime(param.time, rangeRef.current),
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
        rangeRef.current,
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
      requestAnimationFrame(() => {
        syncHighLowLabelPositions(periodHighLowRef.current);
        syncAvgBuyLabelPosition();
      });
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
      setAvgBuyLabelTop(null);
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
        // 제거된 시리즈에 붙어있던 평균매수 PriceLine 참조도 함께 무효화
        // (새 시리즈에 stale 핸들을 removePriceLine 하면 에러)
        avgPriceLineRef.current = null;
      }
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }

      const avgBuyAutoscale = makeAvgBuyAutoscaleProvider(SAMPLE_AVG_BUY_PRICE);

      if (chartType === "candle") {
        seriesRef.current = chart.addSeries(CandlestickSeries, {
          upColor: CHART_COLORS.candleUp,
          downColor: CHART_COLORS.candleDown,
          borderVisible: false,
          wickUpColor: CHART_COLORS.candleUp,
          wickDownColor: CHART_COLORS.candleDown,
          autoscaleInfoProvider: avgBuyAutoscale,
        });
      } else {
        seriesRef.current = chart.addSeries(LineSeries, {
          color: CHART_COLORS.line,
          lineWidth: 2,
          lineType: LineType.Curved, // 기본 라인을 곡선(큐빅 보간)으로 표시
          /** [옵션 4] 라인 위 크로스헤어 마커 */
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          priceLineVisible: false,
          autoscaleInfoProvider: avgBuyAutoscale,
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

  // TODO: 샘플시연후 제거
  type SampleLayerKey =
    | "unit"
    | "chartType"
    | "avgBuy"
    | "volume"
    | "highLow"
    | "tooltip"
    | "miniChart";

  interface SampleLayerRect {
    left: string;
    top: string;
    width: string;
    height: string;
  }

  const SAMPLE_LAYER_RECTS: Record<SampleLayerKey, SampleLayerRect> = {
    /** 기간(1일·1주…) 버튼 행 */
    unit: { left: "0", top: "-16%", width: "210px", height: "37px" },
    /** 라인/캔들 차트타입 버튼 행 */
    chartType: { left: "89%", top: "-16%", width: "75px", height: "37px" },
    /** 매수평균 가격선·라벨 영역 */
    avgBuy: {
      left: "calc(100% - 79px)",
      top: "11%",
      width: "80px",
      height: "24px",
    },
    /** 하단 거래량 패널 (~20%) */
    volume: { left: "0px", top: "77%", width: "100%", height: "60px" },
    /** 최고·최저 라벨이 붙는 상단 구간 */
    highLow: { left: "5%", top: "-12px", width: "114px", height: "22px" },
    /** 크로스헤어 툴팁 예상 위치 */
    tooltip: { left: "42%", top: "40%", width: "140px", height: "48px" },
    /** 메인 차트 전체 */
    miniChart: {
      left: "69%",
      top: "-40%",
      width: "30%",
      height: `100px`,
    },
  };

  const [layerShow, setLayerShow] = useState(false);
  const [layerPosition, setLayerPosition] = useState<SampleLayerRect>(
    SAMPLE_LAYER_RECTS.unit,
  );

  // TODO: 샘플시연후 제거
  const handleSampleLayer = (layer: SampleLayerKey) => () => {
    setLayerShow(true);
    setLayerPosition(SAMPLE_LAYER_RECTS[layer]);
  };

  return (
    <div>
      <div className="relative w-full mt-[-15px] px-2 bg-white">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div className="flex flex-wrap items-center gap-1">
            {RANGES.map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={range === key ? "default" : "outline"}
                size="xs"
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
                variant={chartType === key ? "secondary" : "outline"}
                size="icon-xs"
                aria-label={label}
                onClick={() => setChartType(key)}
              >
                <ChartTypeIcon type={key} />
              </Button>
            ))}
          </div>
        </div>
        <div className="relative w-full ">
          <div ref={chartAreaRef} className="relative w-full touch-none ">
            <div
              className={`sample-layer-rainbow pointer-events-none absolute z-[10000] ${layerShow ? "block" : "hidden"}`}
              style={{
                left: layerPosition.left,
                top: layerPosition.top,
                width: layerPosition.width,
                height: layerPosition.height,
              }}
            />
            <div ref={containerRef} className="w-full" />
            {/* [옵션 1] 최고·최저 — timeToCoordinate / priceToCoordinate 앵커 */}
            {periodHighLow && showHighLow && highLowPositions ? (
              <>
                <div
                  className="pointer-events-none absolute z-20 whitespace-nowrap text-[10px] font-semibold tracking-tight text-red-500/90"
                  style={{
                    left: highLowPositions.high.left,
                    top: highLowPositions.high.top,
                    transform: `translate(${highLowPositions.high.translateX}, calc(-100% - 6px))`,
                  }}
                >
                  최고 {periodHighLow.high}({periodHighLow.highDate})
                </div>
                <div
                  className="pointer-events-none absolute z-20 whitespace-nowrap text-[10px] font-semibold tracking-tight text-blue-500/90"
                  style={{
                    left: highLowPositions.low.left,
                    top: highLowPositions.low.top,
                    transform: `translate(${highLowPositions.low.translateX}, 6px)`,
                  }}
                >
                  최저 {periodHighLow.low}({periodHighLow.lowDate})
                </div>
              </>
            ) : null}
            {/* [옵션 2] 매수평균 — 우측 가격축 숨김 시 createPriceLine title 대신 HTML 라벨 */}
            {avgBuyLabelTop !== null ? (
              <div
                className="pointer-events-none absolute right-1 z-20 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                style={{
                  top: avgBuyLabelTop,
                  transform: "translateY(-50%)",
                  backgroundColor: CHART_COLORS.avgBuyLine,
                }}
              >
                매수평균
              </div>
            ) : null}
            {/* [옵션 4] hover/터치 시 현재가 툴팁 */}
            {crosshairTooltip ? (
              <div
                className="pointer-events-none absolute z-30 flex flex-col gap-0.5 rounded-md border border-border bg-background/95 px-2 py-1 text-xs font-semibold text-foreground shadow-md"
                style={{
                  left: Math.min(
                    crosshairTooltip.x + TOOLTIP_OFFSET_X,
                    (chartAreaRef.current?.clientWidth ?? 300) - TOOLTIP_WIDTH,
                  ),
                  top: Math.max(8, crosshairTooltip.y - TOOLTIP_OFFSET_Y),
                }}
              >
                <span className="text-muted-foreground text-center">
                  {crosshairTooltip.timeLabel}
                </span>
                <span>{formatPrice(crosshairTooltip.price)} KRW</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-end pb-4">
          {/* <div className="flex flex-wrap items-center gap-1">
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
        </div> */}

          <div className="mt-5 flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("unit")}
            >
              단위
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("chartType")}
            >
              차트타입
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("avgBuy")}
            >
              매수평균
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("volume")}
            >
              볼륨
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("highLow")}
            >
              최고/최저
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("tooltip")}
            >
              툴팁
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleLayer("miniChart")}
            >
              미니차트
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">거래정보</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>거래일시</TableHead>
              <TableHead>구분</TableHead>
              <TableHead className="text-right">체결가</TableHead>
              <TableHead className="text-right">수량</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SAMPLE_TRADE_ROWS.map((row) => (
              <TableRow key={row.datetime}>
                <TableCell className="text-muted-foreground">
                  {row.datetime}
                </TableCell>
                <TableCell
                  className="font-medium"
                  style={{
                    color:
                      row.type === "매수"
                        ? CHART_COLORS.candleUp
                        : CHART_COLORS.candleDown,
                  }}
                >
                  {row.type}
                </TableCell>
                <TableCell
                  className="text-right font-medium"
                  style={{
                    color:
                      row.type === "매수"
                        ? CHART_COLORS.candleUp
                        : CHART_COLORS.candleDown,
                  }}
                >
                  {row.price}
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <small>* 비단의 경우 매수평균대신 전일종가 표기 </small>
      </div>
    </div>
  );
}
