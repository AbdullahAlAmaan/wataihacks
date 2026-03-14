"use client";

import React, { useEffect, useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { MicButton } from "./MicButton";
import {
  SpeechCheckResponse,
  WordLessonResponse,
  getNextWord,
  saveProgress,
  speechCheck,
} from "../lib/api";

interface WordLessonProps {
  sessionId: string;
  theme: string;
}

type FeedbackState = "idle" | "correct" | "incorrect";

export function WordLesson({ sessionId, theme }: WordLessonProps) {
  const [wordData, setWordData] = useState<WordLessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, theme]);

  const loadWord = async () => {
    setLoading(true);
    setError(null);
    setFeedback("idle");
    try {
      const data = await getNextWord({ theme, session_id: sessionId });
      setWordData(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load word. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckResult = async (
    res: SpeechCheckResponse,
    expected: string,
  ) => {
    const isCorrect = res.correct || res.similarity >= 0.75;
    setFeedback(isCorrect ? "correct" : "incorrect");

    if (!wordData) return;

    try {
      await saveProgress({
        session_id: sessionId,
        word: wordData.word,
        sentence: expected,
        correct: isCorrect,
        stage: 1,
      });
    } catch {
      // Non-fatal; we still show feedback.
    }
  };

  const handleRecorded = async (payload: {
    audioBase64: string;
    mimeType: string;
  }) => {
    if (!wordData) return;
    setChecking(true);
    setError(null);
    setFeedback("idle");

    try {
      const result = await speechCheck({
        expected: wordData.word,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });
      await handleCheckResult(result, wordData.word);
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
      {loading ? (
        <div className="text-lg font-semibold text-gray-800">Loading word…</div>
      ) : error ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="text-sm text-red-700 max-w-xs text-center">{error}</div>
          <button
            type="button"
            onClick={() => void loadWord()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : wordData ? (
        <>
          <div className="flex flex-col items-center space-y-3">
            {wordData.image ? (
              <img
                src={wordData.image}
                alt={wordData.word}
                className="h-40 w-40 rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-gray-100 text-4xl">
                🗣️
              </div>
            )}
            <div className="rounded-full bg-gray-900 px-6 py-2 text-lg font-bold text-white tracking-wide">
              {wordData.word}
            </div>
          </div>

          <AudioPlayer
            src={wordData.audio_url}
            autoPlay
            className="mt-4"
          />

          <MicButton
            onRecorded={handleRecorded}
            disabled={checking}
            className="mt-6"
          />

          {feedback !== "idle" ? (
            <div
              className={`mt-4 rounded-full px-6 py-2 text-base font-semibold ${feedbackColor}`}
            >
              {feedbackText}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void loadWord()}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Next word
          </button>
        </>
      ) : null}
    </div>
  );
}

