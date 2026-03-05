import { NextResponse } from "next/server";
import { reports } from "@/lib/mock-reports";

// Mock 데이터 출력 (setTimeout 적용이유는 실제서버처럼 suspense 적용)
export async function GET() {
  await new Promise((res) => setTimeout(res, 1500));
  return NextResponse.json(reports);
}

// POST
export async function POST(req: Request) {
  const body = await req.json();

  const newReport = {
    id: Date.now(),
    title: body.title,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  reports.push(newReport);

  return NextResponse.json(newReport);
}
