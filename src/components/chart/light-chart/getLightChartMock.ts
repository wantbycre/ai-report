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

export function getLightChartMock(range: ChartRange): LightChartMockResult {
  const bars = buildBars(range);
  const periodStats = buildPeriodStats(bars);
  const ticker = tickerFromBars(bars) ?? {
    price: 0,
    changeAmount: 0,
    changePercent: 0,
  };
  return { bars, periodStats, ticker };
}
