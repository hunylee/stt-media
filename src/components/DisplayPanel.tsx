/**
 * src/components/DisplayPanel.tsx
 * 선택된 문장 표시 패널 — 공항 직원이 읽는 영역
 * 청각장애인이 스마트폰을 직원에게 보여주면 직원이 이 화면을 읽음
 */

'use client';

import React from 'react';
import { usePhraseStore } from '@/store/subtitleStore';
import { CATEGORY_LABELS } from '@/types/database';

export function DisplayPanel() {
  const {
    selectedSentence,
    selectedGloss,
    selectedEnglish,
    selectedCategory,
    clearSelection,
  } = usePhraseStore();

  const hasContent = selectedSentence.length > 0;

  return (
    <div className="display-panel" aria-live="polite" aria-label="선택된 문장 표시">
      {/* 카테고리 배지 + 초기화 버튼 */}
      <div className="display-panel__meta">
        {selectedCategory && (
          <span className="display-panel__category">
            {CATEGORY_LABELS[selectedCategory]}
          </span>
        )}
        {hasContent && (
          <button
            className="display-panel__clear"
            onClick={clearSelection}
            aria-label="선택 초기화"
            id="clear-selection-btn"
          >
            ✕ 초기화
          </button>
        )}
      </div>

      {hasContent ? (
        <>
          {/* 한국어 문장 — 메인, 매우 크게 */}
          <div className="display-panel__korean" lang="ko">
            {selectedSentence}
          </div>

          {/* 구분선 */}
          <div className="display-panel__divider" />

          {/* 수어 글로스 */}
          <div className="display-panel__gloss" aria-label="수어 글로스">
            <span className="display-panel__gloss-label">🤟 수어 글로스</span>
            <div className="display-panel__gloss-text">{selectedGloss}</div>
          </div>

          {/* 영어 번역 */}
          {selectedEnglish && (
            <div className="display-panel__english" lang="en">
              {selectedEnglish}
            </div>
          )}
        </>
      ) : (
        /* 빈 상태: 문장 선택 유도 */
        <div className="display-panel__empty">
          <div className="display-panel__empty-icon">👇</div>
          <p className="display-panel__empty-title">아래에서 문장을 선택하세요</p>
          <p className="display-panel__empty-hint">
            선택한 문장이 이 화면에 크게 표시됩니다.<br />
            공항 직원에게 화면을 보여주세요.
          </p>
        </div>
      )}
    </div>
  );
}
