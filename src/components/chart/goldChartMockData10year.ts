import type { CandlestickData } from "lightweight-charts";

/** YYYY-MM-DD (UTC, 날짜만 사용) */
function ymd(year: number, month0: number, day: number): string {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * 시연용 금(USD/oz 기준) 일봉 목 데이터 — 약 10년치(영업일만, 주말 제외).
 * 2016-01 ~ 2026-03, 우상향 트렌드 + 다이나믹 캔들 패턴.
 * 결정적(pseudo-random) 변동으로 새로고침 시에도 동일한 곡선.
 */
function buildMockCandles(): CandlestickData[] {
  const rows: CandlestickData[] = [];
  let y = 2000;
  let m0 = 0; // January
  let d = 4;
  const endY = 2026;
  const endM0 = 2; // March
  const endD = 31;

  let price = 1080.0;

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

  // 시장 국면 (40~80 거래일마다 전환)
  // 0=완만상승(grind up), 1=급등(breakout), 2=조정(correction), 3=횡보(consolidation)
  const PHASE_DURATION = [50, 45, 35, 55]; // 각 국면 평균 지속 거래일
  let phase = 0;
  let phaseRemain = PHASE_DURATION[0];
  let phaseSeq = 0; // 국면 순서 시드용

  const nextPhase = () => {
    phaseSeq++;
    const sr = ((phaseSeq * 1103515245 + 54321) >>> 0) / 0x100000000;
    // 국면 전환 확률: grind(35%) → breakout(30%) → correction(15%) → consolidation(20%)
    if (sr < 0.35) phase = 0;
    else if (sr < 0.65) phase = 1;
    else if (sr < 0.8) phase = 2;
    else phase = 3;

    const durR = ((phaseSeq * 1664525 + 1013904223) >>> 0) / 0x100000000;
    phaseRemain = Math.round(PHASE_DURATION[phase] * (0.7 + durR * 0.6));
  };

  while (!done()) {
    if (!isWeekend(y, m0, d)) {
      const i = rows.length;

      // 국면 전환
      if (phaseRemain <= 0) nextPhase();
      phaseRemain--;

      // 결정적 랜덤값 (LCG 5종)
      const s1 = (i * 1103515245 + 12345) >>> 0;
      const s2 = (i * 1664525 + 1013904223) >>> 0;
      const s3 = (i * 134775813 + 1) >>> 0;
      const s4 = (i * 22695477 + 1013904223) >>> 0;
      const s5 = (i * 2891336453 + 12345) >>> 0;

      const r1 = s1 / 0x100000000; // 방향
      const r2 = s2 / 0x100000000; // 윗꼬리
      const r3 = s3 / 0x100000000; // 아랫꼬리
      const r4 = s4 / 0x100000000; // 캔들 패턴
      const r5 = s5 / 0x100000000; // 추가 노이즈

      // 진행도 0→1 (약 2520 거래일)
      const progress = Math.min(i / 2520, 1);

      // 국면별 드리프트 · 변동성
      let driftPct: number; // 일일 기대수익률
      let volPct: number; // 일일 변동성

      switch (phase) {
        case 0: // 완만상승
          driftPct = 0.0004 + progress * 0.0002;
          volPct = 0.007 + r5 * 0.004;
          break;
        case 1: // 급등 (breakout)
          driftPct = 0.0014 + progress * 0.0006;
          volPct = 0.015 + r5 * 0.008;
          break;
        case 2: // 조정 (correction)
          driftPct = -(0.001 - progress * 0.0003); // 후반부 조정폭 완화
          volPct = 0.013 + r5 * 0.007;
          break;
        case 3: // 횡보 (consolidation)
          driftPct = (r5 - 0.5) * 0.0002;
          volPct = 0.005 + r5 * 0.003;
          break;
        default:
          driftPct = 0.0003;
          volPct = 0.008;
      }

      // 주기적 파동 (중기·장기 사이클)
      const cycleMid = Math.sin(i / 80) * price * 0.0008;
      const cycleLong = Math.sin(i / 300) * price * 0.0015;

      const vol = price * volPct;
      const drift = price * driftPct + cycleMid + cycleLong;

      // 수렴력 — 가격이 트렌드선에서 너무 멀어지면 당김
      const trendPrice = 1080 * Math.pow(1 + 0.000425, i);
      const deviation = (price - trendPrice) / trendPrice;
      const meanReversion = -deviation * price * 0.008;

      const delta =
        (r1 - 0.5) * 2 * vol + drift + meanReversion + (r5 - 0.5) * vol * 0.4;

      const open = Math.round(price * 100) / 100;
      const rawClose = open + delta;
      const close = Math.round(Math.max(price * 0.3, rawClose) * 100) / 100;

      const bodyTop = Math.max(open, close);
      const bodyBot = Math.min(open, close);
      const bodySize = Math.abs(close - open) || vol * 0.25;

      // 다이나믹 캔들 패턴 결정
      let upperWickMult: number;
      let lowerWickMult: number;

      if (r4 < 0.06) {
        // 도지 (Doji) — 오픈≈클로즈, 긴 양쪽 꼬리
        upperWickMult = 2.5 + r2 * 3.0;
        lowerWickMult = 2.5 + r3 * 3.0;
      } else if (r4 < 0.13) {
        // 망치형 (Hammer) — 긴 아래꼬리
        upperWickMult = 0.1 + r2 * 0.4;
        lowerWickMult = 3.0 + r3 * 4.0;
      } else if (r4 < 0.2) {
        // 유성형 (Shooting Star) — 긴 윗꼬리
        upperWickMult = 3.0 + r2 * 4.0;
        lowerWickMult = 0.1 + r3 * 0.4;
      } else if (r4 < 0.35) {
        // 큰 몸통 캔들 — 강한 추세일
        upperWickMult = 0.1 + r2 * 0.5;
        lowerWickMult = 0.1 + r3 * 0.5;
      } else if (r4 < 0.55) {
        // 일반 캔들
        upperWickMult = 0.5 + r2 * 1.5;
        lowerWickMult = 0.5 + r3 * 1.5;
      } else {
        // 긴 꼬리 캔들 (변동성 높은 날)
        upperWickMult = 1.0 + r2 * 2.5;
        lowerWickMult = 1.0 + r3 * 2.5;
      }

      // 국면이 급등·조정이면 꼬리 더 길게
      const phaseVolBoost = phase === 1 || phase === 2 ? 1.5 : 1.0;
      const wickBase = vol * 0.35 * phaseVolBoost;

      const high =
        Math.round(
          (bodyTop + bodySize * upperWickMult * 0.4 + wickBase) * 100,
        ) / 100;
      const low =
        Math.round(
          Math.max(
            price * 0.2,
            bodyBot - bodySize * lowerWickMult * 0.4 - wickBase,
          ) * 100,
        ) / 100;

      rows.push({ time: ymd(y, m0, d), open, high, low, close });
      price = close;
    }
    advance();
  }

  return rows;
}

export const goldChartMockCandles: CandlestickData[] = buildMockCandles();
