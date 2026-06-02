/**
 * audio-processor.js
 * AudioWorkletProcessor — 별도 오디오 렌더링 스레드에서 실행됩니다.
 * 16kHz 단채널 PCM Float32 샘플을 수집하여 메인 스레드로 전송합니다.
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._silenceCount = 0;
    this._SILENCE_THRESHOLD = 0.01; // RMS 임계치
    this._CHUNK_SAMPLES = 16000 * 3; // 3초 @ 16kHz
    this._SILENCE_FRAMES = 50;       // 약 1초 무음 (128 samples/frame @ 16kHz)
  }

  /**
   * RMS(Root Mean Square) 에너지 계산
   */
  _getRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * 오디오 처리 루프 (128 샘플 프레임마다 호출됨)
   */
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // Float32Array (128 samples)
    const rms = this._getRMS(samples);

    // 샘플을 버퍼에 누적
    this._buffer.push(...samples);

    if (rms < this._SILENCE_THRESHOLD) {
      this._silenceCount++;
    } else {
      this._silenceCount = 0;
    }

    const shouldFlush =
      this._buffer.length >= this._CHUNK_SAMPLES ||
      (this._silenceCount >= this._SILENCE_FRAMES && this._buffer.length > 3200); // 최소 0.2초

    if (shouldFlush) {
      // 메인 스레드로 청크 전송
      this.port.postMessage({
        type: 'chunk',
        samples: new Float32Array(this._buffer),
        rms: rms,
      });
      this._buffer = [];
      this._silenceCount = 0;
    }

    // 볼륨 레벨은 매 프레임 전송 (시각화용)
    this.port.postMessage({ type: 'volume', rms });

    return true; // 프로세서 활성 유지
  }
}

registerProcessor('audio-processor', AudioProcessor);
