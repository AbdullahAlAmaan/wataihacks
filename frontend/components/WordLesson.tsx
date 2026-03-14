"use client";

import React, { useEffect, useState } from "react";
import { DualAudioButtons } from "./DualAudioButtons";
import { MicButton } from "./MicButton";
import {
  SpeechCheckResponse,
  WordLessonResponse,
  getNextWord,
  saveProgress,
  speechCheck,
  ttsUrl,
} from "../lib/api";
import { getRohingyaWord } from "../lib/rohingya";

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
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    void loadWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, theme]);

  const loadWord = async () => {
    setLoading(true);
    setError(null);
    setFeedback("idle");
    setTranscript(null);
    setAudioPlayed(false);
    setAdvancing(false);
    try {
      const data = await getNextWord({ theme, session_id: sessionId });
      setWordData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load word. Please try again.");
    } finally {
      setLoading(false);
    }
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

      // Mark word as fully completed so next load gives a DIFFERENT word
      await saveProgress({
        session_id: sessionId,
        word: wordData.word,
        sentence: wordData.word,
        correct: isCorrect,
        stage: isCorrect ? 3 : 1, // stage=3 marks it complete in backend
      }).catch(() => {});

      if (isCorrect) {
        // Auto-advance to next word after a short pause
        setAdvancing(true);
        setTimeout(() => void loadWord(), 1800);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check speech. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {loading ? (
        <div className="text-lg font-semibold text-slate-300">
          {advancing ? "Loading next word…" : "Loading word…"}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="text-sm text-red-400 max-w-xs text-center">{error}</div>
          <button
            type="button"
            onClick={() => void loadWord()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : wordData ? (
        <>
          {/* Word display */}
          <div className="flex flex-col items-center space-y-3 w-full">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-800 border border-white/10 text-5xl shadow-inner">
              🗣️
            </div>

            {/* English word */}
            <div className="rounded-full bg-slate-900 border border-white/5 px-10 py-3 text-3xl font-bold text-white tracking-wide shadow-xl">
              {wordData.word}
            </div>

          </div>

          {/* Step 1: Listen — native Rohingya + English */}
          {(() => {
            const rw = getRohingyaWord(wordData.word);
            return (
              <div className="flex flex-col items-center space-y-2 w-full">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Step 1 — Listen</p>
                {rw && (
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">
                      Rohingya: <span className="text-slate-200 font-bold">{rw.rohingya}</span>
                      <span className="text-slate-500 font-mono ml-2">({rw.pronunciation})</span>
                    </p>
                  </div>
                )}
                <DualAudioButtons
                  nativeSrc={rw ? ttsUrl(rw.pronunciation) : null}
                  englishSrc={ttsUrl(wordData.word)}
                  autoPlayNative
                  onAnyPlayed={() => setAudioPlayed(true)}
                />
                {!audioPlayed && (
                  <p className="text-xs text-slate-500 text-center">Press a button to hear the word</p>
                )}
              </div>
            );
          })()}

          {/* Step 2: Speak — unlocked after audio plays */}
          {audioPlayed && !advancing && (
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
                {feedback === "correct" ? "✅ Correct! Next word…" : "❌ Try again"}
              </div>
              {transcript && (
                <p className="text-xs text-slate-400 text-center">
                  I heard: <span className="text-slate-200 font-medium">"{transcript}"</span>
                </p>
              )}
            </div>
          )}

          {/* Manual skip — shown when incorrect so user isn't stuck */}
          {feedback === "incorrect" && (
            <button
              type="button"
              onClick={() => void loadWord()}
              className="text-xs text-slate-500 underline hover:text-slate-300"
            >
              Skip to next word
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}
