/**
 * src/components/AudioVisualizer.tsx
 * 실시간 마이크 볼륨 파형 시각화 컴포넌트
 */

'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  volume: number; // RMS 0.0 ~ 1.0
  isListening: boolean;
}

const BAR_COUNT = 20;

export function AudioVisualizer({ volume, isListening }: AudioVisualizerProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const offset = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
      const noise = Math.random() * 0.3;
      const height = isListening
        ? Math.max(4, (1 - offset * 0.5) * volume * 100 + noise * volume * 50)
        : 4;
      bar.style.height = `${height}%`;
    });
  }, [volume, isListening]);

  return (
    <div className="visualizer-container" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className={`visualizer-bar ${isListening ? 'active' : ''}`}
          style={{ transitionDelay: `${i * 20}ms` }}
          suppressHydrationWarning
        />
      ))}
    </div>
  );
}
