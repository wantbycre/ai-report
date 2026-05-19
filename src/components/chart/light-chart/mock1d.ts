import type { OhlcvBar } from "./lightChartTypes";
import { MOCK_BASE_START, nextOhlcvBar, utcTimestampFromMs } from "./mockCore";

const SALT = 10_001;

/** UTC 당일 00:00 ~ min(now, 23:59:59) 1분봉 — 10구간 국면 */
export function buildMock1d(): OhlcvBar[] {
  const now = new Date();
  const dayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
  const endMs = Math.min(now.getTime(), dayEnd);

  const barCount = Math.floor((endMs - dayStart) / 60_000) + 1;
  const bars: OhlcvBar[] = [];
  let price = MOCK_BASE_START;
  let i = 0;

  for (let t = dayStart; t <= endMs; t += 60_000) {
    const { bar, nextPrice } = nextOhlcvBar({
      index: i,
      barCount,
      salt: SALT,
      price,
      time: utcTimestampFromMs(t),
      volScale: 0.75,
    });
    bars.push(bar);
    price = nextPrice;
    i += 1;
  }

  return bars;
}
