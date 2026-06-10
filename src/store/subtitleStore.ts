/**
 * src/store/subtitleStore.ts
 * 청각장애인 공항 소통 도우미 — 전역 상태
 * STT 없음: 문장 수동 선택만 지원
 */

import { create } from 'zustand';
import type { AirportSentence, CategoryType } from '@/types/database';

export interface PhraseStore {
  // 선택된 문장 상태
  selectedSentence: string;
  selectedGloss: string;
  selectedEnglish: string;
  selectedCategory: CategoryType | null;

  // 로컬 캐시 (Supabase or 로컬 데이터)
  cachedSentences: AirportSentence[];

  // 액션
  setCachedSentences: (sentences: AirportSentence[]) => void;
  selectSentence: (sentence: AirportSentence) => void;
  clearSelection: () => void;
}

export const usePhraseStore = create<PhraseStore>((set) => ({
  selectedSentence: '',
  selectedGloss: '',
  selectedEnglish: '',
  selectedCategory: null,
  cachedSentences: [],

  setCachedSentences: (sentences) => set({ cachedSentences: sentences }),

  selectSentence: (sentence) =>
    set({
      selectedSentence: sentence.sentence,
      selectedGloss: sentence.gloss_sentence,
      selectedEnglish: sentence.english_translation ?? '',
      selectedCategory: sentence.category,
    }),

  clearSelection: () =>
    set({
      selectedSentence: '',
      selectedGloss: '',
      selectedEnglish: '',
      selectedCategory: null,
    }),
}));

// 하위 호환성 유지 (기존 훅이 useSubtitleStore를 참조하는 경우를 위해)
export { usePhraseStore as useSubtitleStore };
