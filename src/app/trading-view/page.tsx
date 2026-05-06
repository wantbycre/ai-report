"use client";

import { useCallback, useState } from "react";
import ChartDemoClient from "./ChartDemoClient";
import type { TickerInfo } from "@/components/chart/GoldChart";
import { AppNav } from "@/components/layout/AppNav";

function fmt(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TradingViewPilotPage() {
  const [ticker, setTicker] = useState<TickerInfo | null>(null);

  const handleTick = useCallback((info: TickerInfo) => {
    setTicker(info);
  }, []);

  const isUp = ticker ? ticker.changeAmount >= 0 : true;
  const colorClass = isUp ? "text-red-500" : "text-blue-500";

  return (
    <main className="">
      <AppNav title="lightweight-charts" />
      <section className={`text-lg font-bold font-tahoma mb-3 ${colorClass}`}>
        {/* 상단 현재가 표시 */}
        <div className="mb-0 leading-5">
          {ticker ? fmt(ticker.price) : "—"} KRW
        </div>

        {/* 하단 변동률 표시 (상/하향 화살표 + 변동률) */}
        <div className="text-[10px] flex items-center gap-2 leading-3">
          <span>
            {ticker
              ? `${isUp ? "+" : ""}${ticker.changePercent.toFixed(2)}%`
              : "—"}
          </span>
          <span>
            {ticker
              ? `${isUp ? "▲" : "▼"} ${fmt(Math.abs(ticker.changeAmount))}`
              : "—"}
          </span>
        </div>
      </section>
      <section className="rounded-xl bg-background shadow-sm">
        <ChartDemoClient onTick={handleTick} />
      </section>

      <footer className="text-xs text-zinc-500 dark:text-zinc-500 mt-5 mb-10">
        © 2026 한국 금거래소 시뮬레이션 — TradingView Lightweight Charts
        <br />
        <br />
        <div className="text-xs">
          # mock 20년치의 랜덤 데이터 사용,
          <br />- 실시간 표현을 위해 setInterval 사용 <br />
          - lightweight-charts 의<br />
          기본옵션만 사용 유료시 더 다양한 옵션 사용 가능 (이평선, 이동평균계열,
          오실레이터, UI, 볼륨, 변동성, 드로잉툴, ) <br />
          <br />
          # 현재 구현 목록 - 2000 ~ 2026 년 랜덤 데이터 사용 <br />
          - 1분, 1시간, 일, 주, 월, 연 캔들 표시 가능 <br />
          - 캔들 표시 시간대 변경 가능 <br />
          - 캔들 표시 시간대 변경 시 캔들 데이터 갱신
          <br />- 캔들 표시 시간대 변경 시 캔들 데이터 갱신
        </div>
      </footer>
    </main>
  );
}
