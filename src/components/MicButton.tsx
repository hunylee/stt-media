/**
 * src/components/MicButton.tsx
 * 마이크 토글 버튼 컴포넌트
 * - 누르는 동안 녹음 (Push-to-talk 모드)
 * - 클릭으로 토글 (기본 모드)
 */

'use client';

import React from 'react';

interface MicButtonProps {
  isListening: boolean;
  isLoading: boolean;
  onToggle: () => void;
  status: 'idle' | 'listening' | 'processing' | 'fallback';
}

export function MicButton({ isListening, isLoading, onToggle, status }: MicButtonProps) {
  return (
    <div className="mic-button-wrapper">
      <button
        onClick={onToggle}
        disabled={isLoading && !isListening}
        className={`mic-button ${isListening ? 'listening' : ''} ${status === 'processing' ? 'processing' : ''}`}
        aria-label={isListening ? '마이크 중지' : '마이크 시작'}
        aria-pressed={isListening}
        id="mic-toggle-btn"
      >
        {/* 펄스 링 */}
        {isListening && (
          <>
            <span className="pulse-ring pulse-ring-1" />
            <span className="pulse-ring pulse-ring-2" />
          </>
        )}

        {/* 아이콘 */}
        <span className="mic-icon">
          {status === 'processing' ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : isListening ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </span>
      </button>

      {/* 상태 라벨 */}
      <span className="mic-status-label">
        {status === 'idle' && '마이크 시작'}
        {status === 'listening' && '듣는 중...'}
        {status === 'processing' && 'Whisper 분석 중...'}
        {status === 'fallback' && '브라우저 STT 모드'}
      </span>
    </div>
  );
}
