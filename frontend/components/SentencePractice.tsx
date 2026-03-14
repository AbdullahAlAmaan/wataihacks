"use client";

import React, { useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { MicButton } from "./MicButton";
import {
  SpeechCheckResponse,
  saveProgress,
  speechCheck,
} from "../lib/api";

interface SentenceItem {
  text: string;
  audioUrl?: string;
}

interface SentencePracticeProps {
  sessionId: string;
  word: string;
  sentences: SentenceItem[];
  onCompleteAll?: () => void;
}

type FeedbackState = "idle" | "correct" | "incorrect";

export function SentencePractice({
  sessionId,
  word,
  sentences,
  onCompleteAll,
}: SentencePracticeProps) {
  const [index, setIndex] = useState(0);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [error, setError] = useState<string | null>(null);

  const current = sentences[index];

  const handleCheckResult = async (
    res: SpeechCheckResponse,
    sentence: string,
  ) => {
    const isCorrect = res.correct || res.similarity >= 0.75;
    setFeedback(isCorrect ? "correct" : "incorrect");

    try {
      await saveProgress({
        session_id: sessionId,
        word,
        sentence,
        correct: isCorrect,
        stage: 2,
      });
    } catch {
      // Non-fatal for the learner.
    }

    if (isCorrect) {
      if (index < sentences.length - 1) {
        setTimeout(() => {
          setIndex((i) => i + 1);
          setFeedback("idle");
          setError(null);
        }, 700);
      } else {
        onCompleteAll?.();
      }
    }
  };

  const handleRecorded = async (payload: {
    audioBase64: string;
    mimeType: string;
  }) => {
    if (!current) return;
    setChecking(true);
    setError(null);
    setFeedback("idle");

    try {
      const result = await speechCheck({
        expected: current.text,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });
      await handleCheckResult(result, current.text);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not check speech. Please try again.",
      );
    } finally {
      setChecking(false);
    }
  };

  const feedbackText =
    feedback === "correct"
      ? "Correct!"
      : feedback === "incorrect"
      ? "Try again"
      : "";

  const feedbackColor =
    feedback === "correct"
      ? "bg-emerald-100 text-emerald-900"
      : feedback === "incorrect"
      ? "bg-amber-100 text-amber-900"
      : "";

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="rounded-full bg-gray-900 px-6 py-2 text-lg font-bold text-white tracking-wide">
        {current?.text}
      </div>

      {current?.audioUrl ? (
        <AudioPlayer src={current.audioUrl} autoPlay className="mt-2" />
      ) : null}

      <MicButton
        onRecorded={handleRecorded}
        disabled={checking}
        className="mt-4"
      />

      {feedback !== "idle" ? (
        <div
          className={`mt-4 rounded-full px-6 py-2 text-base font-semibold ${feedbackColor}`}
        >
          {feedbackText}
        </div>
      ) : null}

      {error ? (
        <div className="text-xs text-red-700 max-w-xs text-center mt-2">
          {error}
        </div>
      ) : null}

      <div className="mt-4 text-xs text-gray-600">
        {index + 1} / {sentences.length}
      </div>
    </div>
  );
}

