import { getReports } from "@/lib/reports";
import { ReportsView } from "./_components/ReportsView";

/**
 * SSR: GET 시 mock + setTimeout으로 서버 지연 표현 → loading.tsx 노출.
 * POST는 Server Action으로 처리하고, 반환된 목록으로 클라이언트 리스트만 갱신(로딩 없음).
 */
export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportsView initialReports={reports} />
    </main>
  );
}
