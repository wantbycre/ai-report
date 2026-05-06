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

export default function HighChartSamplePage() {
  const [ticker, setTicker] = useState<TickerInfo | null>(null);

  const handleTick = useCallback((info: TickerInfo) => {
    setTicker(info);
  }, []);

  const isUp = ticker ? ticker.changeAmount >= 0 : true;
  const colorClass = isUp ? "text-red-500" : "text-blue-500";

  return (
    <main className="">
      <AppNav title="high-chart 샘플" />
      <section className={`mb-3 font-tahoma text-lg font-bold ${colorClass}`}>
        <div className="mb-0 leading-5">{ticker ? fmt(ticker.price) : "—"} KRW</div>
        <div className="flex items-center gap-2 text-[10px] leading-3">
          <span>
            {ticker ? `${isUp ? "+" : ""}${ticker.changePercent.toFixed(2)}%` : "—"}
          </span>
          <span>
            {ticker ? `${isUp ? "▲" : "▼"} ${fmt(Math.abs(ticker.changeAmount))}` : "—"}
          </span>
        </div>
      </section>

      <section className="rounded-xl bg-background shadow-sm">
        <ChartDemoClient onTick={handleTick} />
      </section>

      <footer className="mb-10 mt-5 text-xs text-zinc-500 dark:text-zinc-500">
        Highcharts 샘플 · 일/주/분기 랜덤 분봉 · 년 랜덤 월봉 mock
      </footer>
    </main>
  );
}
