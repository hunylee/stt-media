'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useVoiceRecognizer } from '@/hooks/useVoiceRecognizer';
import { useSentenceMatcher } from '@/hooks/useSentenceMatcher';
import { useSubtitleStore } from '@/store/subtitleStore';
import { SubtitleViewer } from '@/components/SubtitleViewer';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { MicButton } from '@/components/MicButton';
import { CategoryQuickSheet } from '@/components/CategoryQuickSheet';

/**
 * HomeClient — 브라우저 전용 앱 로직
 * page.tsx에서 dynamic({ ssr: false })로 import되어
 * 서버에서 렌더되지 않으므로 hydration 불일치 없음
 */
export default function HomeClient() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [micStatus, setMicStatus] = useState<
    'idle' | 'listening' | 'processing' | 'fallback'
  >('idle');
  const isListeningRef = useRef(false);

  const { setIsListening, setConnectionStatus, setError, reset } =
    useSubtitleStore();
  const { match } = useSentenceMatcher();

  const handleTranscript = useCallback(
    (text: string, processingMs: number) => {
      match(text, processingMs);
    },
    [match]
  );

  const handleVolume = useCallback((rms: number) => {
    setVolume(rms);
  }, []);

  const handleError = useCallback(
    (error: string) => {
      setError(error);
      if (error.includes('오프라인')) {
        setConnectionStatus('degraded');
      }
    },
    [setError, setConnectionStatus]
  );

  const handleStatusChange = useCallback(
    (status: 'idle' | 'listening' | 'processing' | 'fallback') => {
      setMicStatus(status);
      setIsListening(status === 'listening' || status === 'processing');
      if (status === 'fallback') setConnectionStatus('degraded');
    },
    [setIsListening, setConnectionStatus]
  );

  const { startListening, stopListening, isSupported } = useVoiceRecognizer({
    onTranscript: handleTranscript,
    onVolume: handleVolume,
    onError: handleError,
    onStatusChange: handleStatusChange,
  });

  const handleMicToggle = useCallback(async () => {
    if (isListeningRef.current) {
      isListeningRef.current = false;
      stopListening();
      reset();
      setVolume(0);
    } else {
      isListeningRef.current = true;
      reset();
      await startListening();
    }
  }, [startListening, stopListening, reset]);

  const isListening = micStatus === 'listening' || micStatus === 'processing';
  const isLoading = micStatus === 'processing';

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-area">
            <span className="logo-icon">✈️</span>
            <div>
              <h1 className="logo-title">Airport STT</h1>
              <p className="logo-subtitle">공항 실시간 자막 서비스</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge-ko">한국어</span>
            <span className="badge-sign">수어글로스</span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        {/* 자막 뷰어 */}
        <section className="subtitle-section" aria-label="실시간 자막">
          <SubtitleViewer />
        </section>

        {/* 오디오 시각화 */}
        <section className="visualizer-section" aria-label="오디오 입력 표시">
          <AudioVisualizer volume={volume} isListening={isListening} />
        </section>

        {/* 마이크 컨트롤 */}
        <section className="controls-section">
          {isSupported ? (
            <MicButton
              isListening={isListening}
              isLoading={isLoading}
              onToggle={handleMicToggle}
              status={micStatus}
            />
          ) : (
            <div className="unsupported-notice">
              이 브라우저는 마이크를 지원하지 않습니다.
            </div>
          )}
        </section>

        {/* 퀵 시트 열기 버튼 */}
        <section className="quicksheet-trigger-section">
          <button
            className="quicksheet-trigger-btn"
            onClick={() => setIsSheetOpen(true)}
            id="open-quicksheet-btn"
            aria-haspopup="dialog"
          >
            <span>📋</span>
            <span>공항 문장 목록</span>
            <span className="trigger-arrow">↑</span>
          </button>
          <p className="quicksheet-hint">
            소음이 심한 경우 문장을 직접 선택할 수 있습니다
          </p>
        </section>
      </main>

      {/* 퀵 시트 드로어 */}
      <CategoryQuickSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}
