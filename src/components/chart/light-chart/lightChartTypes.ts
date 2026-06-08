import type { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";

export type ChartRange = "1d" | "1w" | "3m" | "1y" | "all";
export type ChartType = "line" | "candle";

export interface TickerInfo {
  price: number;
  changeAmount: number;
  changePercent: number;
}

/** mock 봉 1개. volume 필드는 [옵션 3] 거래량 막대 데이터 소스 */
export interface OhlcvBar {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  /** [옵션 3] HistogramSeries에 매핑되는 거래량 값 */
  volume: number;
}

export type OhlcvCandle = CandlestickData<Time>;

/**
 * [옵션 1] 최고·최저 금액 오버레이 표시용
 * - high / low: 포맷된 가격 문자열
 * - highDate / lowDate: 해당 봉 날짜(YY/MM/DD)
 * - highTime/highPrice, lowTime/lowPrice: 차트 좌표 변환용 앵커
 */
export interface PeriodHighLow {
  high: string;
  low: string;
  highDate: string;
  lowDate: string;
  highTime: Time;
  highPrice: number;
  lowTime: Time;
  lowPrice: number;
}

/** [옵션 1] 최고·최저 라벨 픽셀 좌표 (차트 pane 기준) */
export interface HighLowLabelPosition {
  left: number;
  top: number;
  /** 양끝에서 pane 밖으로 나가지 않도록 조절한 translateX */
  translateX: "-50%" | "0%" | "-100%";
}

export interface LightChartMockResult {
  bars: OhlcvBar[];
  /** [옵션 1] 기간 내 최고가·최저가 집계 결과 */
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
