"use client";

import React, { useState } from "react";
import { DualAudioButtons } from "./DualAudioButtons";
import { MicButton } from "./MicButton";
import {
  SpeechCheckResponse,
  saveProgress,
  speechCheck,
  ttsUrl,
} from "../lib/api";
import { findKeyWordInLine, getRohingyaWord } from "../lib/rohingya";

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
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioPlayed, setAudioPlayed] = useState(false);

  const current = sentences[index];

  const handleAudioPlay = () => setAudioPlayed(true);
  const handleAudioEnded = () => setAudioPlayed(true);

  const handleCheckResult = async (res: SpeechCheckResponse, sentence: string) => {
    const isCorrect = res.correct || res.similarity >= 0.75;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setTranscript(res.transcript ?? null);

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
          setTranscript(null);
          setError(null);
          setAudioPlayed(false);
        }, 1000);
      } else {
        setTimeout(() => onCompleteAll?.(), 1000);
      }
    }
  };

  const handleRecorded = async (payload: { audioBase64: string; mimeType: string }) => {
    if (!current) return;
    setChecking(true);
    setError(null);
    setFeedback("idle");
    setTranscript(null);

    try {
      const result = await speechCheck({
        expected: current.text,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });
      await handleCheckResult(result, current.text);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not check speech. Please try again.",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {/* Sentence display */}
      <div className="rounded-2xl bg-slate-800/60 border border-white/10 px-6 py-4 text-center w-full">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Repeat this sentence</p>
        <p className="text-white font-bold text-xl leading-snug">"{current?.text}"</p>
      </div>

      {/* Step 1: Listen — native Rohingya key word + full English sentence */}
      {(() => {
        const keyWord = current ? findKeyWordInLine(current.text) : null;
        const rw = keyWord ? getRohingyaWord(keyWord) : null;
        return (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Step 1 — Listen</p>
            {rw && (
              <p className="text-slate-400 text-xs text-center">
                Key word: <span className="text-slate-200 font-bold">{rw.rohingya}</span>
                <span className="text-slate-500 font-mono ml-2">({rw.pronunciation})</span>
              </p>
            )}
            <DualAudioButtons
              nativeSrc={rw ? ttsUrl(rw.pronunciation) : null}
              englishSrc={current?.audioUrl ?? ttsUrl(current?.text ?? "")}
              autoPlayNative
              onAnyPlayed={handleAudioPlay}
            />
            {!audioPlayed && (
              <p className="text-xs text-slate-500 text-center">Press a button to hear the sentence</p>
            )}
          </div>
        );
      })()}

      {/* Step 2: Speak */}
      {audioPlayed && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Step 2 — Speak</p>
          <MicButton
            onRecorded={handleRecorded}
            disabled={checking}
            nudge={feedback === "idle" ? "👆 Now say the sentence!" : undefined}
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

      {error && (
        <div className="text-xs text-red-400 max-w-xs text-center">{error}</div>
      )}

      <div className="text-xs text-slate-500">
        Sentence {index + 1} of {sentences.length}
      </div>
    </div>
  );
}
