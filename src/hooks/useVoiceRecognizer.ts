/**
 * src/hooks/useVoiceRecognizer.ts
 * 실시간 오디오 캡처 훅
 * - AudioWorklet 기반 16kHz 단채널 PCM 캡처
 * - 3초 단위 WAV 청크 생성 → /api/transcribe 전송
 * - 오프라인 시 Web Speech API 자동 전환
 */

'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { encodeToWAV } from '@/utils/wavEncoder';
import type { TranscribeResponse } from '@/types/database';

interface UseVoiceRecognizerOptions {
  onTranscript: (text: string, processingTimeMs: number) => void;
  onVolume?: (rms: number) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'listening' | 'processing' | 'fallback') => void;
}

interface UseVoiceRecognizerReturn {
  startListening: () => Promise<void>;
  stopListening: () => void;
  isSupported: boolean;
}

// 지수 백오프 재시도 (Whisper API Rate Limit 대응)
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('최대 재시도 횟수 초과');
}

export function useVoiceRecognizer({
  onTranscript,
  onVolume,
  onError,
  onStatusChange,
}: UseVoiceRecognizerOptions): UseVoiceRecognizerReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsRecognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);

  // isSupported: SSR 시 false, 클라이언트 마운트 후 실제 가용성 확인
  // (렌더 시점 직접 navigator 사용 금지 — hydration 불일치 방지)
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  // ── Web Speech API Fallback ─────────────────────────────
  const startWebSpeechFallback = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      onError?.('브라우저가 음성인식을 지원하지 않습니다.');
      return;
    }

    onStatusChange?.('fallback');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SpeechRecognitionAPI() as any;
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'ko-KR';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        onTranscript(last[0].transcript, 0);
      }
    };

    rec.onerror = () => onError?.('음성인식 오류가 발생했습니다.');
    wsRecognitionRef.current = rec;
    rec.start();
  }, [onTranscript, onError, onStatusChange]);

  // ── WAV 청크 → Whisper API 전송 ────────────────────────
  const sendChunkToWhisper = useCallback(
    async (samples: Float32Array) => {
      if (isProcessingRef.current) return; // 이전 요청 완료 전 중복 방지
      isProcessingRef.current = true;
      onStatusChange?.('processing');

      try {
        const wavBlob = encodeToWAV(samples, 16000);
        const formData = new FormData();
        formData.append('file', wavBlob, 'audio.wav');

        const response = await withRetry(async () => {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.status === 429) {
            throw new Error('RATE_LIMIT');
          }

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? `HTTP ${res.status}`);
          }

          return res;
        });

        const data: TranscribeResponse = await response.json();

        if (data.transcript && data.transcript.trim().length > 0) {
          onTranscript(data.transcript.trim(), data.processingTimeMs);
        }

        onStatusChange?.('listening');
      } catch (error) {
        console.error('[useVoiceRecognizer] Whisper 오류, fallback 전환:', error);
        onError?.('⚠️ 오프라인 모드로 전환됩니다.');
        stopListening();
        startWebSpeechFallback();
      } finally {
        isProcessingRef.current = false;
      }
    },
    [onTranscript, onError, onStatusChange, startWebSpeechFallback] // eslint-disable-line
  );

  // ── AudioWorklet 시작 ────────────────────────────────────
  const startListening = useCallback(async () => {
    if (isListeningRef.current) return;

    try {
      // 마이크 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // AudioContext 생성 (16kHz 고정)
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      // AudioWorklet 모듈 로드
      await ctx.audioWorklet.addModule('/audio-processor.js');

      // 소스 → WorkletNode 연결
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const workletNode = new AudioWorkletNode(ctx, 'audio-processor');
      workletNodeRef.current = workletNode;

      // WorkletNode 메시지 수신
      workletNode.port.onmessage = (event: MessageEvent) => {
        const { type, samples, rms } = event.data;

        if (type === 'volume' && onVolume) {
          onVolume(rms as number);
        }

        if (type === 'chunk' && samples instanceof Float32Array) {
          sendChunkToWhisper(samples);
        }
      };

      source.connect(workletNode);
      workletNode.connect(ctx.destination); // 모니터링 off (mute)
      workletNode.connect(ctx.createGain()); // 무음 출력

      isListeningRef.current = true;
      onStatusChange?.('listening');
    } catch (err) {
      console.error('[useVoiceRecognizer] 마이크 오류:', err);

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        onError?.('마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
      } else {
        onError?.('마이크를 시작할 수 없습니다.');
        startWebSpeechFallback();
      }
    }
  }, [sendChunkToWhisper, onVolume, onError, onStatusChange, startWebSpeechFallback]);

  // ── 정지 ────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    isProcessingRef.current = false;

    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    wsRecognitionRef.current?.stop();
    wsRecognitionRef.current = null;

    onStatusChange?.('idle');
  }, [onStatusChange]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { startListening, stopListening, isSupported };
}
