import type { CandlestickData } from "lightweight-charts";

/** YYYY-MM-DD (UTC, 날짜만 사용) */
function ymd(year: number, month0: number, day: number): string {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * 시연용 금(원/g 등 가정) 일봉 목 데이터 — 약 3개월(영업일만, 주말 제외).
 * 결정적(pseudo-random) 변동으로 새로고침 시에도 동일한 곡선.
 */
function buildMockCandles(): CandlestickData[] {
  const rows: CandlestickData[] = [];
  let y = 2022;
  let m0 = 11; // December
  let d = 23;
  const endY = 2026;
  const endM0 = 2; // March
  const endD = 21;

  let price = 2088.4;

  const isWeekend = (year: number, month0: number, day: number) => {
    const dt = new Date(Date.UTC(year, month0, day));
    const w = dt.getUTCDay();
    return w === 0 || w === 6;
  };

  const advance = () => {
    d += 1;
    const dim = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
    if (d > dim) {
      d = 1;
      m0 += 1;
      if (m0 > 11) {
        m0 = 0;
        y += 1;
      }
    }
  };

  const done = () =>
    y > endY || (y === endY && (m0 > endM0 || (m0 === endM0 && d > endD)));

  while (!done()) {
    if (!isWeekend(y, m0, d)) {
      const i = rows.length;
      const r1 = ((i * 1103515245 + 12345) >>> 0) / 0xffffffff;
      const r2 = ((i * 1664525 + 1013904223) >>> 0) / 0xffffffff;
      const r3 = ((i * 134775813 + 1) >>> 0) / 0xffffffff;

      const open = Math.round(price * 100) / 100;
      const delta = (r1 - 0.48) * 28 + Math.sin(i / 9) * 6;
      const close = Math.round((open + delta) * 100) / 100;
      const bodyTop = Math.max(open, close);
      const bodyBot = Math.min(open, close);
      const high = Math.round((bodyTop + r2 * 14 + 4) * 100) / 100;
      const low = Math.round((bodyBot - r3 * 14 - 4) * 100) / 100;

      rows.push({
        time: ymd(y, m0, d),
        open,
        high,
        low,
        close,
      });
      price = close;
    }
    advance();
  }

  return rows;
}

export const goldChartMockCandles: CandlestickData[] = buildMockCandles();
