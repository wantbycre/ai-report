import type { AutoscaleInfoProvider } from "lightweight-charts";
import type { ChartRange, ChartType } from "./lightChartTypes";

// =============================================================================
// 차트 UI 옵션 상수
// - [옵션 2] 평균매수 라인
// - [옵션 3] 하단 거래량 막대그래프
// (옵션 1·4 상수는 lightChartTypes.ts / LightChartPanel.tsx 참고)
// =============================================================================

/** [옵션 2] 평균매수 가격선에 표시할 샘플 단가(KRW). 추후 API 매수평균으로 교체 */
export const SAMPLE_AVG_BUY_PRICE = 228_089;

/** [옵션 2] 자동 스케일 범위에 매수평균가를 항상 포함해 가격선이 화면 밖으로 밀리지 않게 함 */
export function makeAvgBuyAutoscaleProvider(
  avgPrice: number,
): AutoscaleInfoProvider {
  return (original) => {
    const base = original();
    if (base === null || base.priceRange === null) {
      return {
        priceRange: { minValue: avgPrice, maxValue: avgPrice },
      };
    }
    const { minValue, maxValue } = base.priceRange;
    return {
      ...base,
      priceRange: {
        minValue: Math.min(minValue, avgPrice),
        maxValue: Math.max(maxValue, avgPrice),
      },
    };
  };
}

export const CHART_HEIGHT = 400;

export const CHART_COLORS = {
  line: "#dd3c44",
  candleUp: "#dd3c44",
  candleDown: "#1375ec",
  /** [옵션 2] 평균매수 price line — 양봉(빨강)·음봉(파랑)과 구분되는 바이올렛 */
  avgBuyLine: "#7b61c9",
  /** [옵션 3] 하단 거래량 Histogram 막대 색상(회색 통일) */
  volumeBar: "rgba(226, 226, 226, 0.55)",
} as const;

/**
 * [옵션 3] 하단 거래량 패널 레이아웃
 * - main: 가격(라인/캔들)이 차지하는 세로 비율
 * - volume: 오버레이 스케일(`""`)에 그리는 거래량 막대 영역
 * - mainOnly: 거래량 OFF일 때 가격이 전체 높이를 쓰도록 하는 margin
 */
export const VOLUME_PANE_SCALE = {
  main: { top: 0.05, bottom: 0.2 }, // 가격: 상단 5% ~ 80% (높이의 5%~80% 차지)
  volume: { top: 0.8, bottom: 0 }, // 거래량: 하단 20% (80%~100%) — 가격 영역과 경계 일치
  mainOnly: { top: 0.05, bottom: 0.05 }, // 거래량 OFF 시 가격이 전체 높이 사용
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
