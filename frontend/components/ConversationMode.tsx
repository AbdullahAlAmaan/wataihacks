"use client";

import React, { useEffect, useRef, useState } from "react";
import { DualAudioButtons } from "./DualAudioButtons";
import { MicButton } from "./MicButton";
import {
  ConversationTurn,
  evaluateResponse,
  saveProgress,
  speechCheck,
  ttsUrl,
} from "../lib/api";
import { findKeyWordInLine, getRohingyaWord } from "../lib/rohingya";

function WorkerTurnView({ line, onAnyPlayed }: { line: string; onAnyPlayed: () => void }) {
  const keyWord = findKeyWordInLine(line);
  const rw = keyWord ? getRohingyaWord(keyWord) : null;
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="self-start max-w-[85%] rounded-2xl px-4 py-3 bg-blue-600 text-white">
        <span className="text-xs opacity-70 block mb-1">Caregiver</span>
        <span className="font-semibold text-base">{line}</span>
      </div>
      {rw && (
        <p className="text-slate-400 text-xs text-center">
          Key word: <span className="text-slate-200 font-bold">{rw.rohingya}</span>
          <span className="text-slate-500 font-mono ml-2">({rw.pronunciation})</span>
        </p>
      )}
      <DualAudioButtons
        nativeSrc={rw ? ttsUrl(rw.pronunciation) : null}
        englishSrc={ttsUrl(line)}
        autoPlayNative
        onAnyPlayed={onAnyPlayed}
      />
    </div>
  );
}

interface ConversationModeProps {
  sessionId: string;
  theme: string;
  turns: ConversationTurn[];
  onConversationComplete?: () => void;
}

type EvalState = "idle" | "appropriate" | "inappropriate";

interface ChatMessage {
  speaker: "worker" | "user";
  line: string; // what was actually said (user: their real words, worker: scripted line)
}

export function ConversationMode({
  sessionId,
  theme,
  turns,
  onConversationComplete,
}: ConversationModeProps) {
  const [index, setIndex] = useState(0);
  const [evalState, setEvalState] = useState<EvalState>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const current = turns[index];
  const isWorkerTurn = current?.speaker === "worker";

  // Reset per-turn state whenever the turn changes
  useEffect(() => {
    setEvalState("idle");
    setFeedback(null);
    setSuggestions([]);
    setTranscript(null);
    setError(null);
  }, [index]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, feedback]);

  const advance = (userSaidLine?: string) => {
    if (!current) return;

    // Commit current turn to visible history using actual words
    const displayLine =
      current.speaker === "user" && userSaidLine ? userSaidLine : current.line;
    setHistory((prev) => [...prev, { speaker: current.speaker, line: displayLine }]);

    if (index < turns.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onConversationComplete?.();
    }
  };

  const handleWorkerAudioEnded = () => {
    setTimeout(() => advance(), 600);
  };

  const handleRecorded = async (payload: { audioBase64: string; mimeType: string }) => {
    if (!current) return;
    setChecking(true);
    setError(null);
    setEvalState("idle");
    setFeedback(null);
    setSuggestions([]);
    setTranscript(null);

    try {
      // Step 1: transcribe
      const sttResult = await speechCheck({
        expected: current.line,
        audio_base64: payload.audioBase64,
        session_id: sessionId,
      });

      const heard = sttResult.transcript ?? "";
      setTranscript(heard);

      if (!heard.trim()) {
        setEvalState("inappropriate");
        setFeedback("I didn't catch that — try speaking a bit louder.");
        setSuggestions(["Try again and speak clearly into the mic."]);
        return;
      }

      // Step 2: find the most recent worker line to use as context
      const lastWorkerLine =
        [...turns].slice(0, index).reverse().find((t) => t.speaker === "worker")?.line ??
        current.line;

      // Step 3: semantic evaluation
      const evaluation = await evaluateResponse({
        worker_line: lastWorkerLine,
        user_transcript: heard,
        theme,
      });

      setFeedback(evaluation.feedback);

      if (evaluation.appropriate) {
        setEvalState("appropriate");
        await saveProgress({
          session_id: sessionId,
          word: current.line,
          sentence: heard,
          correct: true,
          stage: 3,
        }).catch(() => {});
        setTimeout(() => advance(heard), 1400);
      } else {
        setEvalState("inappropriate");
        setSuggestions(evaluation.suggestions);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not evaluate. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (!current) {
    return (
      <div className="text-center text-emerald-300 font-semibold py-8 text-lg">
        ✅ Conversation complete! Great job!
      </div>
    );
  }

  // The worker line that came just before this user turn
  const previousWorkerLine = [...turns]
    .slice(0, index)
    .reverse()
    .find((t) => t.speaker === "worker");

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto">
      {/* Chat history — shows real words, not scripted lines */}
      {history.length > 0 && (
        <div className="flex flex-col space-y-2 pb-2 border-b border-white/5">
          {history.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm ${
                msg.speaker === "worker"
                  ? "self-start bg-blue-700/50 text-blue-100"
                  : "self-end bg-emerald-700/50 text-emerald-100"
              }`}
            >
              <span className="text-xs opacity-50 block mb-0.5">
                {msg.speaker === "worker" ? "Caregiver" : "You"}
              </span>
              {msg.line}
            </div>
          ))}
        </div>
      )}

      {/* Current turn */}
      {isWorkerTurn ? (
        <WorkerTurnView
          line={current.line}
          onAnyPlayed={handleWorkerAudioEnded}
        />
      ) : (
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Context: what the caregiver just said */}
          {previousWorkerLine && (
            <div className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">They said:</p>
              <p className="text-slate-200 font-medium">"{previousWorkerLine.line}"</p>
            </div>
          )}

          <div className="w-full rounded-xl bg-slate-900 border border-white/10 px-4 py-3 text-center">
            <p className="text-slate-300 text-sm font-medium">Respond naturally in English.</p>
            <p className="text-slate-500 text-xs mt-1">Say anything that makes sense as a reply.</p>
          </div>

          {/* Mic — hidden while appropriate feedback is showing (advancing) */}
          {evalState !== "appropriate" && (
            <MicButton
              onRecorded={handleRecorded}
              disabled={checking}
              nudge={evalState === "idle" ? "👆 Tap and speak your answer" : undefined}
            />
          )}

          {/* What was heard */}
          {transcript && (
            <p className="text-xs text-slate-400 text-center">
              I heard:{" "}
              <span className="text-slate-200 font-medium">"{transcript}"</span>
            </p>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-center ${
                evalState === "appropriate"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {evalState === "appropriate" ? "✅ " : "💬 "}
              {feedback}
            </div>
          )}

          {/* Suggestions shown only when inappropriate */}
          {evalState === "inappropriate" && suggestions.length > 0 && (
            <div className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Try saying one of these:
              </p>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-slate-700/70 px-3 py-2 text-sm text-white font-medium"
                >
                  "{s}"
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>
          )}
        </div>
      )}

      <div ref={chatEndRef} />

      <p className="text-xs text-slate-600 text-center pt-1">
        Turn {index + 1} of {turns.length}
      </p>
    </div>
  );
}
