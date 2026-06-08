import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "트레이딩뷰 파일럿",
  description: "한국 금거래소 시뮬레이션 — Lightweight Charts 시연",
};

export default function TradingViewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
