import type { OhlcvBar } from "./lightChartTypes";
import {
  MOCK_BASE_START,
  isWeekendUtc,
  nextOhlcvBar,
  ymdUtc,
} from "./mockCore";

interface BuildDailyOptions {
  tradingDays: number;
  salt: number;
}

/** 영업일 일봉 — 10구간 국면 */
export function buildMockDaily({
  tradingDays,
  salt,
}: BuildDailyOptions): OhlcvBar[] {
  const now = new Date();
  let y = now.getUTCFullYear();
  let m0 = now.getUTCMonth();
  let d = now.getUTCDate();

  const times: string[] = [];

  while (times.length < tradingDays) {
    if (!isWeekendUtc(y, m0, d)) {
      times.unshift(ymdUtc(y, m0, d));
    }
    d -= 1;
    if (d < 1) {
      m0 -= 1;
      if (m0 < 0) {
        m0 = 11;
        y -= 1;
      }
      d = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
    }
  }

  const barCount = times.length;
  const bars: OhlcvBar[] = [];
  let price = MOCK_BASE_START;

  for (let i = 0; i < times.length; i++) {
    const { bar, nextPrice } = nextOhlcvBar({
      index: i,
      barCount,
      salt,
      price,
      time: times[i],
      volScale: 1.1,
    });
    bars.push(bar);
    price = nextPrice;
  }

  return bars;
}
