-- ============================================================
-- Airport STT-Gloss DB 초기 스키마 마이그레이션
-- Created: 2026-05-28
-- ============================================================

-- pgvector 확장 활성화 (벡터 유사도 검색용)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. airport_sentences: 공항 표준 문장 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS airport_sentences (
    id              BIGSERIAL PRIMARY KEY,
    category        VARCHAR(50)  NOT NULL,       -- 예: 탑승수속, 수하물, 입국심사
    sentence        TEXT         NOT NULL,       -- 한국어 구어체 문장
    gloss_sentence  TEXT         NOT NULL,       -- 수어 글로스 문장
    emoji           VARCHAR(10)  DEFAULT '',     -- 카테고리 이모지
    embedding       vector(1536),               -- OpenAI text-embedding-3-small (선택)
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc', now())
);

-- 카테고리 인덱스 (빠른 필터)
CREATE INDEX IF NOT EXISTS idx_airport_sentences_category
    ON airport_sentences(category);

-- 전문 검색 인덱스 (GIN - 한국어 키워드 검색)
CREATE INDEX IF NOT EXISTS idx_airport_sentences_sentence_gin
    ON airport_sentences USING GIN(to_tsvector('simple', sentence));

-- 벡터 검색 인덱스 (embedding이 채워진 경우)
-- IVFFlat 인덱스는 데이터가 1000건 이상일 때 효과적이므로
-- 70건 규모에서는 순차 스캔(SeqScan)이 더 빠름
-- CREATE INDEX IF NOT EXISTS idx_airport_sentences_embedding
--     ON airport_sentences USING ivfflat(embedding vector_cosine_ops) WITH (lists = 5);

-- ============================================================
-- 2. recognition_logs: 실시간 음성 인식 및 매칭 이력 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS recognition_logs (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text             TEXT         NOT NULL,         -- Whisper 인식 원문
    matched_sentence_id  BIGINT       REFERENCES airport_sentences(id) ON DELETE SET NULL,
    similarity_score     FLOAT,                         -- 유사도 점수 (0.0 ~ 1.0)
    match_method         VARCHAR(30)  DEFAULT 'client', -- 'client' | 'pgvector' | 'manual'
    session_id           TEXT,                          -- 익명 세션 식별자 (선택)
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc', now())
);

-- 최근 로그 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_recognition_logs_created_at
    ON recognition_logs(created_at DESC);

-- 매칭 문장 ID 인덱스
CREATE INDEX IF NOT EXISTS idx_recognition_logs_sentence_id
    ON recognition_logs(matched_sentence_id);

-- ============================================================
-- 3. Row Level Security (RLS) 정책
-- ============================================================

-- airport_sentences: 공개 읽기, 인증된 사용자만 쓰기
ALTER TABLE airport_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airport_sentences_public_read"
    ON airport_sentences FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "airport_sentences_auth_insert"
    ON airport_sentences FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "airport_sentences_auth_update"
    ON airport_sentences FOR UPDATE
    TO authenticated
    USING (true);

-- recognition_logs: 익명 포함 삽입 허용, 읽기는 인증된 사용자만
ALTER TABLE recognition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recognition_logs_anon_insert"
    ON recognition_logs FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "recognition_logs_auth_read"
    ON recognition_logs FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================
-- 4. pgvector 기반 유사도 검색 함수 (선택 사용)
-- ============================================================
CREATE OR REPLACE FUNCTION match_airport_sentences(
    query_embedding vector(1536),
    match_threshold float  DEFAULT 0.75,
    match_count     int    DEFAULT 5
)
RETURNS TABLE (
    id              bigint,
    category        text,
    sentence        text,
    gloss_sentence  text,
    emoji           text,
    similarity      float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.category::text,
        s.sentence,
        s.gloss_sentence,
        s.emoji::text,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM airport_sentences s
    WHERE s.embedding IS NOT NULL
      AND 1 - (s.embedding <=> query_embedding) > match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
