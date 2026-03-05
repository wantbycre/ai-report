import { NextResponse } from "next/server";
import { reports } from "@/lib/mock-reports";

// PUT
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const body = await req.json();
  const { id } = await context.params;
  const report = reports.find((r) => r.id === Number(id));

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  report.title = body.title;

  return NextResponse.json(report);
}

// DELETE
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const index = reports.findIndex((r) => r.id === Number(id));

  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = reports.splice(index, 1);

  return NextResponse.json(deleted[0]);
}
