import type { TickerInfo } from "@/components/chart/GoldChart";

export type HighChartMinutePreset = "day" | "week" | "quarter";
export type HighChartMockKey = HighChartMinutePreset | "year";

export interface HighChartPoint {
  x: number;
  y: number;
}

const DAY0_UTC_MS = Date.UTC(2026, 0, 2, 0, 0, 0);

export function buildHighChartMinutePoints(
  preset: HighChartMinutePreset,
): HighChartPoint[] {
  const start =
    95_000 +
    Math.random() * 25_000 +
    (preset === "day" ? 0 : preset === "week" ? 333 : 777);
  let price = Math.round(start * 100) / 100;
  const out: HighChartPoint[] = [];

  for (let i = 0; i < 1440; i += 50) {
    const x = DAY0_UTC_MS + i * 60 * 1000;
    const vol = 20 + Math.random() * 120;
    const drift = (Math.random() - 0.48) * vol;
    const next = Math.max(price - vol * 1.5, Math.min(price + vol * 1.5, price + drift));
    price = Math.round(next * 100) / 100;
    out.push({ x, y: price });
  }
  return out;
}

export function buildHighChartYearlyPoints(): HighChartPoint[] {
  let price = 95_000 + Math.random() * 20_000;
  const out: HighChartPoint[] = [];
  const year = 2026;

  for (let m = 0; m < 12; m++) {
    const x = Date.UTC(year, m, 1, 0, 0, 0);
    const vol = 300 + Math.random() * 1200;
    const drift = (Math.random() - 0.45) * vol * 1.2;
    price = Math.round((price + drift) * 100) / 100;
    out.push({ x, y: price });
  }
  return out;
}

export function buildHighChartMockData(key: HighChartMockKey): HighChartPoint[] {
  if (key === "year") return buildHighChartYearlyPoints();
  return buildHighChartMinutePoints(key);
}

export function toTickerFromHighChartPoints(data: HighChartPoint[]): TickerInfo | null {
  if (data.length === 0) return null;
  const first = data[0].y;
  const last = data[data.length - 1].y;
  const changeAmount = last - first;
  return {
    price: last,
    changeAmount,
    changePercent: first !== 0 ? (changeAmount / first) * 100 : 0,
  };
}
