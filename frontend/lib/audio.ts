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
}

export interface SilenceDetector {
  stop: () => void;
}

export function createSilenceDetector(
  stream: MediaStream,
  onSilence: () => void,
  options: SilenceDetectorOptions = {},
): SilenceDetector {
  const silenceDurationMs = options.silenceDurationMs ?? 2000;
  const threshold = options.threshold ?? 0.02;
  const sampleIntervalMs = options.sampleIntervalMs ?? 200;

  const AudioContextCtor =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).AudioContext || (window as any).webkitAudioContext);
  if (!AudioContextCtor) {
    // Fallback: if AudioContext is unavailable, do nothing and rely on manual stop.
    return { stop: () => {} };
  }

  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.fftSize);
  let lastLoudTime = Date.now();
  let stopped = false;

  const intervalId = window.setInterval(() => {
    if (stopped) return;

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
      window.clearInterval(intervalId);
      source.disconnect();
      audioContext.close().catch(() => {});
    },
  };
}

