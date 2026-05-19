import type { OhlcvBar } from "./lightChartTypes";
import { MOCK_BASE_START, nextOhlcvBar, utcTimestampFromMs } from "./mockCore";

const SALT = 20_002;
const INTERVAL_MS = 15 * 60_000;
const BARS = 7 * 96;

/** 최근 7일 15분봉 — 10구간 국면 */
export function buildMock1w(): OhlcvBar[] {
  const now = Date.now();
  const startMs = now - (BARS - 1) * INTERVAL_MS;

  const bars: OhlcvBar[] = [];
  let price = MOCK_BASE_START;

  for (let i = 0; i < BARS; i++) {
    const t = startMs + i * INTERVAL_MS;
    const { bar, nextPrice } = nextOhlcvBar({
      index: i,
      barCount: BARS,
      salt: SALT,
      price,
      time: utcTimestampFromMs(t),
      volScale: 0.9,
    });
    bars.push(bar);
    price = nextPrice;
  }

  return bars;
}
