/**
 * src/components/CategoryQuickSheet.tsx
 * 공항 문장 카테고리별 퀵 시트 드로어
 * - 하단에서 슬라이드업
 * - 카테고리 탭 + 문장 그리드
 * - 클릭 시 즉시 자막 표출
 */

'use client';

import React, { useState } from 'react';
import { useSubtitleStore } from '@/store/subtitleStore';
import { CATEGORY_LABELS, type CategoryType } from '@/types/database';

interface CategoryQuickSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryQuickSheet({ isOpen, onClose }: CategoryQuickSheetProps) {
  const { cachedSentences, setManualSentence } = useSubtitleStore();
  const [activeCategory, setActiveCategory] = useState<CategoryType>('BOARDING');

  // 현재 카테고리의 문장들
  const filteredSentences = cachedSentences.filter(
    (s) => s.category === activeCategory && s.is_active
  );

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];

  const handleSentenceSelect = (sentenceId: number) => {
    const sentence = cachedSentences.find((s) => s.id === sentenceId);
    if (sentence) {
      setManualSentence(sentence);
      onClose();
    }
  };

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="sheet-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 드로어 */}
      <div
        className={`quick-sheet ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="공항 문장 퀵 시트"
        aria-modal="true"
      >
        {/* 핸들 */}
        <div className="sheet-handle" />

        {/* 헤더 */}
        <div className="sheet-header">
          <h2 className="sheet-title">빠른 문장 선택</h2>
          <button
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="닫기"
            id="sheet-close-btn"
          >
            ✕
          </button>
        </div>

        {/* 카테고리 탭 */}
        <div className="category-tabs" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              id={`tab-${cat}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 문장 목록 */}
        <div
          className="sentence-grid"
          role="tabpanel"
          aria-labelledby={`tab-${activeCategory}`}
        >
          {filteredSentences.length === 0 ? (
            <div className="empty-state">
              <p>이 카테고리에 문장이 없습니다.</p>
              <p className="empty-hint">Supabase에 데이터를 먼저 시딩해주세요.</p>
            </div>
          ) : (
            filteredSentences.map((sentence) => (
              <button
                key={sentence.id}
                className="sentence-card"
                onClick={() => handleSentenceSelect(sentence.id)}
                id={`sentence-card-${sentence.id}`}
              >
                <span className="sentence-ko">{sentence.sentence}</span>
                <span className="sentence-gloss">{sentence.gloss_sentence}</span>
                {sentence.english_translation && (
                  <span className="sentence-en">{sentence.english_translation}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
