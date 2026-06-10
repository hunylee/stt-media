'use client';

import React, { useEffect, useRef } from 'react';

interface SubtitleDisplayProps {
  rawText: string;
  matchedSentence: string;
  glossText: string;
  similarity: number;
  isListening: boolean;
  isProcessing?: boolean;
}

export function SubtitleDisplay({
  rawText,
  matchedSentence,
  glossText,
  similarity,
  isListening,
  isProcessing = false,
}: SubtitleDisplayProps) {
  const glossRef = useRef<HTMLParagraphElement>(null);

  // 새 글로스가 나타날 때 살짝 애니메이션 트리거
  useEffect(() => {
    if (glossRef.current && glossText) {
      glossRef.current.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 300, easing: 'ease-out', fill: 'forwards' }
      );
    }
  }, [glossText]);

  const displaySentence = matchedSentence || rawText;
  const hasContent = !!displaySentence;
  const showMatch = similarity >= 0.5 && !!matchedSentence;

  return (
    <div className="subtitle-card">
      {/* 상태 헤더 */}
      <div className="subtitle-status-row">
        <span className="subtitle-label">
          {isListening ? (
            <>
              <span className="pulse-dot" />
              실시간 자막
            </>
          ) : (
            '대기 중'
          )}
        </span>
        {showMatch && (
          <span className="match-badge">
            ✓ 매칭 {Math.round(similarity * 100)}%
          </span>
        )}
      </div>

      {/* 구어체 한국어 자막 영역 */}
      <div className="korean-subtitle-area">
        <p className="subtitle-section-label">🗣 일반 자막 (구어체 한국어)</p>
        <p className={`korean-text ${!hasContent ? 'placeholder' : ''}`}>
          {isProcessing ? (
            <span className="processing-dots">
              <span>●</span><span>●</span><span>●</span>
            </span>
          ) : (
            displaySentence || (isListening ? '말씀해 주세요...' : '마이크를 켜서 시작하세요')
          )}
        </p>
        {rawText && rawText !== matchedSentence && matchedSentence && (
          <p className="raw-text-hint">인식: &quot;{rawText}&quot;</p>
        )}
      </div>

      {/* 구분선 */}
      <div className="subtitle-divider" />

      {/* 수어 글로스 자막 영역 */}
      <div className="gloss-subtitle-area">
        <p className="subtitle-section-label gloss-label">🤟 수어 글로스 (농인 직관형)</p>
        <p
          ref={glossRef}
          className={`gloss-text ${!glossText ? 'placeholder' : ''}`}
        >
          {glossText || (isListening ? '수어 글로스 대기 중...' : '—')}
        </p>

        {/* 글로스 단어 태그 표시 */}
        {glossText && (
          <div className="gloss-tags">
            {glossText.split(' ').map((word, i) => (
              <span key={i} className="gloss-tag">
                {word}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
