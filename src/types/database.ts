// src/types/database.ts
// Supabase DB 스키마에 대응하는 TypeScript 타입 정의
// AI 백엔드: Gemini 2.0 Flash (STT) + text-embedding-004 (임베딩 768차원)

export type CategoryType =
  | 'BOARDING'    // 탑승수속
  | 'IMMIGRATION' // 입국심사
  | 'BAGGAGE'     // 수하물
  | 'DUTY_FREE'   // 면세점
  | 'TRANSPORT'   // 교통
  | 'FACILITY'    // 편의시설
  | 'MEDICAL'     // 의료
  | 'LOST';       // 분실물

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  BOARDING: '탑승수속',
  IMMIGRATION: '입국심사',
  BAGGAGE: '수하물',
  DUTY_FREE: '면세점',
  TRANSPORT: '교통',
  FACILITY: '편의시설',
  MEDICAL: '의료',
  LOST: '분실물',
};

export interface AirportSentence {
  id: number;
  category: CategoryType;
  sentence: string;
  gloss_sentence: string;
  english_translation?: string;
  keywords: string[];
  display_order: number;
  is_active: boolean;
  // embedding은 클라이언트 쿼리 시 보통 제외 (select 지정)
  // Gemini text-embedding-004 → 768차원
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface RecognitionLog {
  id: string;
  session_id?: string;
  raw_text: string;
  matched_sentence_id?: number;
  fallback_type?: 'levenshtein' | 'webspeech' | 'manual' | null;
  similarity_score?: number;
  processing_time_ms?: number;
  client_device?: string;
  user_confirmed: boolean;
  created_at: string;
}

export interface AudioSession {
  id: string;
  session_token: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser_ua?: string;
  locale: string;
  total_recognitions: number;
  successful_matches: number;
  started_at: string;
  ended_at?: string;
}

export interface UserFeedback {
  id: string;
  log_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  corrected_sentence?: string;
  created_at: string;
}

// Supabase RPC match_airport_sentence 반환 타입
export interface MatchResult {
  id: number;
  category: CategoryType;
  sentence: string;
  gloss_sentence: string;
  english_translation?: string;
  similarity: number;
}

// /api/transcribe 응답 타입 (Gemini 2.0 Flash)
export interface TranscribeResponse {
  transcript: string;
  processingTimeMs: number;
  model?: string; // 예: 'gemini-2.0-flash'
}

// /api/embed 응답 타입 (Gemini text-embedding-004, 768차원)
export interface EmbedResponse {
  embedding: number[];
  dimensions?: number; // 768
  model?: string;      // 예: 'text-embedding-004'
}

// useSentenceMatcher 상태 타입
export interface MatcherState {
  rawText: string;
  matchedSentence: string;
  glossText: string;
  englishText: string;
  category: CategoryType | null;
  similarity: number;
  fallbackType: RecognitionLog['fallback_type'];
  isLoading: boolean;
  error: string | null;
}

// Zustand 스토어 타입
export interface SubtitleStore {
  // 상태
  rawText: string;
  matchedSentence: string;
  glossText: string;
  englishText: string;
  category: CategoryType | null;
  similarity: number;
  fallbackType: RecognitionLog['fallback_type'];
  isListening: boolean;
  isLoading: boolean;
  connectionStatus: 'online' | 'offline' | 'degraded';
  error: string | null;
  cachedSentences: AirportSentence[];

  // 액션
  setRawText: (text: string) => void;
  setMatchResult: (result: Omit<MatcherState, 'rawText' | 'isLoading' | 'error'>) => void;
  setIsListening: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  setConnectionStatus: (s: SubtitleStore['connectionStatus']) => void;
  setError: (e: string | null) => void;
  setCachedSentences: (sentences: AirportSentence[]) => void;
  setManualSentence: (sentence: AirportSentence) => void;
  reset: () => void;
}
