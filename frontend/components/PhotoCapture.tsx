"use client";

import React, { useRef, useState } from "react";
import { analyzePhoto } from "../lib/api";
import { AudioPlayer } from "./AudioPlayer";

interface PhotoCaptureProps {
  sessionId: string;
}

type Step = "idle" | "capturing" | "analyzing" | "result";

export function PhotoCapture({ sessionId }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [quizPrompt, setQuizPrompt] = useState<string | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    if (typeof navigator === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported on this device.");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep("capturing");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not access camera. Please check permissions.",
      );
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    const [meta, base64] = dataUrl.split(",");
    const mimeType = meta.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

    await sendForAnalysis(base64, mimeType);
  };

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      const [meta, base64] = result.split(",");
      const mimeType = meta.match(/data:(.*);base64/)?.[1] ?? file.type;
      await sendForAnalysis(base64, mimeType || "image/jpeg");
    };
    reader.readAsDataURL(file);
  };

  const sendForAnalysis = async (base64: string, mimeType: string) => {
    setStep("analyzing");
    setError(null);
    stopStream();

    try {
      const res = await analyzePhoto({
        image_base64: base64,
        mime_type: mimeType,
        session_id: sessionId,
      });
      setLabel(res.label);
      setWord(res.word ?? null);
      setAudioUrl(res.audio_url ?? null);
      setQuizPrompt(res.quiz_prompt ?? null);
      setStep("result");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not analyze photo. Please try again.",
      );
      setStep("idle");
    }
  };

  const reset = () => {
    stopStream();
    setLabel(null);
    setWord(null);
    setAudioUrl(null);
    setQuizPrompt(null);
    setError(null);
    setStep("idle");
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => void startCamera()}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Use Camera
        </button>
        <label className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm cursor-pointer">
          Upload Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleFile(file);
              }
            }}
          />
        </label>
      </div>

      {step === "capturing" ? (
        <div className="flex flex-col items-center space-y-3">
          <video
            ref={videoRef}
            className="h-56 w-72 rounded-2xl bg-black object-cover"
          />
          <button
            type="button"
            onClick={() => void captureFrame()}
            className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Snap
          </button>
        </div>
      ) : null}

      {step === "analyzing" ? (
        <div className="text-lg font-semibold text-gray-800">
          Thinking about your photo…
        </div>
      ) : null}

      {step === "result" ? (
        <div className="flex flex-col items-center space-y-4">
          {label ? (
            <div className="rounded-full bg-gray-900 px-6 py-2 text-base font-bold text-white tracking-wide">
              {label}
            </div>
          ) : null}

          {word ? (
            <div className="text-sm text-gray-700">
              Practice word:{" "}
              <span className="font-semibold text-gray-900">{word}</span>
            </div>
          ) : null}

          {quizPrompt ? (
            <div className="max-w-xs rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900 text-center shadow-sm">
              {quizPrompt}
            </div>
          ) : null}

          {audioUrl ? (
            <AudioPlayer src={audioUrl} autoPlay className="mt-2" />
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
          >
            New photo
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="text-xs text-red-700 max-w-xs text-center mt-2">
          {error}
        </div>
      ) : null}
    </div>
  );
}

