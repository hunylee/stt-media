/**
 * src/hooks/useSentenceMatcher.ts
 * 문장 유사도 매칭 오케스트레이터
 * 1순위: Supabase pgvector 코사인 유사도 (≥ 0.75)
 * 2순위: 클라이언트 Levenshtein Fallback
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { findBestMatch } from '@/utils/sentenceMatcher';
import { convertToGloss } from '@/utils/glossEngine';
import { useSubtitleStore } from '@/store/subtitleStore';
import { AIRPORT_SENTENCES } from '@/data/airportData';
import type { AirportSentence, EmbedResponse, MatchResult } from '@/types/database';

const SIMILARITY_THRESHOLD = 0.75;

export function useSentenceMatcher() {
  const {
    cachedSentences,
    setCachedSentences,
    setRawText,
    setMatchResult,
    setIsLoading,
    setError,
  } = useSubtitleStore();

  // 동일 텍스트 중복 매칭 방지
  const lastMatchedTextRef = useRef<string>('');

  // ── 앱 초기화 시 전체 문장 캐싱 ────────────────────────
  useEffect(() => {
    if (cachedSentences.length > 0) return;

    // 로컬 데이터로 즉시 초기화 (오프라인 대비)
    setCachedSentences(AIRPORT_SENTENCES as AirportSentence[]);

    // Supabase에서 최신 데이터 로드 (비동기)
    async function loadSentences() {
      const { data, error } = await supabase
        .from('airport_sentences')
        .select('id, category, sentence, gloss_sentence, english_translation, keywords, display_order, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.warn('[useSentenceMatcher] Supabase 로드 실패, 로컬 데이터 유지:', error.message);
        return;
      }

      if (data && data.length > 0) {
        setCachedSentences(data as AirportSentence[]);
      }
    }

    loadSentences();
  }, [cachedSentences.length, setCachedSentences]);

  // ── Supabase pgvector 매칭 ───────────────────────────────
  const matchViaSupabase = useCallback(
    async (text: string): Promise<MatchResult | null> => {
      try {
        // 1. 텍스트 → 임베딩 벡터
        const embedRes = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!embedRes.ok) return null;

        const { embedding }: EmbedResponse = await embedRes.json();

        // 2. Supabase RPC 호출
        const { data, error } = await supabase.rpc('match_airport_sentence', {
          query_embedding: embedding,
          match_threshold: SIMILARITY_THRESHOLD,
          match_count: 1,
        });

        if (error || !data || data.length === 0) return null;

        return data[0] as MatchResult;
      } catch {
        return null;
      }
    },
    []
  );

  // ── 로그 비동기 저장 ──────────────────────────────────────
  const saveLog = useCallback(
    async (
      rawText: string,
      matchedId: number | null,
      similarity: number,
      fallbackType: string | null,
      processingTimeMs: number
    ) => {
      await supabase.from('recognition_logs').insert({
        raw_text: rawText,
        matched_sentence_id: matchedId,
        similarity_score: similarity,
        fallback_type: fallbackType,
        processing_time_ms: processingTimeMs,
        client_device:
          typeof window !== 'undefined'
            ? window.innerWidth < 768
              ? 'mobile'
              : 'desktop'
            : 'unknown',
      });
    },
    []
  );

  // ── 메인 매칭 함수 ────────────────────────────────────────
  const match = useCallback(
    async (rawText: string, whisperProcessingMs = 0) => {
      if (!rawText.trim()) return;

      // 동일 텍스트 연속 입력 시 API 콜 스킵 (네트워크 저감)
      if (rawText.trim() === lastMatchedTextRef.current) return;
      lastMatchedTextRef.current = rawText.trim();

      const startTime = Date.now();
      setRawText(rawText);
      setIsLoading(true);
      setError(null);

      try {
        // 1순위: Supabase pgvector
        const rpcResult = await matchViaSupabase(rawText);

        if (rpcResult && rpcResult.similarity >= SIMILARITY_THRESHOLD) {
          const glossText =
            rpcResult.gloss_sentence || convertToGloss(rpcResult.sentence);

          setMatchResult({
            matchedSentence: rpcResult.sentence,
            glossText,
            englishText: rpcResult.english_translation ?? '',
            category: rpcResult.category,
            similarity: rpcResult.similarity,
            fallbackType: null,
          });

          saveLog(
            rawText,
            rpcResult.id,
            rpcResult.similarity,
            null,
            Date.now() - startTime + whisperProcessingMs
          );
          return;
        }

        // 2순위: Levenshtein Fallback (캐시된 문장 사용)
        if (cachedSentences.length > 0) {
          const { matched, similarity } = findBestMatch(rawText, cachedSentences);
          const glossText =
            matched.gloss_sentence || convertToGloss(matched.sentence);

          setMatchResult({
            matchedSentence: matched.sentence,
            glossText,
            englishText: matched.english_translation ?? '',
            category: matched.category,
            similarity,
            fallbackType: 'levenshtein',
          });

          saveLog(
            rawText,
            matched.id,
            similarity,
            'levenshtein',
            Date.now() - startTime + whisperProcessingMs
          );
        } else {
          // 캐시도 없으면 원문 그대로 표시
          setMatchResult({
            matchedSentence: rawText,
            glossText: convertToGloss(rawText),
            englishText: '',
            category: null,
            similarity: 0,
            fallbackType: 'levenshtein',
          });
        }
      } catch (error) {
        console.error('[useSentenceMatcher] 매칭 오류:', error);
        setError('매칭 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [matchViaSupabase, cachedSentences, setRawText, setMatchResult, setIsLoading, setError, saveLog]
  );

  return { match, cachedSentences };
}
