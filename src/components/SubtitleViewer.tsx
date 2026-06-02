/**
 * src/components/SubtitleViewer.tsx
 * 이중 자막 뷰어 컴포넌트
 * - 상단: 구어체 한국어 자막 (white, 24px)
 * - 하단: 수어 글로스 자막 (lime-300, 36px Bold)
 * - 영어 병행 표시 옵션
 */

'use client';

import React from 'react';
import { useSubtitleStore } from '@/store/subtitleStore';
import { CATEGORY_LABELS } from '@/types/database';

export function SubtitleViewer() {
  const {
    rawText,
    matchedSentence,
    glossText,
    englishText,
    category,
    similarity,
    fallbackType,
    isLoading,
    connectionStatus,
  } = useSubtitleStore();

  const hasContent = matchedSentence.length > 0 || rawText.length > 0;
  const displaySentence = matchedSentence || rawText;
  const displayGloss = glossText || '수어 글로스 대기 중...';

  const similarityPercent = Math.round(similarity * 100);
  const isHighMatch = similarity >= 0.75;
  const isMediumMatch = similarity >= 0.5 && similarity < 0.75;

  return (
    <div className="subtitle-viewer">
      {/* 상태 헤더 */}
      <div className="subtitle-header">
        <div className="status-row">
          {/* 연결 상태 */}
          <span className={`connection-dot ${connectionStatus}`} />
          <span className="status-label">
            {connectionStatus === 'online' && '실시간 인식'}
            {connectionStatus === 'degraded' && '오프라인 모드'}
            {connectionStatus === 'offline' && '연결 끊김'}
          </span>

          {/* Fallback 뱃지 */}
          {fallbackType === 'levenshtein' && (
            <span className="badge badge-warn">자동보정</span>
          )}
          {fallbackType === 'webspeech' && (
            <span className="badge badge-warn">브라우저STT</span>
          )}
          {fallbackType === 'manual' && (
            <span className="badge badge-info">수동선택</span>
          )}
        </div>

        {/* 카테고리 + 유사도 */}
        <div className="meta-row">
          {category && (
            <span className="category-badge">
              {CATEGORY_LABELS[category]}
            </span>
          )}
          {similarity > 0 && (
            <span
              className={`similarity-badge ${
                isHighMatch ? 'high' : isMediumMatch ? 'medium' : 'low'
              }`}
            >
              {similarityPercent}%
            </span>
          )}
        </div>
      </div>

      {/* 구어체 자막 영역 */}
      <div className="korean-subtitle-area">
        <p className="subtitle-label">📢 한국어 자막</p>
        <div className={`korean-text ${isLoading ? 'pulsing' : ''}`}>
          {isLoading ? (
            <span className="loading-dots">인식 중</span>
          ) : hasContent ? (
            displaySentence
          ) : (
            <span className="placeholder-text">
              마이크 버튼을 눌러 말씀해 주세요
            </span>
          )}
        </div>
        {rawText && rawText !== matchedSentence && matchedSentence && (
          <p className="raw-text-hint">원문: &ldquo;{rawText}&rdquo;</p>
        )}
      </div>

      {/* 구분선 */}
      <div className="divider" />

      {/* 수어 글로스 영역 */}
      <div className="gloss-area">
        <p className="gloss-label">🤟 수어 글로스</p>
        <div className={`gloss-text ${!hasContent ? 'muted' : ''}`}>
          {isLoading ? (
            <span className="loading-dots">변환 중</span>
          ) : hasContent ? (
            displayGloss
          ) : (
            '—'
          )}
        </div>
        {/* 영어 병행 */}
        {englishText && (
          <p className="english-text">{englishText}</p>
        )}
      </div>
    </div>
  );
}
