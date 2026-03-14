"use client";

import React, { useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { MicButton } from "./MicButton";
import {
  ConversationTurn,
  SpeechCheckResponse,
  saveProgress,
  speechCheck,
} from "../lib/api";

interface ConversationModeProps {
  sessionId: string;
  turns: ConversationTurn[];
  onConversationComplete?: () => void;
}

type FeedbackState = "idle" | "correct" | "incorrect";

export function ConversationMode({
  sessionId,
  turns,
  onConversationComplete,
}: ConversationModeProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = turns[index];

  const isWorkerTurn = current?.speaker === "worker";

  const advance = () => {
    if (index < turns.length - 1) {
      setIndex((i) => i + 1);
      setFeedback("idle");
      setError(null);
    } else {
      onConversationComplete?.();
    }
  };

  const handleWorkerEnded = () => {
    advance();
  };

  const handleCheckResult = async (
    res: SpeechCheckResponse,
    expected: string,
  ) => {
    const isCorrect = res.correct || res.similarity >= 0.75;
    setFeedback(isCorrect ? "correct" : "incorrect");

    try {
      await saveProgress({
        session_id: sessionId,
        word: expected,
        sentence: expected,
        correct: isCorrect,
        stage: 3,
      });
    } catch {
      // Non-fatal.
    }

    if (isCorrect) {
      setTimeout(() => advance(), 700);
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
        expected: current.line,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });
      await handleCheckResult(result, current.line);
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
      ? "Good!"
      : feedback === "incorrect"
      ? "Try again"
      : "";

  const feedbackColor =
    feedback === "correct"
      ? "bg-emerald-100 text-emerald-900"
      : feedback === "incorrect"
      ? "bg-amber-100 text-amber-900"
      : "";

  if (!current) {
    return (
      <div className="text-center text-gray-700">
        Conversation finished. Great job!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex w-full max-w-md flex-col space-y-3">
        <div
          className={`self-start max-w-[80%] rounded-2xl px-4 py-3 text-base shadow-sm ${
            current.speaker === "worker"
              ? "bg-blue-600 text-white"
              : "bg-emerald-100 text-emerald-900"
          }`}
        >
          <div className="text-xs opacity-80 mb-1">
            {current.speaker === "worker" ? "Caregiver / Worker" : "You"}
          </div>
          <div className="font-semibold">{current.line}</div>
        </div>
      </div>

      {isWorkerTurn && current.audio_url ? (
        <AudioPlayer
          src={current.audio_url}
          autoPlay
          onEnded={handleWorkerEnded}
        />
      ) : isWorkerTurn ? (
        <button
          type="button"
          onClick={advance}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Next line
        </button>
      ) : (
        <MicButton
          onRecorded={handleRecorded}
          disabled={checking}
          className="mt-2"
        />
      )}

      {feedback !== "idle" ? (
        <div
          className={`mt-2 rounded-full px-6 py-2 text-base font-semibold ${feedbackColor}`}
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
        {index + 1} / {turns.length}
      </div>
    </div>
  );
}

