"use client";

import dynamic from "next/dynamic";

const GoldChart = dynamic(() => import("@/components/chart/ColdCart"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "500px",
        background: "#f8f8f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      차트 로딩 중...
    </div>
  ),
});

export default function ChartDemoClient() {
  return <GoldChart />;
}
