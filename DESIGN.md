# 공항 실시간 자막 서비스 (Airport STT-Gloss) 기획 및 설계서

본 기획 및 설계서는 `stt-project.md`와 `Airport.txt` 데이터셋을 기반으로 청각장애인을 위한 공항 전용 실시간 자막 웹 앱 서비스를 구축하기 위해 작성되었습니다.

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 배경 및 목적
* **문제 정의:** 공항은 안내 방송, 탑승 수속, 세관 및 입국 심사 등 소통이 빈번히 발생하는 장소입니다. 기존의 실시간 STT(Speech-to-Text) 서비스는 구어체 문장을 그대로 표출하거나 단어 단위로 끊겨 출력되어, 수어가 제1언어인 농인(청각장애인)이 맥락을 직관적이고 빠르게 이해하기 어렵습니다.
* **해결 방안:** Whisper를 통해 공항 이용객/직원의 음성을 실시간 텍스트로 인식하고, 인식된 텍스트를 공항 전용 스크립트 데이터셋(`Airport.txt`)과 실시간 매칭합니다. 매칭된 문장을 자연스러운 구어체 자막과 동시에 **수어 형태소 순서에 맞춘 글로스(Gloss) 자막**으로 변환하여 실시간으로 이중 표출함으로써 직관적이고 끊김 없는 소통을 지원합니다.

### 1.2 서비스의 핵심 가치 (Core Values)
1. **이중 자막 표출 (Dual Captioning):** 구어 한국어 자막(일반 자막)과 수어 글로스(Gloss) 자막을 함께 표출하여 청각장애인의 문해 성향에 맞춘 최적의 가독성을 제공합니다.
2. **공항 상황 맥락 중심:** `Airport.txt` 기반 70여 개의 필수 핵심 문장을 정형화하고 유사도 매칭을 수행해, Whisper의 오인식을 최소화하고 정확한 맥락을 전달합니다.
3. **크로스 플랫폼 지원:** 모바일과 웹 어디서나 즉시 접속 가능한 TypeScript 기반 반응형 웹앱입니다.

---

## 2. 시스템 아키텍처 (System Architecture)

전체 시스템은 다음과 같은 흐름으로 데이터를 처리합니다.

```
+--------------------+
|  사용자 마이크 입력  |
+---------+----------+
          | (실시간 Audio Stream)
          v
+--------------------+
|  Whisper STT Engine| -> 음성을 텍스트로 실시간 변환
+---------+----------+
          | (인식된 Korean Text)
          v
+--------------------+
| Sentence Matcher   | -> Supabase의 Airport.txt 데이터셋과 유사도 매칭 (Cosine Similarity)
+---------+----------+
          | (매칭된 공항 표준 문장)
          v
+--------------------+
|  Gloss Generator   | -> 한국어 구문 분석을 통해 수어 글로스(Gloss) 텍스트 추출
+---------+----------+
          | (한국어 문장 + Gloss 문장)
          v
+--------------------+
|  React/TS Frontend | -> 실시간 이중 자막 표출 (웹/모바일 반응형 뷰어)
+--------------------+
```

### 2.1 기술 스택 (Tech Stack)
* **Frontend:** React, TypeScript, Tailwind CSS, Vite (모바일/웹 반응형)
* **Backend & DB:** Supabase (PostgreSQL) - 데이터셋 보관, 벡터 검색(pgvector) 및 매칭 로그 관리
* **AI & NLP:** 
  * **STT:** OpenAI Whisper API / Local Whisper (실시간 음성 인식)
  * **Sentence Matching:** SentenceTransformers 또는 Supabase Edge Functions + pgvector (텍스트 유사도 매칭)
  * **Glossing Engine:** 형태소 분석기(Morpheme Analyzer - e.g., KoNLPy/Kkma, 혹은 클라이언트 사이드 가벼운 한글 형태소 분석 라이브러리) 기반 한국어 주어/목적어/서술어 추출 및 수어 어순 정렬 규칙 적용

---

## 3. 데이터베이스 설계 (Database Schema)

Supabase PostgreSQL을 기반으로 구축하며, `Airport.txt`의 문장 및 매칭 로직을 지원하도록 설계합니다.

### 3.1 `airport_sentences` (공항 스크립트 테이블)
공항에서 사용되는 표준 문장 70개와 해당 문장의 수어 글로스 변환 데이터, 그리고 고성능 유사도 매칭을 위한 텍스트 임베딩을 저장합니다.

```sql
CREATE TABLE airport_sentences (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 예: 탑승수속, 수하물, 입국심사, 교통/분실물
    sentence TEXT NOT NULL,        -- 한국어 구어체 문장 (예: "여권과 입국 신고서를 보여 주세요.")
    gloss_sentence TEXT NOT NULL,  -- 수어 글로스 문장 (예: "여권 입국-신고서 보여주다")
    embedding vector(1536),        -- 문장 임베딩 벡터 (Cosine Similarity 매칭용, OpenAI text-embedding-3-small 등 사용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.2 `recognition_logs` (실시간 인식 및 매칭 로그)
실시간 음성 인식 결과와 실제 매칭된 문장 간의 이력을 기록하여, 매칭 알고리즘 정확도 개선 및 학습 데이터셋 고도화에 활용합니다.

```sql
CREATE TABLE recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text TEXT NOT NULL,         -- Whisper가 실제로 인식한 텍스트
    matched_sentence_id BIGINT REFERENCES airport_sentences(id), -- 매칭된 표준 문장 ID
    similarity_score FLOAT,        -- 유사도 점수 (0.0 ~ 1.0)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 4. 글로스 및 문장 변환 메커니즘 (Gloss & Whisper Translation)

### 4.1 실시간 변환 파이프라인
1. **음성 인식 (Whisper):** 사용자가 마이크로 말한 음성(예: "저기요 여권이랑 입국신고서 좀 보여주실래요?")을 고정밀 텍스트로 받아옵니다.
2. **시맨틱 정렬 (Semantic Alignment):** 인식된 텍스트를 Supabase에 저장된 70개의 표준 공항 문장 벡터와 비교하여 코사인 유사도가 가장 높은 문장(ID 9: "여권과 입국 신고서를 보여 주세요.")으로 매칭합니다.
3. **수어 글로스 생성 (Glossing):**
   * 수어는 한국어 조사(은/는/이/가, 을/를 등)를 생략하고 핵심 명사와 동사의 원형(기본형) 위주로 어순이 구성됩니다.
   * 변환 규칙 예시:
     * *구어체:* "여권과 입국 신고서를 보여 주세요." -> *형태소 분석:* 여권(명사) + 과(조사) + 입국(명사) + 신고서(명사) + 를(조사) + 보여주(동사) + 어(어미) + 주세(동사) + 요(어미)
     * *글로스 추출:* `여권` `입국-신고서` `보여주다`
4. **화면 표출:** 이중 자막 레이아웃을 통해 매칭된 구어체 문장과 수어 글로스를 직관적인 UI로 실시간 렌더링합니다.

---

## 5. UI/UX 디자인 가이드라인 (Responsive Web App)

모바일 기기 들고 다니며 사용하는 공항 환경 특성을 반영하여 **한 손 조작성**과 **극대화된 가독성**을 최우선으로 합니다.

### 5.1 화면 레이아웃 (Layouts)
* **Dark Mode Default:** 어두운 공항 내부나 야간 비행 시 눈의 피로를 최소화하기 위해 기본 다크 모드 제공.
* **자막 영역 (Subtitle Display Window):**
  * **상단:** 일반 구어 자막 (흰색, 24px, Semi-bold)
  * **하단:** 수어 글로스 자막 (형광 노란색/연두색, 36px, Bold) - 수어 어순에 익숙한 농인이 빠르게 눈으로 훑을 수 있도록 크고 강렬하게 표출.
  * **상태 표시기:** 실시간 마이크 입력 감지 애니메이션 및 Supabase 연결 상태 표시.
* **공항 카테고리 퀵 시트 (Quick Sheet Drawer):**
  * 음성 인식이 어려운 시끄러운 공항 환경을 대비해, 자주 쓰는 70대 문장을 카테고리별(탑승수속, 면세점, 수하물, 길찾기 등)로 분류한 탭 UI 제공.
  * 클릭 시 화면에 자막 형태로 바로 표출되어 직원에게 스마트폰 화면을 보여주는 방식으로 즉각 소통 가능.

---

## 6. 구현 및 테스트 계획 (Implementation & Testing)

### 6.1 단계별 개발 타임라인
* **1단계: 데이터 가공 및 Supabase 세팅 (1~2일)**
  * `Airport.txt` 문장 70개를 카테고리별로 정밀 매핑하고 수어 글로스 표기법 작성.
  * Supabase 테이블 마이그레이션 및 데이터 삽입 스크립트 실행.
* **2단계: Core Frontend 및 STT 연동 (2~3일)**
  * Vite + React + TypeScript 프로젝트 생성.
  * Web Audio API 및 Whisper SDK/API 연동하여 실시간 마이크 입력 처리.
* **3단계: 문장 매칭 및 글로스 분석기 구현 (2일)**
  * 클라이언트 사이드 한글 형태소 분석 라이브러리(또는 Supabase Edge Functions NLP API)를 사용해 입력된 문장을 글로스로 변환하는 알고리즘 최적화.
  * 벡터/키워드 혼합 방식의 표준 문장 매칭 최적화.
* **4단계: 하네스(Harness) 기반 코드 리뷰 및 QA (2일)**
  * 코드 퀄리티 게이트웨이(ESLint, Prettier, TypeScript Strict Mode) 적용.
  * 다양한 음성 노이즈 환경 테스트 및 유사도 매칭 임계치(Threshold) 조정.
  * 모바일 크로스 브라우징 및 레이아웃 검증.
* **5단계: 배포 (1일)**
  * Vercel / Netlify 등을 활용한 웹 배포 및 모바일 실기기 최종 검증.

---

## 7. 차후 개발 로드맵 (Future Roadmap)

`stt-project.md`에서 기술된 차후 고도화 단계의 기획입니다.

1. **SignGPT 소스코드 분석:** 수어 생성 및 텍스트-수어 번역 신경망(Text-to-Sign) 모델 구조 파악.
2. **Hermes Agent 및 MediaPipe 기반 데이터셋 구축:**
   * 스마트폰/웹캠 영상을 통해 실제 농인의 수어 제스처를 촬영하고 MediaPipe Holistic을 활용해 손가락 마디, 얼굴 표정, 관절 좌표 데이터를 실시간 추출.
   * 추출된 모션 좌표 데이터를 한국어 표준 글로스 문장과 동기화하여 수어 모션 데이터셋 구축.
3. **수어 아바타 생성 (Human-like Avatar):**
   * WebGL / Three.js 기반의 고품질 3D 캐릭터 모델 탑재.
   * MediaPipe로 수집 가공된 모션 좌표 데이터를 3D 캐릭터 리깅에 매핑하여 사람과 매우 유사하게 자연스럽게 움직이는 3D 수어 아바타 시스템 구현.
4. **감정 표현 고도화:** 수어에서 중요한 비수어 표현(얼굴 찡그림, 눈썹의 각도, 입 모양 등)을 실시간 아바타 메시에 동적으로 표현하여 전달력 극대화.
