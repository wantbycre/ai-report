"use client";

import { useState } from "react";
import type { Report } from "@/types/report";
import { addReport } from "@/app/actions/report";
import AddReportForm from "@/components/report/AddReportForm";
import { ReportCard } from "./ReportCard";

type ReportsViewProps = { initialReports: Report[] };

/**
 * POST는 "use server" Server Action(addReport)으로만 처리.
 * 반환된 목록으로 리스트만 갱신 (로딩 UI 없이).
 */
export function ReportsView({ initialReports }: ReportsViewProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);

  function handleSuccess(nextReports: Report[]) {
    setReports(nextReports);
  }

  return (
    <>
      <AddReportForm action={addReport} onSuccess={handleSuccess} />
      <ul className="space-y-4">
        {reports.map((report) => (
          <li key={report.id} className="rounded border p-3">
            <ReportCard report={report} />
          </li>
        ))}
      </ul>
    </>
  );
}
