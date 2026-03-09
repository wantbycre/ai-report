"use server";

import type { Report } from "@/types/report";
import { addReportMutation } from "@/lib/reports";

/**
 * FormData로 보고서 추가. 공통 로직(addReportMutation) 사용.
 */
export async function addReport(
  formData: FormData,
): Promise<{ reports: Report[] }> {
  const title = (formData.get("title") as string) ?? "";
  return { reports: await addReportMutation(title) };
}
