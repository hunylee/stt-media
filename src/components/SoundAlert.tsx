'use client';

import React, { useEffect, useRef } from 'react';

interface SoundAlertProps {
  isLoud: boolean;
  volume: number;
  isActive: boolean;
}

export function SoundAlert({ isLoud, volume, isActive }: SoundAlertProps) {
  const prevLoudRef = useRef(false);

  useEffect(() => {
    if (isLoud && !prevLoudRef.current && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    prevLoudRef.current = isLoud;
  }, [isLoud]);

  if (!isActive) return null;

  return (
    <>
      {/* 화면 테두리 경고 플래시 */}
      {isLoud && (
        <div
          className="sound-alert-border"
          aria-live="assertive"
          aria-label={`주변 소리 감지됨 (볼륨: ${volume})`}
          role="alert"
        />
      )}

      {/* 소리 감지 배지 */}
      <div className={`sound-badge ${isLoud ? 'sound-badge--loud' : 'sound-badge--quiet'}`}>
        <span className="sound-badge-icon" aria-hidden="true">
          {isLoud ? '🔊' : '🔇'}
        </span>
        <div className="sound-badge-bars" aria-hidden="true">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="sound-bar"
              style={{
                height: `${Math.min(100, (volume / 100) * i * 20)}%`,
                opacity: volume > i * 15 ? 1 : 0.2,
                backgroundColor: isLoud ? '#ef4444' : '#22c55e',
              }}
            />
          ))}
        </div>
        <span className="sound-badge-label">
          {isLoud ? '소리 감지!' : '조용함'}
        </span>
      </div>
    </>
  );
}
