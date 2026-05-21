import type { UTCTimestamp } from "lightweight-charts";
import type { OhlcvBar, PeriodHighLow } from "./lightChartTypes";
import { seededUnit, seededUnit2 } from "./prng";

/** 샘플 시작가 (KRW) — 10구간 국면 곡선의 출발점 */
export const MOCK_BASE_START = 228_000;

/**
 * 전체 봉을 10등분한 구간별 국면 (1-based 구간 번호 기준)
 * 1~2 강상승 | 3 약상승(2~4) | 4~6 강하락(4~7) | 7~8 보합 | 9~10 약상승
 * (4·7구간은 겹치는 지시가 있어 하락·보합 우선 적용)
 */
type MarketPhase = "strongUp" | "mildUp" | "strongDown" | "flat";

const TEN_SEGMENT_PHASES: MarketPhase[] = [
  "strongUp", // 1  (1~2)
  "strongUp", // 2  (1~2, 2~4)
  "mildUp", // 3    (2~4)
  "strongDown", // 4 (2~4 / 4~7 → 하락)
  "strongDown", // 5 (4~7)
  "strongDown", // 6 (4~7)
  "flat", // 7      (4~7 / 7~8 → 보합)
  "flat", // 8      (7~8)
  "mildUp", // 9    (8~10)
  "mildUp", // 10   (8~10)

  "strongDown", // 6 (4~7)
  "flat", // 7      (4~7 / 7~8 → 보합)
  "mildUp", // 3    (2~4)
  "strongDown", // 4 (2~4 / 4~7 → 하락)

  "strongUp", // 4 (2~4 / 4~7 → 하락)
  "strongUp", // 5 (4~7)
  "strongUp", // 6 (4~7)

  "strongUp", // 1  (1~2)
  "strongDown", // 5 (4~7)
  "strongUp", // 2  (1~2, 2~4)
];

export function getSegmentIndex(index: number, barCount: number): number {
  if (barCount <= 1) return 0;
  return Math.min(18, Math.floor((index * 20) / barCount));
}

function phaseDrift(phase: MarketPhase, vol: number, r1: number): number {
  switch (phase) {
    case "strongUp":
      return vol * 1.35 + vol * 0.25 * (0.35 - r1);
    case "mildUp":
      return vol * 0.38 + vol * 0.15 * (0.42 - r1);
    case "strongDown":
      return -vol * 1.35 - vol * 0.25 * (0.35 - r1);
    case "flat":
      return (r1 - 0.5) * vol * 0.12;
  }
}

export function ymdUtc(year: number, month0: number, day: number): string {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function isWeekendUtc(
  year: number,
  month0: number,
  day: number,
): boolean {
  const w = new Date(Date.UTC(year, month0, day)).getUTCDay();
  return w === 0 || w === 6;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface NextBarInput {
  index: number;
  barCount: number;
  salt: number;
  price: number;
  time: OhlcvBar["time"];
  startPrice?: number;
  volScale?: number;
}

/** 10등분 국면(강상승→약상승→강하락→보합→약상승) 결정적 OHLCV */
export function nextOhlcvBar({
  index,
  barCount,
  salt,
  price,
  time,
  startPrice = MOCK_BASE_START,
  volScale = 1,
}: NextBarInput): { bar: OhlcvBar; nextPrice: number } {
  const r1 = seededUnit(index, salt);
  const r2 = seededUnit2(index, salt + 17);
  const r3 = seededUnit(index, salt + 31);
  const r4 = seededUnit2(index, salt + 47);

  const segment = getSegmentIndex(index, barCount);
  const phase = TEN_SEGMENT_PHASES[segment];

  const vol = (6 + r4 * 28) * volScale;
  const open = round2(price);
  const drift = phaseDrift(phase, vol, r1);
  const noise = (r1 - 0.5) * vol * (phase === "flat" ? 0.08 : 0.22);
  const rawClose = open + drift + noise;

  const clamp =
    phase === "flat"
      ? vol * 0.35
      : phase === "mildUp"
        ? vol * 0.95
        : vol * 1.15;

  const close = round2(
    Math.max(open - clamp, Math.min(open + clamp, rawClose)),
  );
  const bodyTop = Math.max(open, close);
  const bodyBot = Math.min(open, close);
  const high = round2(bodyTop + r2 * vol * 0.4);
  const low = round2(Math.max(startPrice * 0.88, bodyBot - r3 * vol * 0.4));
  /** [옵션 3] mock 거래량 — toVolumeData() → HistogramSeries */
  const volume = Math.max(
    1,
    Math.round(
      (phase === "flat" ? 8 : 20) +
        r4 * (phase === "strongUp" || phase === "strongDown" ? 200 : 140),
    ) * volScale,
  );

  return {
    bar: { time, open, high, low, close, volume },
    nextPrice: close,
  };
}

/** [옵션 1] 선택 기간 전체에서 최고가·최저가 봉을 찾아 오버레이 문구용 문자열 생성 */
export function buildPeriodStats(bars: OhlcvBar[]): PeriodHighLow {
  if (bars.length === 0) {
    return {
      high: "—",
      low: "—",
      highDate: "",
      lowDate: "",
      highTime: 0 as OhlcvBar["time"],
      highPrice: 0,
      lowTime: 0 as OhlcvBar["time"],
      lowPrice: 0,
    };
  }
  const hi = bars.reduce((a, b) => (a.high > b.high ? a : b));
  const lo = bars.reduce((a, b) => (a.low < b.low ? a : b));
  return {
    high: Math.round(hi.high).toLocaleString("ko-KR"),
    low: Math.round(lo.low).toLocaleString("ko-KR"),
    highDate: formatBarDate(hi.time),
    lowDate: formatBarDate(lo.time),
    highTime: hi.time,
    highPrice: hi.high,
    lowTime: lo.time,
    lowPrice: lo.low,
  };
}

/** [옵션 1] 최고·최저 오버레이에 붙는 날짜 라벨 포맷(YY/MM/DD) */
export function formatBarDate(time: OhlcvBar["time"]): string {
  if (typeof time === "number") {
    const d = new Date(time * 1000);
    const yy = String(d.getUTCFullYear()).slice(2);
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yy}/${mm}/${dd}`;
  }
  if (typeof time === "string") {
    return time.slice(2).replace(/-/g, "/");
  }
  const mm = String(time.month).padStart(2, "0");
  const dd = String(time.day).padStart(2, "0");
  return `${mm}/${dd}`;
}

export function utcTimestampFromMs(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}
