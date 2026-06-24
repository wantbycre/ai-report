"use client";

import ChartDemoClient from "./ChartDemoClient";
import { AppNav } from "@/components/layout/AppNav";

export default function LightChartSamplePage() {
  return (
    <main className="">
      <AppNav />
      <section className="">
        <ChartDemoClient />
      </section>

      {/* <footer className="mb-10 mt-5 text-xs text-zinc-500 dark:text-zinc-500">
        · 고정 뷰(스크롤·확대 비활성) <br />
        · KST 1일 분봉(00:00~현재) <br />
        · 1주 15분봉 <br />
        · 3개월/1년/전체 일봉 mock <br />
        · 거래량·최고·최저 옵션 <br />
        · 매수평균 상수선 <br />
      </footer> */}
    </main>
  );
}
