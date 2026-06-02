/**
 * src/utils/sentenceMatcher.ts
 * 한글 자모 분해 기반 Levenshtein 거리 계산으로
 * 캐시된 70개 공항 문장 중 가장 유사한 문장을 찾습니다.
 * (Supabase pgvector 매칭 실패 시 클라이언트 사이드 Fallback으로 동작)
 */

import type { AirportSentence, MatchResult } from '@/types/database';

// ─────────────────────────────────────────────
// 한글 자모 분해 유틸리티
// ─────────────────────────────────────────────
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSUNG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

/**
 * 한글 문자 하나를 자모 배열로 분해합니다.
 */
function decomposeChar(char: string): string[] {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return [char]; // 비한글 그대로
  const offset = code - 0xAC00;
  const jongIdx = offset % 28;
  const jungIdx = Math.floor(offset / 28) % 21;
  const choIdx = Math.floor(offset / 28 / 21);
  const result = [CHOSUNG[choIdx], JUNGSUNG[jungIdx]];
  if (jongIdx > 0) result.push(JONGSUNG[jongIdx]);
  return result;
}

/**
 * 문자열을 자모 단위로 분해합니다.
 */
function decomposeToJamo(text: string): string {
  return text
    .split('')
    .flatMap(decomposeChar)
    .join('');
}

// ─────────────────────────────────────────────
// Levenshtein 거리 계산
// ─────────────────────────────────────────────

/**
 * 두 문자열 간의 Levenshtein 거리를 계산합니다.
 * 메모리 최적화를 위해 1차원 배열 방식 사용.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // 삭제
        curr[j - 1] + 1,   // 삽입
        prev[j - 1] + cost // 대체
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// ─────────────────────────────────────────────
// 문장 매칭 메인 함수
// ─────────────────────────────────────────────

export interface MatchingResult {
  matched: AirportSentence;
  similarity: number; // 0.0 ~ 1.0
}

/**
 * 입력 텍스트와 공항 문장 라이브러리를 자모 기반 유사도로 비교합니다.
 * @param input     Whisper 인식 텍스트
 * @param library   캐시된 공항 표준 문장 배열
 * @returns         최고 유사도 문장 및 점수
 */
export function findBestMatch(
  input: string,
  library: AirportSentence[]
): MatchingResult {
  if (library.length === 0) {
    throw new Error('문장 라이브러리가 비어 있습니다.');
  }

  const inputJamo = decomposeToJamo(input.trim());

  let bestMatch = library[0];
  let minDistance = Infinity;

  for (const item of library) {
    const sentenceJamo = decomposeToJamo(item.sentence);
    const dist = levenshteinDistance(inputJamo, sentenceJamo);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = item;
    }
  }

  const maxLen = Math.max(
    inputJamo.length,
    decomposeToJamo(bestMatch.sentence).length
  );
  const similarity = maxLen === 0 ? 1 : 1 - minDistance / maxLen;

  return { matched: bestMatch, similarity };
}

/**
 * Supabase RPC 결과를 AirportSentence 타입으로 변환합니다.
 */
export function rpcResultToMatchResult(rpcRow: MatchResult): {
  sentence: string;
  gloss_sentence: string;
  similarity: number;
  category: string;
  english_translation?: string;
} {
  return {
    sentence: rpcRow.sentence,
    gloss_sentence: rpcRow.gloss_sentence,
    similarity: rpcRow.similarity,
    category: rpcRow.category,
    english_translation: rpcRow.english_translation,
  };
}
