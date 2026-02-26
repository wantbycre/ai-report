import { getReports } from "../../lib/reports";

type Report = {
  id: number;
  title: string;
  createdAt: string;
};

export default async function ReportsPage() {
  const reports = await getReports();

  console.log("SERVER FETCHED");

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

      {reports.map((report) => (
        <div key={report.id} className="border p-4 rounded-lg">
          <p className="font-semibold">{report.title}</p>
          <p className="text-sm text-gray-500">{report.createdAt}</p>
        </div>
      ))}
    </div>
  );
}
