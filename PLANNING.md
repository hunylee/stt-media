# 공항 실시간 자막 서비스 (Airport STT-Gloss) 구현 계획서

> **For Hermes:** 이 계획서를 바탕으로 `subagent-driven-development` 및 `test-driven-development` 스킬을 활용하여 태스크 단위로 완성도 높은 개발을 진행합니다.

**Goal:** 공항용 70개 핵심 구문(`Airport.txt`)을 학습한 Supabase 연동 Whisper 실시간 음성인식 + 수어 글로스(Gloss) 이중 자막 표출 모바일/웹 반응형 웹앱 개발.

**Architecture:** 사용자의 마이크 음성을 Web Audio API로 스트리밍하여 Whisper API로 인식시킨 후, Supabase pgvector 또는 유사도 매칭 알고리즘을 사용해 공항 표준 문장으로 보정하고, 이를 자연어 처리(NLP) 엔진을 통해 수어 어순 글로스 자막과 함께 실시간 이중 표출하는 아키텍처.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Supabase, OpenAI Whisper API / Local Web Speech API.

---

## 1단계: 개발 기반 및 데이터 인프라 구축

### Task 1: Supabase 프로젝트 초기화 및 DB 스키마 마이그레이션

**Objective:** Supabase DB 상에 `airport_sentences` 및 `recognition_logs` 테이블을 정의하고 pgvector 확장을 설치합니다.

**Files:**
- Create: `supabase/migrations/20260528_init_schema.sql`

**Step 1: SQL 마이그레이션 코드 작성**

```sql
-- pgvector 확장 활성화 (유사도 검색용)
CREATE EXTENSION IF NOT EXISTS vector;

-- 공항 표준 문장 테이블
CREATE TABLE IF NOT EXISTS airport_sentences (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sentence TEXT NOT NULL,
    gloss_sentence TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small 등 대응
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인식 로그 테이블
CREATE TABLE IF NOT EXISTS recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text TEXT NOT NULL,
    matched_sentence_id BIGINT REFERENCES airport_sentences(id),
    similarity_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**Step 2: 로컬 검증 및 마이그레이션 적용**

Supabase CLI 또는 대시보드를 통해 위 SQL을 실행하여 DB 구성을 완료합니다.

---

### Task 2: `Airport.txt` 파싱 및 Supabase 데이터 시딩 (Seeding)

**Objective:** `/Users/terrylee/Downloads/Airport.txt` 파일을 읽어 카테고리를 자동 분류하고 수어 글로스를 추출/매핑한 뒤, Supabase에 초기 데이터를 자동으로 삽입하는 Node.js/TypeScript 또는 Python 시딩 스크립트를 작성합니다.

**Files:**
- Create: `scripts/seed_airport_data.ts`
- Source: `/Users/terrylee/Downloads/Airport.txt`

**Step 1: 데이터 정제 및 수어 글로스 사전 규칙 정의**

* 예시 변환 규칙:
  * "탑승 수속 창구가 어디인가요?" -> [탑승수속] / "수속-창구 어디"
  * "비행기를 놓쳤어요." -> [항공예약] / "비행기 놓치다"
  * "화장실이 어디예요?" -> [편의시설] / "화장실 어디"

**Step 2: 시딩 스크립트 작성**

```typescript
// scripts/seed_airport_data.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 간단한 카테고리 매핑 및 글로스 생성 매트릭스
function generateGlossAndCategory(sentence: string) {
    let category = '기타';
    let gloss = sentence;
    
    if (sentence.includes('창구') || sentence.includes('탑승')) {
        category = '탑승수속';
        gloss = sentence.replace(' 창구가 어디인가요?', ' 창구 어디').replace(' 보여주세요', ' 보여주다');
    } else if (sentence.includes('여권') || sentence.includes('심사')) {
        category = '입국심사';
        gloss = sentence.replace(' 보여 주세요.', ' 보여주다').replace('어디입니까?', '어디');
    } else if (sentence.includes('면세점') || sentence.includes('쇼핑')) {
        category = '면세점';
        gloss = sentence.replace(' 몇 층이에요?', ' 몇층').replace(' 살 거 있어?', ' 사다 필요');
    } else if (sentence.includes('짐') || sentence.includes('캐리어') || sentence.includes('수하물')) {
        category = '수하물';
        gloss = sentence.replace(' 찾는 곳이 어디입니까?', ' 찾다 어디').replace(' 망가졌어요.', ' 망가지다');
    } else if (sentence.includes('비행기') || sentence.includes('항공편')) {
        category = '항공예약';
        gloss = sentence.replace(' 예약하고 싶어요', ' 예약 원하다');
    }
    
    // 조사를 빼고 원형으로 단순화하는 글로싱 예시 규칙 추가 적용
    gloss = gloss
        .replace(/을/g, '')
        .replace(/를/g, '')
        .replace(/이/g, '')
        .replace(/가/g, '')
        .replace(/은/g, '')
        .replace(/는/g, '')
        .replace(/의/g, '')
        .trim();

    return { category, gloss };
}

async function seed() {
    const rawData = fs.readFileSync('/Users/terrylee/Downloads/Airport.txt', 'utf-8');
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const records = lines.map(line => {
        const { category, gloss } = generateGlossAndCategory(line);
        return {
            category,
            sentence: line,
            gloss_sentence: gloss
        };
    });

    const { data, error } = await supabase.from('airport_sentences').insert(records);
    if (error) console.error('Error seeding data:', error);
    else console.log('Successfully seeded sentences count:', records.length);
}

seed();
```

---

## 2단계: 핵심 프론트엔드 및 음성 인식(STT) 연동

### Task 3: Vite + React + TypeScript 프로젝트 및 오디오 컴포넌트 세팅

**Objective:** 프로젝트 구조를 셋업하고, Web Audio API 및 Web Speech API(또는 OpenAI Whisper API SDK)를 활용하여 사용자의 음성을 실시간으로 인식할 수 있는 리액트 상태 기계를 구현합니다.

**Files:**
- Create: `src/hooks/useVoiceRecognizer.ts`
- Create: `src/components/AudioVisualizer.tsx`

**Step 1: 실시간 음성인식 커스텀 훅 구현**

```typescript
// src/hooks/useVoiceRecognizer.ts
import { useState, useEffect, useRef } from 'react';

export function useVoiceRecognizer() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'ko-KR';

            rec.onresult = (event: any) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                setTranscript(final || interim);
            };

            rec.onerror = (e: any) => console.error(e);
            recognitionRef.current = rec;
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true);
            setTranscript('');
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            setIsListening(false);
            recognitionRef.current.stop();
        }
    };

    return { isListening, transcript, startListening, stopListening };
}
```

---

## 3단계: 유사도 매칭 및 실시간 이중 자막 표출

### Task 4: 문장 유사도 매칭 및 실시간 글로싱 변환 알고리즘

**Objective:** Whisper로 인식된 구어체 문장을 데이터베이스의 표준 `Airport.txt` 70개 문장 중 가장 유사한 문장으로 매칭하고, 매칭율이 임계치 이하면 실시간 글로스 변환 로직을 적용하여 화면에 이중 자막을 띄웁니다.

**Files:**
- Create: `src/utils/sentenceMatcher.ts`
- Create: `src/utils/glossEngine.ts`

**Step 1: 한글 자모 분석 및 레벤슈타인 거리 기반 빠른 정합 알고리즘 구현**

* 서버 비용 최소화 및 저지연(Low-latency) 실시간 처리를 위해, 클라이언트 사이드 자모 분리 기반 레벤슈타인 거리 알고리즘을 구현하여 Supabase에 저장된 70개 문장과 실시간 매칭을 수행합니다.

```typescript
// src/utils/sentenceMatcher.ts
import { levenshteinDistance } from './distance'; // 별도 자모분리 정밀 계산 함수

export function findBestMatch(input: string, library: Array<{ id: number, sentence: string, gloss_sentence: string }>) {
    let bestMatch = library[0];
    let minDistance = Infinity;
    
    for (const item of library) {
        const dist = levenshteinDistance(input, item.sentence);
        if (dist < minDistance) {
            minDistance = dist;
            bestMatch = item;
        }
    }
    
    const similarity = 1 - minDistance / Math.max(input.length, bestMatch.sentence.length);
    return { bestMatch, similarity };
}
```

---

### Task 5: 실시간 이중 자막 렌더러 및 반응형 모바일/웹 메인 UI 개발

**Objective:** 농인을 위해 자막 영역을 최적화한 극대화된 다크 모드 이중 자막 뷰어 UI를 작성합니다. 모바일 기기의 터치 제스처를 고려한 퀵 카테고리 시트를 구현합니다.

**Files:**
- Create: `src/components/SubtitleViewer.tsx`
- Create: `src/components/CategoryQuickSheet.tsx`
- Modify: `src/App.tsx`

**Step 1: 다크 모드 특화 이중 자막 UI 개발**

```typescript
// src/components/SubtitleViewer.tsx
import React from 'react';

interface SubtitleViewerProps {
    rawText: string;          // 실시간 Whisper 텍스트
    matchedSentence: string;  // 보정된 표준 한국어 문장
    glossText: string;        // 수어 글로스 문장
    similarity: number;       // 매칭 정확도
}

export const SubtitleViewer: React.FC<SubtitleViewerProps> = ({
    rawText,
    matchedSentence,
    glossText,
    similarity
}) => {
    return (
        <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-72">
            <div className="text-xs text-gray-500 font-mono flex justify-between">
                <span>[실시간 매칭 상태]</span>
                {similarity > 0.6 && (
                    <span className="text-green-400">일치율: {(similarity * 100).toFixed(0)}%</span>
                )}
            </div>
            
            {/* 구어체 문장 영역 */}
            <div className="my-4">
                <p className="text-gray-400 text-sm mb-1">일반 자막 (한국어 구어체)</p>
                <p className="text-white text-xl font-semibold leading-relaxed">
                    {matchedSentence || rawText || "말씀을 시작하면 여기에 실시간으로 자막이 나타납니다."}
                </p>
            </div>
            
            {/* 수어 글로스 영역 - 시인성이 극대화된 크고 선명한 연두색 컬러 */}
            <div className="border-t border-gray-800 pt-4">
                <p className="text-lime-400 text-xs font-bold uppercase tracking-wider mb-1">수어 글로스 자막 (농인 직관형)</p>
                <p className="text-lime-300 text-3xl font-extrabold tracking-tight">
                    {glossText || "수어 글로스 대기 중"}
                </p>
            </div>
        </div>
    );
};
```

---

## 4단계: 테스트 및 하네스(Harness) 기반 코드 검증

### Task 6: Jest/Vitest를 통한 TDD 및 코드 퀄리티 테스트

**Objective:** 매칭 알고리즘의 예측 가능성을 검증하고, 오작동을 미연에 방지하기 위한 단위 테스트 및 테스트 하네스를 세팅합니다.

**Files:**
- Create: `src/utils/sentenceMatcher.test.ts`

**Step 1: 테스트 케이스 작성**

```typescript
// src/utils/sentenceMatcher.test.ts
import { findBestMatch } from './sentenceMatcher';

const testLibrary = [
    { id: 1, sentence: "탑승 수속 창구가 어디인가요?", gloss_sentence: "탑승 수속 창구 어디" },
    { id: 2, sentence: "비행기를 놓쳤어요.", gloss_sentence: "비행기 놓치다" }
];

describe('Airport Sentence Matching Test Harness', () => {
    test('음성 오인식 보정 테스트 (유사도 매칭)', () => {
        const input = "비행기 노쳤서요"; // 오타 및 유사 발음
        const { bestMatch, similarity } = findBestMatch(input, testLibrary);
        
        expect(bestMatch.id).toBe(2);
        expect(similarity).toBeGreaterThan(0.6);
    });
});
```

**Step 2: 테스트 하네스 실행**

```bash
npm run test
```

---

## 5단계: 배포 및 빌드 최적화

### Task 7: Vercel/Netlify 배포 및 빌드

**Objective:** 타입 컴파일 검증 및 최적화된 프로덕션 빌드를 수행합니다.

**Step 1: 빌드 실행**
```bash
npm run build
```

**Step 2: 최종 배포**
* `vercel --prod` 또는 Github Actions를 통한 자동 지속적 통합/배포 환경 연동.
