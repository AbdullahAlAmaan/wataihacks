"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  blobToBase64,
  createSilenceDetector,
  getUserAudioStream,
} from "../lib/audio";

interface MicButtonProps {
  onRecorded: (data: { audioBase64: string; mimeType: string }) => void;
  disabled?: boolean;
  className?: string;
}

type MicState = "idle" | "recording" | "processing";

export function MicButton({ onRecorded, disabled, className = "" }: MicButtonProps) {
  const [state, setState] = useState<MicState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceDetectorRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => {
      stopRecordingInternal(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    if (state !== "idle") return;
    setError(null);
    setState("processing");
    try {
      const stream = await getUserAudioStream();
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        chunksRef.current = [];
        silenceDetectorRef.current?.stop();
        silenceDetectorRef.current = null;
        stopStream();

        if (state === "idle") {
          return;
        }

        setState("processing");
        try {
          const audioBase64 = await blobToBase64(blob);
          onRecorded({ audioBase64, mimeType: blob.type });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setState("idle");
        }
      };

      mediaRecorder.start();

      const detector = createSilenceDetector(stream, () => {
        stopRecordingInternal();
      });
      silenceDetectorRef.current = detector;

      setState("recording");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not access microphone. Please check permissions.",
      );
      setState("idle");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const stopRecordingInternal = (triggerOnStop = true) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "inactive") {
      if (!triggerOnStop) {
        recorder.onstop = null;
      }
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;
    stopStream();
  };

  const handleClick = () => {
    if (disabled) return;
    if (state === "idle") {
      void startRecording();
    } else if (state === "recording") {
      stopRecordingInternal();
    }
  };

  const isDisabled = disabled || state === "processing";

  const label =
    state === "idle" ? "Tap to Speak" : state === "recording" ? "Listening..." : "Processing...";

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2
          ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : state === "recording"
              ? "bg-red-600 animate-pulse"
              : "bg-emerald-600"
          }`}
        aria-label="Record your voice"
      >
        <span className="text-3xl">🎤</span>
      </button>
      <span className="text-sm font-medium text-gray-800">{label}</span>
      {error ? <span className="text-xs text-red-600 max-w-xs text-center">{error}</span> : null}
    </div>
  );
}

