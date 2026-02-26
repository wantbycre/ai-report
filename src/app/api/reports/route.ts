import { NextResponse } from "next/server";

const reports = [
  {
    id: 1,
    title: "AI Markget Analysis",
    createdAt: "2026-02-24",
  },
  {
    id: 2,
    title: "Startup Risk Report",
    createdAt: "2026-02-23",
  },
  {
    id: 3,
    title: "Crypto Trend Summary",
    createdAt: "2026-02-22",
  },
];

export async function GET() {
  // 일부러 지연 추후 Streaming 확인을 위해
  await new Promise((res) => setTimeout(res, 1500));

  return NextResponse.json(reports);
}
