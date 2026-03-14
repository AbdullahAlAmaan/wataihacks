export async function getUserAudioStream(): Promise<MediaStream> {
  if (typeof navigator === 'undefined') {
    throw new Error('getUserAudioStream can only be used in the browser');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia is not supported in this browser');
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // result is a data URL: "data:audio/webm;base64,XXXX"
        // Return just the raw base64 part
        const base64 = result.split(',')[1] ?? '';
        resolve(base64);
      } else {
        reject(new Error('Unexpected FileReader result type'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

export interface SilenceDetectorOptions {
  /** How long (ms) the audio must be below threshold before we auto-stop. */
  silenceDurationMs?: number;
  /** Amplitude threshold [0–1]; lower = more sensitive. */
  threshold?: number;
  /** How often (ms) to sample the audio stream. */
  sampleIntervalMs?: number;
  /**
   * Grace period (ms) after recording starts before silence detection kicks in.
   * Prevents immediately stopping if user hasn't started speaking yet.
   */
  gracePeriodMs?: number;
}

export interface SilenceDetector {
  stop: () => void;
}

export function createSilenceDetector(
  stream: MediaStream,
  onSilence: () => void,
  options: SilenceDetectorOptions = {},
): SilenceDetector {
  const silenceDurationMs = options.silenceDurationMs ?? 2500;
  const threshold = options.threshold ?? 0.05;
  const sampleIntervalMs = options.sampleIntervalMs ?? 100;
  // Don't start detecting silence until user has had time to start speaking
  const gracePeriodMs = options.gracePeriodMs ?? 2000;

  const AudioContextCtor =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).AudioContext || (window as any).webkitAudioContext);
  if (!AudioContextCtor) {
    return { stop: () => {} };
  }

  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.fftSize);
  let lastLoudTime = Date.now();
  let stopped = false;
  let graceOver = false;

  // Don't start evaluating silence until grace period passes
  const graceTimer = window.setTimeout(() => {
    graceOver = true;
    lastLoudTime = Date.now(); // reset clock so grace period doesn't count as silence
  }, gracePeriodMs);

  const intervalId = window.setInterval(() => {
    if (stopped || !graceOver) return;

    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i += 1) {
      const value = (dataArray[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    if (rms > threshold) {
      lastLoudTime = Date.now();
    } else if (Date.now() - lastLoudTime > silenceDurationMs) {
      stopped = true;
      onSilence();
    }
  }, sampleIntervalMs);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(graceTimer);
      window.clearInterval(intervalId);
      source.disconnect();
      audioContext.close().catch(() => {});
    },
  };
}
