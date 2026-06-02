-- =============================================
-- 마이그레이션: 20260529_init_schema.sql
-- Airport STT-Gloss 전체 스키마
-- =============================================

-- 1. 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 2. airport_sentences
-- =============================================
CREATE TABLE IF NOT EXISTS airport_sentences (
    id              BIGSERIAL PRIMARY KEY,
    category        VARCHAR(50)   NOT NULL
                    CHECK (category IN (
                        'BOARDING','IMMIGRATION','BAGGAGE',
                        'DUTY_FREE','TRANSPORT','FACILITY','MEDICAL','LOST'
                    )),
    sentence        TEXT          NOT NULL,
    gloss_sentence  TEXT          NOT NULL,
    english_translation TEXT,
    keywords        TEXT[]        DEFAULT '{}',
    display_order   INT           DEFAULT 0,
    is_active       BOOLEAN       DEFAULT true,
    embedding       vector(1536),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airport_sentences_category  ON airport_sentences(category);
CREATE INDEX IF NOT EXISTS idx_airport_sentences_active    ON airport_sentences(is_active);
CREATE INDEX IF NOT EXISTS idx_airport_sentences_keywords  ON airport_sentences USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_airport_sentences_embedding
    ON airport_sentences
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_airport_sentences_updated_at ON airport_sentences;
CREATE TRIGGER trg_airport_sentences_updated_at
    BEFORE UPDATE ON airport_sentences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- 3. audio_sessions
-- =============================================
CREATE TABLE IF NOT EXISTS audio_sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token       TEXT        NOT NULL UNIQUE,
    device_type         VARCHAR(20) CHECK (device_type IN ('mobile','tablet','desktop')),
    browser_ua          TEXT,
    locale              VARCHAR(10) DEFAULT 'ko-KR',
    total_recognitions  INT         DEFAULT 0,
    successful_matches  INT         DEFAULT 0,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMPTZ
);

-- =============================================
-- 4. recognition_logs
-- =============================================
CREATE TABLE IF NOT EXISTS recognition_logs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID        REFERENCES audio_sessions(id) ON DELETE SET NULL,
    raw_text            TEXT        NOT NULL,
    matched_sentence_id BIGINT      REFERENCES airport_sentences(id) ON DELETE SET NULL,
    fallback_type       VARCHAR(20) CHECK (fallback_type IN ('levenshtein','webspeech','manual')),
    similarity_score    FLOAT       CHECK (similarity_score BETWEEN 0.0 AND 1.0),
    processing_time_ms  FLOAT,
    client_device       VARCHAR(20) CHECK (client_device IN ('mobile','desktop','unknown')),
    user_confirmed      BOOLEAN     DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognition_logs_session   ON recognition_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_sentence  ON recognition_logs(matched_sentence_id);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_created   ON recognition_logs(created_at DESC);

-- =============================================
-- 5. user_feedback
-- =============================================
CREATE TABLE IF NOT EXISTS user_feedback (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id              UUID        REFERENCES recognition_logs(id) ON DELETE CASCADE,
    rating              SMALLINT    CHECK (rating BETWEEN 1 AND 5),
    corrected_sentence  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 6. RPC: match_airport_sentence
-- =============================================
CREATE OR REPLACE FUNCTION match_airport_sentence(
    query_embedding     vector(1536),
    match_threshold     FLOAT   DEFAULT 0.75,
    match_count         INT     DEFAULT 1
)
RETURNS TABLE (
    id                  BIGINT,
    category            VARCHAR(50),
    sentence            TEXT,
    gloss_sentence      TEXT,
    english_translation TEXT,
    similarity          FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        s.id,
        s.category,
        s.sentence,
        s.gloss_sentence,
        s.english_translation,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM airport_sentences s
    WHERE
        s.is_active = true
        AND 1 - (s.embedding <=> query_embedding) >= match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- =============================================
-- 7. RLS 정책
-- =============================================
ALTER TABLE airport_sentences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_sentences"  ON airport_sentences;
DROP POLICY IF EXISTS "anon_insert_logs"       ON recognition_logs;
DROP POLICY IF EXISTS "anon_session_insert"    ON audio_sessions;
DROP POLICY IF EXISTS "anon_feedback_insert"   ON user_feedback;

CREATE POLICY "public_read_sentences"   ON airport_sentences FOR SELECT USING (is_active = true);
CREATE POLICY "anon_insert_logs"        ON recognition_logs  FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_session_insert"     ON audio_sessions    FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_feedback_insert"    ON user_feedback     FOR INSERT WITH CHECK (true);

-- =============================================
-- 8. 샘플 데이터 (Airport 핵심 8개 문장)
-- =============================================
INSERT INTO airport_sentences (category, sentence, gloss_sentence, english_translation, keywords, display_order) VALUES
('BOARDING',    '탑승 수속 창구가 어디인가요?',            '탑승수속 창구 어디',        'Where is the check-in counter?',            ARRAY['탑승수속','창구'],        1),
('BOARDING',    '탑승권을 보여주시겠어요?',                 '탑승권 보여주다',            'Can I see your boarding pass?',              ARRAY['탑승권'],                 2),
('BOARDING',    '비행기를 놓쳤어요.',                       '비행기 놓치다',              'I missed my flight.',                         ARRAY['비행기','놓치다'],         3),
('IMMIGRATION', '여권과 입국 신고서를 보여 주세요.',        '여권 입국신고서 보여주다',   'Please show me your passport and entry form.',ARRAY['여권','입국신고서'],       1),
('IMMIGRATION', '방문 목적이 무엇인가요?',                  '방문 목적 무엇',             'What is the purpose of your visit?',          ARRAY['방문목적'],               2),
('BAGGAGE',     '수하물 찾는 곳이 어디입니까?',             '수하물 찾다 어디',           'Where is the baggage claim?',                 ARRAY['수하물','baggage'],        1),
('BAGGAGE',     '짐이 망가졌어요.',                         '짐 망가지다',                'My luggage is damaged.',                      ARRAY['짐','망가지다'],          2),
('FACILITY',    '화장실이 어디예요?',                        '화장실 어디',                'Where is the restroom?',                      ARRAY['화장실'],                 1),
('DUTY_FREE',   '면세점이 몇 층이에요?',                    '면세점 몇층',                'What floor is the duty-free shop?',           ARRAY['면세점'],                 1),
('TRANSPORT',   '시내 가는 버스는 어디서 타나요?',          '시내버스 어디 타다',         'Where can I take the bus to the city?',       ARRAY['버스','시내'],             1),
('MEDICAL',     '몸이 아파요.',                             '몸 아프다',                  'I am sick.',                                  ARRAY['아프다','의료'],           1),
('LOST',        '분실물 센터가 어디예요?',                  '분실물센터 어디',            'Where is the lost and found center?',         ARRAY['분실물'],                 1)
ON CONFLICT DO NOTHING;
