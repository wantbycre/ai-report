"use client";

import type { Report } from "@/types/report";
import { FocusEvent, useState } from "react";

type ReportCardProps = { report: Report };

export function ReportCard({ report }: ReportCardProps) {
  const [title, setTitle] = useState(report.title);

  const handleBlur = () => {
    console.log(title);
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input
        type="text"
        className="border w-full rounded p-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {report.createdAt}
      </p>
    </div>
  );
}
