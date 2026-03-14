"use client";

/**
 * DualAudioButtons
 *
 * Shows two side-by-side audio buttons:
 *   [🔊 Rohingya]  [🔊 English]
 *
 * Native button sends the Rohingya pronunciation guide (e.g. "DAH-WAH") to
 * ElevenLabs so it reads it phonetically, giving a rough Rohingya sound.
 * English button speaks the normal English word or sentence.
 *
 * Either button playing/ending calls onAnyPlayed() to unlock the mic.
 */

import React, { useEffect, useRef, useState } from "react";

interface DualAudioButtonsProps {
  nativeSrc: string | null;    // ttsUrl("DAH-WAH")  — null if no Rohingya word known
  englishSrc: string;          // ttsUrl("medicine")
  autoPlayNative?: boolean;    // auto-play native first (default true when nativeSrc present)
  onAnyPlayed?: () => void;    // called after any button plays
}

type Which = "native" | "english" | null;

export function DualAudioButtons({
  nativeSrc,
  englishSrc,
  autoPlayNative = true,
  onAnyPlayed,
}: DualAudioButtonsProps) {
  const nativeRef = useRef<HTMLAudioElement | null>(null);
  const englishRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<Which>(null);
  const onAnyPlayedRef = useRef(onAnyPlayed);
  useEffect(() => { onAnyPlayedRef.current = onAnyPlayed; }, [onAnyPlayed]);

  // Auto-play native when srcs arrive
  useEffect(() => {
    if (!autoPlayNative) return;
    const src = nativeSrc ?? englishSrc;
    const el = nativeSrc ? nativeRef.current : englishRef.current;
    if (!el || !src) return;
    el.load();
    const timer = setTimeout(() => {
      el.play()
        .then(() => {
          setPlaying(nativeSrc ? "native" : "english");
          onAnyPlayedRef.current?.();
        })
        .catch(() => {}); // autoplay blocked — user taps manually
    }, 120);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeSrc, englishSrc]);

  // Re-load audio elements when srcs change
  useEffect(() => { nativeRef.current?.load(); }, [nativeSrc]);
  useEffect(() => { englishRef.current?.load(); }, [englishSrc]);

  const play = async (which: "native" | "english") => {
    // Stop the other one
    const other = which === "native" ? englishRef.current : nativeRef.current;
    other?.pause();
    if (other) other.currentTime = 0;

    const el = which === "native" ? nativeRef.current : englishRef.current;
    if (!el) return;
    try {
      await el.play();
      setPlaying(which);
      onAnyPlayedRef.current?.();
    } catch {}
  };

  const handleEnded = (which: Which) => {
    setPlaying(null);
  };

  const hasNative = Boolean(nativeSrc);

  return (
    <div className="flex items-center gap-3 justify-center">
      {/* ── Native / Rohingya button ── */}
      {hasNative && (
        <>
          <audio
            key={nativeSrc ?? ""}
            ref={nativeRef}
            src={nativeSrc ?? undefined}
            onEnded={() => handleEnded("native")}
          />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Rohingya</span>
            <button
              type="button"
              onClick={() => play("native")}
              className={`rounded-full px-5 py-3 text-sm font-semibold shadow transition-all
                ${playing === "native"
                  ? "bg-violet-500 text-white animate-pulse"
                  : "bg-violet-700/60 text-violet-200 border border-violet-500/40 hover:bg-violet-600/80"
                }`}
            >
              {playing === "native" ? "▶ Playing…" : "🔊 Native"}
            </button>
          </div>
        </>
      )}

      {/* ── English button ── */}
      <audio
        key={englishSrc}
        ref={englishRef}
        src={englishSrc}
        onEnded={() => handleEnded("english")}
      />
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">English</span>
        <button
          type="button"
          onClick={() => play("english")}
          className={`rounded-full px-5 py-3 text-sm font-semibold shadow transition-all
            ${playing === "english"
              ? "bg-blue-500 text-white animate-pulse"
              : "bg-blue-700/60 text-blue-200 border border-blue-500/40 hover:bg-blue-600/80"
            }`}
        >
          {playing === "english" ? "▶ Playing…" : "🔊 English"}
        </button>
      </div>
    </div>
  );
}
