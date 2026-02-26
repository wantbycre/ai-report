import { NextResponse } from "next/server";
import { reports } from "@/lib/mock-reports";

export async function GET() {
  await new Promise((res) => setTimeout(res, 1500));
  return NextResponse.json(reports);
}
