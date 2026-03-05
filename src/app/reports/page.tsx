import { reports } from "@/lib/mock-reports";
import { ReportCard } from "./_components/ReportCard";

export default async function ReportsPage() {
  // const data = await fetch()

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ul className="space-y-4">
        {reports.map((report) => (
          <li key={report.id}>
            <ReportCard report={report} />
          </li>
        ))}
      </ul>
    </main>
  );
}
