-- =============================================
-- 마이그레이션: 20260531_gemini_embedding_768.sql
-- OpenAI 1536차원 → Gemini text-embedding-004 768차원으로 변경
--
-- ※ 기존 테이블이 없으면 전체 스키마를 새로 생성합니다.
--   기존 테이블이 있으면 embedding 컬럼만 교체합니다.
-- =============================================

-- 1. pgvector 확장 (이미 있으면 skip)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 2. airport_sentences 테이블
--    (없으면 생성, 있으면 embedding 컬럼 교체)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'airport_sentences'
  ) THEN
    -- 신규 생성: vector(768) — Gemini text-embedding-004
    CREATE TABLE airport_sentences (
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
      embedding       vector(768),   -- Gemini text-embedding-004 (768차원)
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'airport_sentences 테이블 생성 완료 (vector 768)';
  ELSE
    -- 기존 테이블: embedding 컬럼 교체
    -- 1. 기존 embedding 인덱스 제거
    DROP INDEX IF EXISTS idx_airport_sentences_embedding;
    -- 2. embedding 컬럼 타입 변경 (1536 → 768)
    --    기존 데이터는 모두 NULL로 초기화됩니다 (재임베딩 필요)
    ALTER TABLE airport_sentences
      ALTER COLUMN embedding TYPE vector(768)
      USING NULL::vector(768);
    RAISE NOTICE 'airport_sentences.embedding 컬럼을 vector(768)로 변경 완료';
  END IF;
END $$;

-- =============================================
-- 3. 인덱스 재생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_airport_sentences_category
  ON airport_sentences(category);

CREATE INDEX IF NOT EXISTS idx_airport_sentences_active
  ON airport_sentences(is_active);

CREATE INDEX IF NOT EXISTS idx_airport_sentences_keywords
  ON airport_sentences USING GIN(keywords);

-- HNSW 인덱스: 768차원 코사인 유사도
CREATE INDEX IF NOT EXISTS idx_airport_sentences_embedding
  ON airport_sentences
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================
-- 4. updated_at 자동 갱신 트리거
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_airport_sentences_updated_at ON airport_sentences;
CREATE TRIGGER trg_airport_sentences_updated_at
  BEFORE UPDATE ON airport_sentences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- 5. audio_sessions 테이블
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
-- 6. recognition_logs 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS recognition_logs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID        REFERENCES audio_sessions(id) ON DELETE SET NULL,
    raw_text            TEXT        NOT NULL,
    matched_sentence_id BIGINT      REFERENCES airport_sentences(id) ON DELETE SET NULL,
    fallback_type       VARCHAR(20) CHECK (fallback_type IN ('levenshtein','webspeech','manual')),
    similarity_score    FLOAT       CHECK (similarity_score BETWEEN 0.0 AND 1.0),
    processing_time_ms  FLOAT,
    client_device       VARCHAR(20),
    user_confirmed      BOOLEAN     DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognition_logs_session
  ON recognition_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_sentence
  ON recognition_logs(matched_sentence_id);
CREATE INDEX IF NOT EXISTS idx_recognition_logs_created
  ON recognition_logs(created_at DESC);

-- =============================================
-- 7. user_feedback 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS user_feedback (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id              UUID        REFERENCES recognition_logs(id) ON DELETE CASCADE,
    rating              SMALLINT    CHECK (rating BETWEEN 1 AND 5),
    corrected_sentence  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 8. RPC: match_airport_sentence (768차원 버전)
-- =============================================
CREATE OR REPLACE FUNCTION match_airport_sentence(
    query_embedding     vector(768),   -- Gemini 768차원
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
        AND s.embedding IS NOT NULL
        AND 1 - (s.embedding <=> query_embedding) >= match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- =============================================
-- 9. RLS 정책
-- =============================================
ALTER TABLE airport_sentences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_sentences"  ON airport_sentences;
DROP POLICY IF EXISTS "anon_insert_logs"       ON recognition_logs;
DROP POLICY IF EXISTS "anon_session_insert"    ON audio_sessions;
DROP POLICY IF EXISTS "anon_feedback_insert"   ON user_feedback;

CREATE POLICY "public_read_sentences"
  ON airport_sentences FOR SELECT USING (is_active = true);
CREATE POLICY "anon_insert_logs"
  ON recognition_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_session_insert"
  ON audio_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_feedback_insert"
  ON user_feedback FOR INSERT WITH CHECK (true);

-- =============================================
-- 10. 샘플 데이터 삽입 (embedding은 앱에서 채움)
-- =============================================
INSERT INTO airport_sentences
  (category, sentence, gloss_sentence, english_translation, keywords, display_order)
VALUES
  ('BOARDING',    '탑승 수속 창구가 어디인가요?',          '탑승수속 창구 어디',          'Where is the check-in counter?',             ARRAY['탑승수속','창구'],        1),
  ('BOARDING',    '탑승권을 보여주시겠어요?',               '탑승권 보여주다',             'Can I see your boarding pass?',              ARRAY['탑승권'],                 2),
  ('BOARDING',    '비행기를 놓쳤어요.',                     '비행기 놓치다',               'I missed my flight.',                        ARRAY['비행기','놓치다'],         3),
  ('BOARDING',    '출발 게이트가 어디예요?',                '출발 게이트 어디',            'Where is the departure gate?',               ARRAY['게이트','출발'],           4),
  ('BOARDING',    '탑승 시간이 언제예요?',                  '탑승 시간 언제',              'What time is boarding?',                     ARRAY['탑승','시간'],             5),
  ('BOARDING',    '비행기가 얼마나 지연됐나요?',            '비행기 지연 얼마',            'How long is the flight delayed?',            ARRAY['지연','비행기'],           6),
  ('BOARDING',    '창가 자리로 주세요.',                    '창가 자리 원하다',            'I would like a window seat.',                ARRAY['창가','자리'],             7),
  ('BOARDING',    '통로 자리로 주세요.',                    '통로 자리 원하다',            'I would like an aisle seat.',                ARRAY['통로','자리'],             8),
  ('BOARDING',    '항공편이 취소됐나요?',                   '항공편 취소 됐나',            'Is the flight cancelled?',                   ARRAY['항공편','취소'],           9),
  ('BOARDING',    '체크인 카운터가 어디예요?',              '체크인 카운터 어디',          'Where is the check-in counter?',             ARRAY['체크인','카운터'],         10),
  ('IMMIGRATION', '여권과 입국 신고서를 보여 주세요.',      '여권 입국신고서 보여주다',    'Please show your passport and entry form.',  ARRAY['여권','입국신고서'],       1),
  ('IMMIGRATION', '방문 목적이 무엇인가요?',                '방문 목적 무엇',              'What is the purpose of your visit?',         ARRAY['방문','목적'],             2),
  ('IMMIGRATION', '관광입니다.',                            '관광',                        'Tourism.',                                   ARRAY['관광'],                   3),
  ('IMMIGRATION', '출장입니다.',                            '출장',                        'Business trip.',                             ARRAY['출장'],                   4),
  ('IMMIGRATION', '얼마나 머물 예정인가요?',                '머물다 기간 얼마',            'How long will you be staying?',              ARRAY['머물다','기간'],           5),
  ('IMMIGRATION', '세관 신고서를 작성해 주세요.',           '세관 신고서 작성하다',        'Please fill out the customs form.',          ARRAY['세관','신고서'],           6),
  ('IMMIGRATION', '신고할 물건이 없어요.',                  '신고 물건 없다',              'I have nothing to declare.',                 ARRAY['신고','없다'],             7),
  ('BAGGAGE',     '수하물 찾는 곳이 어디입니까?',           '수하물 찾다 어디',            'Where is the baggage claim?',                ARRAY['수하물','찾다'],           1),
  ('BAGGAGE',     '제 캐리어가 안 나왔어요.',               '캐리어 안 나오다',            'My luggage has not arrived.',                ARRAY['캐리어','수하물'],         2),
  ('BAGGAGE',     '짐이 망가졌어요.',                       '짐 망가지다',                 'My luggage is damaged.',                     ARRAY['짐','망가지다'],           3),
  ('BAGGAGE',     '수하물 분실 신고를 하고 싶어요.',        '수하물 분실 신고 원하다',     'I want to report lost baggage.',             ARRAY['분실','신고'],             4),
  ('BAGGAGE',     '수하물 무게가 초과됐어요.',              '수하물 무게 초과',            'My baggage is overweight.',                  ARRAY['무게','초과'],             5),
  ('BAGGAGE',     '짐을 부치고 싶어요.',                    '짐 부치다 원하다',            'I want to check my luggage.',                ARRAY['짐','부치다'],             6),
  ('BAGGAGE',     '수하물 보관소가 어디예요?',              '수하물 보관소 어디',          'Where is the luggage storage?',              ARRAY['보관소'],                  7),
  ('DUTY_FREE',   '면세점이 몇 층이에요?',                  '면세점 몇층',                 'What floor is the duty-free shop?',          ARRAY['면세점'],                  1),
  ('DUTY_FREE',   '이거 얼마예요?',                         '이거 얼마',                   'How much is this?',                          ARRAY['얼마'],                   2),
  ('DUTY_FREE',   '카드로 결제할게요.',                     '카드 결제',                   'I will pay by card.',                        ARRAY['카드','결제'],             3),
  ('DUTY_FREE',   '환불할 수 있나요?',                      '환불 가능',                   'Can I get a refund?',                        ARRAY['환불'],                   4),
  ('DUTY_FREE',   '다른 사이즈 있나요?',                    '다른 사이즈 있나',            'Do you have another size?',                  ARRAY['사이즈'],                  5),
  ('TRANSPORT',   '시내 가는 버스는 어디서 타나요?',        '시내버스 어디 타다',          'Where can I take the bus to the city?',      ARRAY['버스','시내'],             1),
  ('TRANSPORT',   '택시 타는 곳이 어디예요?',              '택시 타다 어디',              'Where can I get a taxi?',                    ARRAY['택시'],                   2),
  ('TRANSPORT',   '지하철역이 어디예요?',                   '지하철역 어디',               'Where is the subway station?',               ARRAY['지하철'],                  3),
  ('FACILITY',    '화장실이 어디예요?',                      '화장실 어디',                 'Where is the restroom?',                     ARRAY['화장실'],                  1),
  ('FACILITY',    'ATM이 어디예요?',                        'ATM 어디',                    'Where is the ATM?',                          ARRAY['ATM'],                    2),
  ('FACILITY',    '환전소가 어디예요?',                      '환전소 어디',                 'Where is the currency exchange?',            ARRAY['환전소'],                  3),
  ('FACILITY',    '와이파이 비밀번호가 뭐예요?',            '와이파이 비밀번호 무엇',      'What is the Wi-Fi password?',                ARRAY['와이파이','비밀번호'],      4),
  ('FACILITY',    '안내 데스크가 어디예요?',                '안내 데스크 어디',            'Where is the information desk?',             ARRAY['안내','데스크'],           5),
  ('MEDICAL',     '몸이 아파요.',                           '몸 아프다',                   'I am sick.',                                 ARRAY['아프다'],                  1),
  ('MEDICAL',     '의사가 필요해요.',                       '의사 필요',                   'I need a doctor.',                           ARRAY['의사'],                   2),
  ('MEDICAL',     '응급 처치가 필요해요.',                  '응급처치 필요',               'I need first aid.',                          ARRAY['응급','처치'],             3),
  ('MEDICAL',     '약국이 어디예요?',                       '약국 어디',                   'Where is the pharmacy?',                     ARRAY['약국'],                   4),
  ('LOST',        '분실물 센터가 어디예요?',                '분실물센터 어디',             'Where is the lost and found center?',        ARRAY['분실물'],                  1),
  ('LOST',        '지갑을 잃어버렸어요.',                   '지갑 잃다',                   'I lost my wallet.',                          ARRAY['지갑','잃다'],             2),
  ('LOST',        '여권을 잃어버렸어요.',                   '여권 잃다',                   'I lost my passport.',                        ARRAY['여권','잃다'],             3),
  ('LOST',        '핸드폰을 잃어버렸어요.',                '핸드폰 잃다',                 'I lost my phone.',                           ARRAY['핸드폰','폰'],             4),
  ('LOST',        '도와주세요!',                            '도움 필요',                   'Please help me!',                            ARRAY['도움','도와주다'],         5),
  ('LOST',        '저는 청각장애인입니다.',                 '나 청각장애인',               'I am hearing impaired.',                     ARRAY['청각장애인'],              6),
  ('LOST',        '경찰을 불러주세요.',                     '경찰 부르다',                 'Please call the police.',                    ARRAY['경찰'],                   7),
  ('LOST',        '대사관 연락처를 알려주세요.',            '대사관 연락처 알려주다',      'Please tell me the embassy contact.',        ARRAY['대사관'],                  8)
ON CONFLICT DO NOTHING;
