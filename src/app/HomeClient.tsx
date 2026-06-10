'use client';

/**
 * src/app/HomeClient.tsx
 * 청각장애인 공항 소통 도우미
 * - STT/마이크 완전 제거
 * - 문장 선택 → 화면에 크게 표시 → 직원에게 보여주기
 */

import React, { useEffect } from 'react';
import { usePhraseStore } from '@/store/subtitleStore';
import { DisplayPanel } from '@/components/DisplayPanel';
import { PhraseSelector } from '@/components/PhraseSelector';
import { AIRPORT_SENTENCES } from '@/data/airportData';
import { supabase } from '@/utils/supabase/client';
import type { AirportSentence } from '@/types/database';

export default function HomeClient() {
  const { setCachedSentences } = usePhraseStore();

  // 앱 시작 시 문장 데이터 로드
  useEffect(() => {
    // 1. 로컬 데이터로 즉시 초기화 (오프라인 대비)
    setCachedSentences(AIRPORT_SENTENCES as AirportSentence[]);

    // 2. Supabase에서 최신 데이터 비동기 로드
    async function loadSentences() {
      try {
        const { data, error } = await supabase
          .from('airport_sentences')
          .select(
            'id, category, sentence, gloss_sentence, english_translation, keywords, display_order, is_active, created_at, updated_at'
          )
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setCachedSentences(data as AirportSentence[]);
        }
      } catch {
        // 오프라인이면 로컬 데이터 유지
      }
    }

    loadSentences();
  }, [setCachedSentences]);

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-area">
            <span className="logo-icon">✈️</span>
            <div>
              <h1 className="logo-title">공항 소통 도우미</h1>
              <p className="logo-subtitle">Airport Communication Helper</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge-ko">한국어</span>
            <span className="badge-sign">수어글로스</span>
            <span className="badge-en">English</span>
          </div>
        </div>
      </header>

      {/* 메인: 상하 2분할 레이아웃 */}
      <main className="main-content">
        {/* 상단: 선택된 문장 표시 (직원이 읽는 영역) */}
        <section
          className="display-section"
          aria-label="선택된 문장 표시"
        >
          <DisplayPanel />
        </section>

        {/* 하단: 문장 선택 영역 */}
        <section
          className="selector-section"
          aria-label="문장 선택"
        >
          <PhraseSelector />
        </section>
      </main>
    </div>
  );
}
