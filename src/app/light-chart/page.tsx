"use client";

import { useCallback, useState } from "react";
import ChartDemoClient from "./ChartDemoClient";
import type { TickerInfo } from "@/components/chart/light-chart/lightChartTypes";
import { AppNav } from "@/components/layout/AppNav";

function fmt(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function LightChartSamplePage() {
  const [ticker, setTicker] = useState<TickerInfo | null>(null);

  const handleTick = useCallback((info: TickerInfo) => {
    setTicker(info);
  }, []);

  const isUp = ticker ? ticker.changeAmount >= 0 : true;
  const colorClass = isUp ? "text-red-500" : "text-blue-500";

  return (
    <main className="">
      <AppNav />
      <section className={`mb-3 font-tahoma text-lg font-bold ${colorClass}`}>
        <div className="mb-0 leading-5">
          {ticker ? fmt(ticker.price) : "—"} KRW
        </div>
        <div className="flex items-center gap-2 text-[10px] leading-3">
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
      <section className="">
        <ChartDemoClient onTick={handleTick} />
      </section>

      <footer className="mb-10 mt-5 text-xs text-zinc-500 dark:text-zinc-500">
        고정 뷰(스크롤·확대 비활성) · UTC 1일 분봉(00:00~현재) · 1주 15분봉 ·
        3개월/1년/전체 일봉 mock · 거래량·최고·최저 옵션 · 매수평균 상수선
      </footer>
    </main>
  );
}
