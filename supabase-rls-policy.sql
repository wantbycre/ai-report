-- reports 테이블 RLS 정책 (anon으로 SELECT/INSERT 허용)
-- Supabase Dashboard → SQL Editor 에서 이 스크립트 실행

-- 기존 정책이 있으면 이름만 바꿔서 사용
CREATE POLICY "Allow anon select reports"
  ON reports FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert reports"
  ON reports FOR INSERT
  TO anon
  WITH CHECK (true);
