import type { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";

export type ChartRange = "1d" | "1w" | "3m" | "1y" | "all";
export type ChartType = "line" | "candle";

export interface TickerInfo {
  price: number;
  changeAmount: number;
  changePercent: number;
}

export interface OhlcvBar {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OhlcvCandle = CandlestickData<Time>;

export interface PeriodHighLow {
  high: string;
  low: string;
  highDate: string;
  lowDate: string;
}

export interface LightChartMockResult {
  bars: OhlcvBar[];
  periodStats: PeriodHighLow;
  ticker: TickerInfo;
}

export function toCandlestick(bar: OhlcvBar): OhlcvCandle {
  return {
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  };
}

export function tickerFromBars(bars: OhlcvBar[]): TickerInfo | null {
  if (bars.length === 0) return null;
  const first = bars[0];
  const last = bars[bars.length - 1];
  const dayOpen = first.open;
  const close = last.close;
  const changeAmount = close - dayOpen;
  return {
    price: close,
    changeAmount,
    changePercent: dayOpen !== 0 ? (changeAmount / dayOpen) * 100 : 0,
  };
}
