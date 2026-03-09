import { revalidateTag, unstable_cache } from "next/cache";
import type { Report } from "@/types/report";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MOCK_DELAY_MS = 1500;

/**
 * SSR용 보고서 목록 조회.
 * revalidateTag("reports")로 캐시 무효화 가능.
 */
export async function getReports(): Promise<Report[]> {
  const getCached = unstable_cache(
    async (): Promise<Report[]> => {
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from("reports").select("*");
      if (error) throw error;

      // 최소 예제: posts 테이블의 컬럼을 Report에 맞춰 매핑
      // - id: number
      // - title: string
      // - createdAt: string(YYYY-MM-DD)
      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        title: String(row.title ?? ""),
        createdAt: String(
          row.createdAt ??
            row.created_at ??
            new Date().toISOString().slice(0, 10),
        ).slice(0, 10),
      }));
    },
    ["reports-list"],
    { tags: ["reports"] },
  );
  return getCached();
}

/**
 * 보고서 추가 공통 로직. Server Action / API Route에서 공용.
 */
export async function addReportMutation(title: string): Promise<Report[]> {
  const t = title?.trim();
  if (!t) return await getReports();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("reports").insert({ title: t });
  if (error) {
    if (error.code === "42501") {
      throw new Error(
        "RLS policy blocked insert. Fix: (1) Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Settings → API → service_role), or (2) Run supabase-rls-policy.sql in Supabase SQL Editor.",
      );
    }
    throw error;
  }

  revalidateTag("reports", "max");
  return await getReports();
}
