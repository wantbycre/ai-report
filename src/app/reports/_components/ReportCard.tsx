import type { Report } from "@/types/report";

type ReportCardProps = { report: Report };

export function ReportCard({ report }: ReportCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="font-semibold">{report.title}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {report.createdAt}
      </p>
    </div>
  );
}
