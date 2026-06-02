/**
 * scripts/run_migration.ts
 * Supabase REST API를 통해 마이그레이션 SQL을 실행합니다.
 * Service Role Key가 필요합니다.
 *
 * 실행 방법:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/run_migration.ts
 *
 * 또는 Supabase 대시보드 > SQL Editor에서 직접 실행:
 *   supabase/migrations/20260528_init_schema.sql
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 수동 마이그레이션 안내');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.');
  console.log('');
  console.log('아래 방법으로 마이그레이션을 실행하세요:');
  console.log('');
  console.log('1. Supabase 대시보드 접속:');
  console.log('   https://supabase.com/dashboard/project/pcjpbdmzbexsfzljegda');
  console.log('');
  console.log('2. SQL Editor 클릭');
  console.log('');
  console.log('3. 아래 파일 내용을 붙여넣고 실행:');
  console.log('   /Users/terrylee/stt-media/supabase/migrations/20260528_init_schema.sql');
  console.log('');
  console.log('4. 이후 시딩 스크립트 실행:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed_airport_data.ts');
  console.log('');
  process.exit(0);
}

// Service Role Key가 있을 경우 REST API로 직접 실행
const SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS airport_sentences (
    id              BIGSERIAL PRIMARY KEY,
    category        VARCHAR(50)  NOT NULL,
    sentence        TEXT         NOT NULL,
    gloss_sentence  TEXT         NOT NULL,
    emoji           VARCHAR(10)  DEFAULT '',
    embedding       vector(1536),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_airport_sentences_category
    ON airport_sentences(category);

CREATE TABLE IF NOT EXISTS recognition_logs (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text             TEXT         NOT NULL,
    matched_sentence_id  BIGINT       REFERENCES airport_sentences(id) ON DELETE SET NULL,
    similarity_score     FLOAT,
    match_method         VARCHAR(30)  DEFAULT 'client',
    session_id           TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE airport_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airport_sentences_public_read"
    ON airport_sentences FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "airport_sentences_auth_insert"
    ON airport_sentences FOR INSERT
    TO authenticated
    WITH CHECK (true);

ALTER TABLE recognition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recognition_logs_anon_insert"
    ON recognition_logs FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "recognition_logs_auth_read"
    ON recognition_logs FOR SELECT
    TO authenticated
    USING (true);
`;

async function runMigration() {
  const url = `${SUPABASE_URL}/rest/v1/rpc/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('마이그레이션 실패:', text);
    process.exit(1);
  }

  console.log('✅ 마이그레이션 완료!');
}

runMigration().catch(console.error);
