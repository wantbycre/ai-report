import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "High Chart 샘플",
  description: "한국 금거래소 시뮬레이션 — Highcharts 시연",
};

export default function HighChartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
