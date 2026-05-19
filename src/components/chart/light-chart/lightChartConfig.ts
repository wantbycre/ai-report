import type { ChartRange, ChartType } from "./lightChartTypes";

/** 샘플 매수평균 단가 (추후 API 연동) — 8구간(보합) 부근 */
export const SAMPLE_AVG_BUY_PRICE = 227_400;

export const CHART_HEIGHT = 500;

export const CHART_COLORS = {
  line: "#dd3c44",
  candleUp: "#dd3c44",
  candleDown: "#1375ec",
  avgBuyLine: "#2563eb",
  volumeBar: "rgba(160,160,160,0.55)",
} as const;

/** 가격·거래량 영역 분할 (오버레이 스케일 `""` = 하단 거래량 패널) */
export const VOLUME_PANE_SCALE = {
  main: { top: 0.05, bottom: 0.28 },
  volume: { top: 0.72, bottom: 0 },
  mainOnly: { top: 0.05, bottom: 0.05 },
} as const;

export const RANGES: { key: ChartRange; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주" },
  { key: "3m", label: "3개월" },
  { key: "1y", label: "1년" },
  { key: "all", label: "전체" },
];

export const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "line", label: "라인" },
  { key: "candle", label: "캔들" },
];
