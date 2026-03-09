import { NextResponse } from "next/server";
import { addReportMutation, getReports } from "@/lib/reports";

/** GET: Supabase posts 조회 (SSR과 동일한 소스) */
export async function GET() {
  const list = await getReports();
  return NextResponse.json(list);
}

/** POST: Server Action과 동일한 addReportMutation 사용 */
export async function POST(req: Request) {
  const body = await req.json();
  const title = (body.title as string) ?? "";
  const list = await addReportMutation(title);
  return NextResponse.json(list);
}
