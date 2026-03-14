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
  /** Show this label above the button to prompt the user. */
  nudge?: string;
}

type MicState = "idle" | "recording" | "processing";

// Hard cap on recording length so it never runs forever
const MAX_RECORDING_MS = 10_000;

export function MicButton({ onRecorded, disabled, className = "", nudge }: MicButtonProps) {
  const [state, setState] = useState<MicState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceDetectorRef = useRef<{ stop: () => void } | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (maxTimerRef.current) {
          clearTimeout(maxTimerRef.current);
          maxTimerRef.current = null;
        }
        stopStream();

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

      // Auto-stop after MAX_RECORDING_MS regardless
      maxTimerRef.current = setTimeout(() => {
        stopRecordingInternal();
      }, MAX_RECORDING_MS);

      // Silence detection with grace period so user has time to start speaking
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
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
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

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Nudge prompt shown above the mic button */}
      {nudge && state === "idle" ? (
        <p className="text-sm font-semibold text-emerald-400 animate-pulse text-center">
          {nudge}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all
          ${
            isDisabled
              ? "bg-gray-600 cursor-not-allowed opacity-60"
              : state === "recording"
              ? "bg-red-600 animate-pulse scale-110"
              : "bg-emerald-600 hover:bg-emerald-500 active:scale-95"
          }`}
        aria-label="Record your voice"
      >
        <span className="text-3xl">{state === "recording" ? "🔴" : "🎤"}</span>
      </button>

      <span className="text-sm font-medium text-slate-300">
        {state === "idle"
          ? "Tap to Speak"
          : state === "recording"
          ? "Listening... (tap to stop)"
          : "Checking..."}
      </span>

      {error ? (
        <span className="text-xs text-red-400 max-w-xs text-center">{error}</span>
      ) : null}
    </div>
  );
}
