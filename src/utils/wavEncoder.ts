/**
 * src/utils/wavEncoder.ts
 * Float32Array PCM 샘플을 WAV Blob으로 인코딩합니다.
 * Whisper API는 WAV, MP3, FLAC 등을 지원하며, WAV가 가장 단순합니다.
 */

/**
 * WAV 파일 헤더를 생성합니다.
 */
function createWavHeader(
  numSamples: number,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): ArrayBuffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);     // 파일 크기
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);                // fmt 청크 크기
  view.setUint16(20, 1, true);                 // PCM 포맷
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  return buffer;
}

/**
 * Float32 샘플을 16-bit Int16으로 변환합니다.
 */
function float32ToInt16(samples: Float32Array): Int16Array {
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
  }
  return int16;
}

/**
 * Float32Array PCM → WAV Blob 변환
 * @param samples  Float32 PCM 샘플 배열
 * @param sampleRate 샘플레이트 (기본 16000 Hz — Whisper 최적)
 */
export function encodeToWAV(samples: Float32Array, sampleRate = 16000): Blob {
  const int16Samples = float32ToInt16(samples);
  const header = createWavHeader(samples.length, sampleRate, 1, 16);
  const wavBuffer = new Uint8Array(header.byteLength + int16Samples.byteLength);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(new Uint8Array(int16Samples.buffer), header.byteLength);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}
