/**
 * src/components/PhraseSelector.tsx
 * 공항 문장 선택 패널 — 항상 화면에 표시
 * - 카테고리 탭
 * - 텍스트 검색 필터
 * - 큰 터치 타겟 카드 (청각장애인 사용)
 */

'use client';

import React, { useState, useMemo } from 'react';
import { usePhraseStore } from '@/store/subtitleStore';
import { CATEGORY_LABELS, type CategoryType } from '@/types/database';

export function PhraseSelector() {
  const { cachedSentences, selectSentence } = usePhraseStore();
  const [activeCategory, setActiveCategory] = useState<CategoryType>('BOARDING');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Object.keys(CATEGORY_LABELS) as CategoryType[];

  // 검색 + 카테고리 필터
  const filteredSentences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cachedSentences.filter((s) => {
      if (!s.is_active) return false;
      if (q) {
        // 검색 시 카테고리 무시, 전체에서 검색
        return (
          s.sentence.toLowerCase().includes(q) ||
          s.gloss_sentence.toLowerCase().includes(q) ||
          (s.english_translation ?? '').toLowerCase().includes(q) ||
          s.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }
      return s.category === activeCategory;
    });
  }, [cachedSentences, activeCategory, searchQuery]);

  const handleCategoryClick = (cat: CategoryType) => {
    setActiveCategory(cat);
    setSearchQuery(''); // 탭 변경 시 검색어 초기화
  };

  return (
    <div className="phrase-selector" aria-label="공항 문장 선택">
      {/* 검색창 */}
      <div className="phrase-search">
        <span className="phrase-search__icon" aria-hidden="true">🔍</span>
        <input
          id="phrase-search-input"
          type="search"
          className="phrase-search__input"
          placeholder="문장 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="문장 검색"
        />
        {searchQuery && (
          <button
            className="phrase-search__clear"
            onClick={() => setSearchQuery('')}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {/* 카테고리 탭 — 검색 중에는 흐리게 */}
      {!searchQuery && (
        <div className="phrase-categories" role="tablist" aria-label="카테고리">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`phrase-category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
              id={`category-tab-${cat}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 카운트 */}
      {searchQuery && (
        <p className="phrase-search-count">
          &quot;{searchQuery}&quot; 검색 결과 {filteredSentences.length}건
        </p>
      )}

      {/* 문장 카드 목록 */}
      <div
        className="phrase-list"
        role={searchQuery ? 'list' : 'tabpanel'}
        aria-labelledby={!searchQuery ? `category-tab-${activeCategory}` : undefined}
      >
        {filteredSentences.length === 0 ? (
          <div className="phrase-empty">
            <span className="phrase-empty__icon">🔎</span>
            <p>
              {searchQuery
                ? `&quot;${searchQuery}&quot;에 해당하는 문장이 없습니다.`
                : '이 카테고리에 문장이 없습니다.'}
            </p>
          </div>
        ) : (
          filteredSentences.map((sentence) => (
            <button
              key={sentence.id}
              className="phrase-card"
              onClick={() => selectSentence(sentence)}
              id={`phrase-card-${sentence.id}`}
              role="listitem"
              aria-label={`${sentence.sentence} 선택`}
            >
              {/* 카테고리 배지 (검색 시에만 표시) */}
              {searchQuery && (
                <span className="phrase-card__category-tag">
                  {CATEGORY_LABELS[sentence.category]}
                </span>
              )}

              {/* 한국어 문장 */}
              <span className="phrase-card__korean">{sentence.sentence}</span>

              {/* 수어 글로스 */}
              <span className="phrase-card__gloss">{sentence.gloss_sentence}</span>

              {/* 영어 */}
              {sentence.english_translation && (
                <span className="phrase-card__english">
                  {sentence.english_translation}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
