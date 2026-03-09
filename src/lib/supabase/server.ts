import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트.
 * SUPABASE_SERVICE_ROLE_KEY 사용 시 RLS 우회(insert/update/delete 가능).
 * 없으면 anon key 사용 → RLS 정책 필요. 42501 에러 시:
 * 1) .env.local 에 SUPABASE_SERVICE_ROLE_KEY 추가 (Supabase Dashboard → Settings → API → service_role)
 * 2) 또는 Supabase SQL Editor 에서 supabase-rls-policy.sql 실행
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  // Service Role 이 있으면 항상 사용 (RLS 우회)
  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (!anonKey) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. For insert, use service role or add RLS policy (see supabase-rls-policy.sql).",
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
