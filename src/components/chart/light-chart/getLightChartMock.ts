import { buildPeriodStats } from "./mockCore";
import type { ChartRange, LightChartMockResult } from "./lightChartTypes";
import { tickerFromBars } from "./lightChartTypes";
import { buildMock1d } from "./mock1d";
import { buildMock1w } from "./mock1w";
import { buildMock3m } from "./mock3m";
import { buildMock1y } from "./mock1y";
import { buildMockAll } from "./mockAll";

function buildBars(range: ChartRange) {
  switch (range) {
    case "1d":
      return buildMock1d();
    case "1w":
      return buildMock1w();
    case "3m":
      return buildMock3m();
    case "1y":
      return buildMock1y();
    case "all":
      return buildMockAll();
  }
}

/**
 * mock 로드 시 [옵션 1] periodStats·[옵션 3] bars[].volume 포함 반환
 * TODO: [API] 실데이터 전환 시 range별 OHLCV·현재가 API 응답으로 교체
 */
export function getLightChartMock(range: ChartRange): LightChartMockResult {
  const bars = buildBars(range);
  /** [옵션 1] 최고·최저 금액/날짜 */
  const periodStats = buildPeriodStats(bars);
  // 헤더의 현재가/등락은 선택 기간과 무관하게 '당일(1d)' 기준으로 통일한다.
  const tickerBars = range === "1d" ? bars : buildMock1d();
  const ticker = tickerFromBars(tickerBars) ?? {
    price: 0,
    changeAmount: 0,
    changePercent: 0,
  };
  return { bars, periodStats, ticker };
}
