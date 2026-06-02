/**
 * src/store/subtitleStore.ts
 * Zustand 기반 전역 상태 관리
 * - 자막 상태, 마이크 상태, 캐시 데이터를 한 곳에서 관리
 */

import { create } from 'zustand';
import type { SubtitleStore, AirportSentence, CategoryType } from '@/types/database';

const initialSubtitleState = {
  rawText: '',
  matchedSentence: '',
  glossText: '',
  englishText: '',
  category: null as CategoryType | null,
  similarity: 0,
  fallbackType: null as SubtitleStore['fallbackType'],
};

export const useSubtitleStore = create<SubtitleStore>((set) => ({
  // ── 초기 상태 ──────────────────────────────
  ...initialSubtitleState,
  isListening: false,
  isLoading: false,
  connectionStatus: 'online',
  error: null,
  cachedSentences: [],

  // ── 액션 ──────────────────────────────────
  setRawText: (text) => set({ rawText: text }),

  setMatchResult: (result) =>
    set({
      matchedSentence: result.matchedSentence,
      glossText: result.glossText,
      englishText: result.englishText,
      category: result.category,
      similarity: result.similarity,
      fallbackType: result.fallbackType,
    }),

  setIsListening: (v) => set({ isListening: v }),
  setIsLoading: (v) => set({ isLoading: v }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  setError: (e) => set({ error: e }),
  setCachedSentences: (sentences) => set({ cachedSentences: sentences }),

  /** 퀵시트에서 수동으로 문장 선택 시 즉시 자막 반영 */
  setManualSentence: (sentence: AirportSentence) =>
    set({
      rawText: sentence.sentence,
      matchedSentence: sentence.sentence,
      glossText: sentence.gloss_sentence,
      englishText: sentence.english_translation ?? '',
      category: sentence.category,
      similarity: 1.0,
      fallbackType: 'manual',
      isLoading: false,
      error: null,
    }),

  /** 자막 상태 초기화 (마이크 정지 시 등) */
  reset: () => set(initialSubtitleState),
}));
