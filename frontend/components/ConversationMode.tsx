"use client";

import React, { useEffect, useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { MicButton } from "./MicButton";
import {
  ConversationTurn,
  SpeechCheckResponse,
  saveProgress,
  speechCheck,
  ttsUrl,
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
  const [transcript, setTranscript] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // true once the worker's audio has finished — unlocks the user mic
  const [workerAudioDone, setWorkerAudioDone] = useState(false);

  const current = turns[index];
  const isWorkerTurn = current?.speaker === "worker";

  // When the turn index changes, reset state
  useEffect(() => {
    setFeedback("idle");
    setTranscript(null);
    setError(null);
    setWorkerAudioDone(false);
  }, [index]);

  const advance = () => {
    if (index < turns.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onConversationComplete?.();
    }
  };

  const handleWorkerAudioEnded = () => {
    // Short pause then advance — worker line played, move on
    setTimeout(() => advance(), 800);
  };

  const handleWorkerAudioPlay = () => {
    setWorkerAudioDone(false);
  };

  const handleCheckResult = async (res: SpeechCheckResponse, expected: string) => {
    const isCorrect = res.correct || res.similarity >= 0.75;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setTranscript(res.transcript ?? null);

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
      setTimeout(() => advance(), 1200);
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
        expected: current.line,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });
      await handleCheckResult(result, current.line);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not check speech. Please try again.",
      );
    } finally {
      setChecking(false);
    }
  };

  if (!current) {
    return (
      <div className="text-center text-slate-300 font-semibold">
        Conversation finished. Great job!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-5 w-full max-w-md mx-auto">
      {/* Chat history — show all past turns + current */}
      <div className="flex w-full flex-col space-y-3">
        {turns.slice(0, index + 1).map((turn, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-base shadow-sm ${
              turn.speaker === "worker"
                ? "self-start bg-blue-600 text-white"
                : i === index
                ? "self-end bg-slate-700 text-slate-100 border border-white/10"
                : "self-end bg-emerald-600 text-white"
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {turn.speaker === "worker" ? "Caregiver" : "You"}
            </div>
            <div className="font-semibold">{turn.line}</div>
          </div>
        ))}
      </div>

      {/* Worker turn: play audio then auto-advance */}
      {isWorkerTurn && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Caregiver speaking…</p>
          <AudioPlayer
            src={ttsUrl(current.line)}
            autoPlay
            onPlay={handleWorkerAudioPlay}
            onEnded={handleWorkerAudioEnded}
          />
        </div>
      )}

      {/* User turn: mic with nudge */}
      {!isWorkerTurn && (
        <div className="flex flex-col items-center space-y-2 w-full">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Your turn to speak</p>
          <div className="rounded-xl bg-slate-800/60 border border-white/10 px-4 py-2 text-center">
            <p className="text-slate-300 font-medium text-sm">Say:</p>
            <p className="text-white font-bold text-lg">"{current.line}"</p>
          </div>
          <MicButton
            onRecorded={handleRecorded}
            disabled={checking}
            nudge="👆 Tap and repeat the line above"
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
            {feedback === "correct" ? "✅ Good!" : "❌ Try again"}
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

      {/* Progress */}
      <div className="text-xs text-slate-500">
        {index + 1} / {turns.length}
      </div>
    </div>
  );
}
