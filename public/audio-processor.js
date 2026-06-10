/**
 * audio-processor.js
 * AudioWorkletProcessor — 별도 오디오 렌더링 스레드에서 실행됩니다.
 * 16kHz 단채널 PCM Float32 샘플을 수집하여 메인 스레드로 전송합니다.
 *
 * ★ 메모리 최적화 포인트:
 *  1. spread push(...samples) 대신 Float32Array 링 버퍼 + writeIndex 사용
 *  2. 볼륨 IPC: 매 프레임 → 10 프레임마다 throttle (초 125→12.5번)
 *  3. 청크 전송 후 기존 배열 재사용 (GC 압력 감소)
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // ── 링 버퍼 설정 ─────────────────────────────────────────
    this._CHUNK_SAMPLES = 16000 * 3;           // 3초 @ 16kHz = 48,000 samples
    this._MAX_BUF = this._CHUNK_SAMPLES * 2;   // 여유분 2배 확보
    this._buf = new Float32Array(this._MAX_BUF);
    this._writeIdx = 0;

    // ── 무음 감지 ──────────────────────────────────────────────
    this._SILENCE_THRESHOLD = 0.01;
    this._SILENCE_FRAMES = 50;   // ~1초 (128 samples × 50 / 16000)
    this._silenceCount = 0;
    this._MIN_SAMPLES = 3200;    // 최소 0.2초

    // ── 볼륨 throttle ─────────────────────────────────────────
    this._VOLUME_INTERVAL = 10;  // 10 프레임마다 전송 (~80ms)
    this._frameCount = 0;
    this._lastRms = 0;
  }

  /** RMS(Root Mean Square) 에너지 계산 */
  _getRMS(samples) {
    let sum = 0;
    const len = samples.length;
    for (let i = 0; i < len; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / len);
  }

  /**
   * 오디오 처리 루프 (128 샘플 프레임마다 호출됨)
   */
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // Float32Array(128)
    const rms = this._getRMS(samples);

    // ── 링 버퍼에 복사 (spread 금지) ─────────────────────────
    const sLen = samples.length;
    if (this._writeIdx + sLen <= this._MAX_BUF) {
      this._buf.set(samples, this._writeIdx);
    } else {
      // 버퍼 끝에 걸치는 경우: 앞 부분만 복사하고 나머지는 버림
      // (이 상황은 flush 로직상 발생하지 않지만 안전장치)
      const remain = this._MAX_BUF - this._writeIdx;
      this._buf.set(samples.subarray(0, remain), this._writeIdx);
    }
    this._writeIdx += sLen;

    // ── 무음 카운트 ────────────────────────────────────────────
    if (rms < this._SILENCE_THRESHOLD) {
      this._silenceCount++;
    } else {
      this._silenceCount = 0;
    }

    // ── 플러시 조건 판단 ───────────────────────────────────────
    const shouldFlush =
      this._writeIdx >= this._CHUNK_SAMPLES ||
      (this._silenceCount >= this._SILENCE_FRAMES &&
        this._writeIdx > this._MIN_SAMPLES);

    if (shouldFlush && this._writeIdx > 0) {
      // 기존 데이터를 복사해서 전송 (transferable ArrayBuffer 활용)
      const chunk = this._buf.slice(0, this._writeIdx);
      this.port.postMessage(
        { type: 'chunk', samples: chunk, rms },
        [chunk.buffer]   // transfer → 메인 스레드로 소유권 이전 (복사 없음)
      );
      // 버퍼 인덱스만 리셋 (배열 재할당 없음)
      this._writeIdx = 0;
      this._silenceCount = 0;
    }

    // ── 볼륨: throttle 전송 ────────────────────────────────────
    this._lastRms = rms;
    this._frameCount++;
    if (this._frameCount >= this._VOLUME_INTERVAL) {
      this.port.postMessage({ type: 'volume', rms: this._lastRms });
      this._frameCount = 0;
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
