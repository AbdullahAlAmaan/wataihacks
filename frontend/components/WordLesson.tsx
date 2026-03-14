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
  ttsUrl,
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
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  // true once audio has played at least once — unlocks the mic
  const [audioPlayed, setAudioPlayed] = useState(false);

  useEffect(() => {
    void loadWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, theme]);

  const loadWord = async () => {
    setLoading(true);
    setError(null);
    setFeedback("idle");
    setTranscript(null);
    setImgError(false);
    setAudioPlayed(false);
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

  const handleAudioPlay = () => {
    // Unlock mic as soon as audio starts playing
    setAudioPlayed(true);
  };

  const handleAudioEnded = () => {
    setAudioPlayed(true);
  };

  const handleRecorded = async (payload: { audioBase64: string; mimeType: string }) => {
    if (!wordData) return;
    setChecking(true);
    setError(null);
    setFeedback("idle");
    setTranscript(null);

    try {
      const result = await speechCheck({
        expected: wordData.word,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });
      const isCorrect = result.correct || result.similarity >= 0.75;
      setFeedback(isCorrect ? "correct" : "incorrect");
      setTranscript(result.transcript ?? null);

      try {
        await saveProgress({
          session_id: sessionId,
          word: wordData.word,
          sentence: wordData.word,
          correct: isCorrect,
          stage: 1,
        });
      } catch {
        // Non-fatal
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not check speech. Please try again.",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {loading ? (
        <div className="text-lg font-semibold text-slate-300">Loading word…</div>
      ) : error ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="text-sm text-red-400 max-w-xs text-center">{error}</div>
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
          {/* Word image */}
          <div className="flex flex-col items-center space-y-3">
            {wordData.image && !imgError ? (
              <img
                src={wordData.image}
                alt={wordData.word}
                className="h-40 w-40 rounded-2xl object-cover shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-gray-900 border border-white/10 text-6xl shadow-inner">
                🗣️
              </div>
            )}

            {/* Word display */}
            <div className="rounded-full bg-slate-900 border border-white/5 px-8 py-3 text-2xl font-bold text-white tracking-wide shadow-xl">
              {wordData.word}
            </div>
          </div>

          {/* Step 1: Listen */}
          <div className="flex flex-col items-center space-y-2 w-full">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Step 1 — Listen</p>
            <AudioPlayer
              src={ttsUrl(wordData.word)}
              autoPlay
              onPlay={handleAudioPlay}
              onEnded={handleAudioEnded}
            />
            {!audioPlayed && (
              <p className="text-xs text-slate-500 text-center mt-1">
                Press Play to hear the word
              </p>
            )}
          </div>

          {/* Step 2: Speak — only shown after audio has played */}
          {audioPlayed && (
            <div className="flex flex-col items-center space-y-2 w-full">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Step 2 — Speak</p>
              <MicButton
                onRecorded={handleRecorded}
                disabled={checking}
                nudge={feedback === "idle" ? "👆 Now say the word!" : undefined}
              />
            </div>
          )}

          {/* Feedback */}
          {feedback !== "idle" && (
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`rounded-full px-6 py-2 text-base font-semibold ${
                  feedback === "correct"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {feedback === "correct" ? "✅ Correct!" : "❌ Try again"}
              </div>
              {transcript && (
                <p className="text-xs text-slate-400 text-center">
                  I heard: <span className="text-slate-200 font-medium">"{transcript}"</span>
                </p>
              )}
            </div>
          )}

          {/* Next word button */}
          <button
            type="button"
            onClick={() => void loadWord()}
            className="mt-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Next word →
          </button>
        </>
      ) : null}
    </div>
  );
}
