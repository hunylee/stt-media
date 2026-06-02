'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SoundDetectorResult {
  volume: number;          // 0~100
  isLoud: boolean;         // 임계치 초과 여부
  waveform: number[];      // 파형 데이터 (32개 샘플)
  startDetecting: () => Promise<void>;
  stopDetecting: () => void;
  isActive: boolean;
}

const THRESHOLD = 20; // 볼륨 임계치 (0~100)
const WAVEFORM_SIZE = 32;

export function useSoundDetector(): SoundDetectorResult {
  const [volume, setVolume] = useState(0);
  const [isLoud, setIsLoud] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(new Array(WAVEFORM_SIZE).fill(0));
  const [isActive, setIsActive] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopDetecting = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setVolume(0);
    setIsLoud(false);
    setWaveform(new Array(WAVEFORM_SIZE).fill(0));
  }, []);

  const startDetecting = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsActive(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const waveformArray = new Uint8Array(WAVEFORM_SIZE);

      const tick = () => {
        if (!analyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(waveformArray);

        // RMS 볼륨 계산
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const vol = Math.min(100, Math.round((rms / 128) * 100));

        // 파형 정규화 (-1 ~ 1 → 0 ~ 100)
        const wf = Array.from(waveformArray).map(v => Math.round(((v - 128) / 128) * 50 + 50));

        setVolume(vol);
        setIsLoud(vol > THRESHOLD);
        setWaveform(wf);

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('마이크 접근 실패:', err);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDetecting();
    };
  }, [stopDetecting]);

  return { volume, isLoud, waveform, startDetecting, stopDetecting, isActive };
}
