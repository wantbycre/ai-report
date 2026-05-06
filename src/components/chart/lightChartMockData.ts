import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

/** 일/주/분기 탭용 — 각 1440개 1분봉 (동일 UTC 일 기준 타임스탬프) */
export type Minute24hPreset = "day" | "week" | "quarter";

const DAY0_UTC_SEC = Math.floor(Date.UTC(2026, 0, 2, 0, 0, 0) / 1000);

/** 호출마다 `Math.random()` 기반 완전 랜덤 분봉 OHLC */
export function buildMinute24hCandles(
  preset: Minute24hPreset,
): CandlestickData<UTCTimestamp>[] {
  const start =
    95_000 +
    Math.random() * 25_000 +
    (preset === "day" ? 0 : preset === "week" ? 333 : 777);
  let price = Math.round(start * 100) / 100;
  const out: CandlestickData<UTCTimestamp>[] = [];

  for (let i = 0; i < 1440; i += 50) {
    const t = (DAY0_UTC_SEC + i * 60) as UTCTimestamp;
    const vol = 20 + Math.random() * 120;
    const o = Math.round(price * 100) / 100;
    const drift = (Math.random() - 0.48) * vol;
    const rawClose = o + drift;
    const close =
      Math.round(
        Math.max(o - vol * 1.5, Math.min(o + vol * 1.5, rawClose)) * 100,
      ) / 100;
    const bodyTop = Math.max(o, close);
    const bodyBot = Math.min(o, close);
    const high = Math.round((bodyTop + Math.random() * vol * 0.35) * 100) / 100;
    const low = Math.round((bodyBot - Math.random() * vol * 0.35) * 100) / 100;
    out.push({ time: t, open: o, high, low, close });
    price = close;
  }
  return out;
}

/** 호출마다 `Math.random()` 기반 12개 월봉 */
export function buildYearlyMonthlyCandles(): CandlestickData[] {
  const year = 2026;
  let price = 95_000 + Math.random() * 20_000;
  const rows: CandlestickData[] = [];

  for (let m = 0; m < 12; m++) {
    const time = `${year}-${String(m + 1).padStart(2, "0")}-01`;
    const vol = 300 + Math.random() * 1200;
    const o = Math.round(price * 100) / 100;
    const drift = (Math.random() - 0.45) * vol * 1.2;
    const rawClose = o + drift;
    const close = Math.round(rawClose * 100) / 100;
    const bodyTop = Math.max(o, close);
    const bodyBot = Math.min(o, close);
    const high = Math.round((bodyTop + Math.random() * vol * 0.3) * 100) / 100;
    const low = Math.round((bodyBot - Math.random() * vol * 0.3) * 100) / 100;
    rows.push({ time, open: o, high, low, close });
    price = close;
  }
  return rows;
}

export type LightChartMockKey = Minute24hPreset | "year";

export function buildLightChartMockData(
  key: LightChartMockKey,
): CandlestickData[] {
  if (key === "year") return buildYearlyMonthlyCandles();
  return buildMinute24hCandles(key);
}
