import type { OhlcvBar } from "./lightChartTypes";
import { MOCK_BASE_START, nextOhlcvBar, utcTimestampFromMs } from "./mockCore";

const SALT = 10_001;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** KST 당일 00:00 ~ min(now, 23:59:59) 1분봉 — 10구간 국면 */
export function buildMock1d(): OhlcvBar[] {
  const nowMs = Date.now();
  // now를 KST로 환산해 KST 달력상 '오늘'의 자정(UTC epoch)을 구한다.
  const kst = new Date(nowMs + KST_OFFSET_MS);
  const dayStart =
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) -
    KST_OFFSET_MS;
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
  const endMs = Math.min(nowMs, dayEnd);

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
