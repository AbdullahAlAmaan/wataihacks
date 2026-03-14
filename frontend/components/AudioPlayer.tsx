"use client";

import React, { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string | null | undefined;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  className?: string;
}

export function AudioPlayer({
  src,
  autoPlay = false,
  onEnded,
  onPlay,
  className = "",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  // Store callbacks in refs so the autoPlay effect doesn't re-fire when they change
  const onEndedRef = useRef(onEnded);
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

  // When src changes: reload the audio element and attempt autoplay
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    setIsPlaying(false);
    setPlayError(null);
    el.load(); // force browser to re-fetch the new src

    if (!autoPlay || !src) return;

    // Small delay so the browser has a moment to begin loading
    const timer = setTimeout(() => {
      el.play()
        .then(() => {
          setIsPlaying(true);
          onPlayRef.current?.();
        })
        .catch(() => {
          // Autoplay blocked — user must tap Play manually (common browser policy)
          setIsPlaying(false);
        });
    }, 100);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, autoPlay]);

  const handlePlayClick = async () => {
    const el = audioRef.current;
    if (!el || !src) return;
    setPlayError(null);
    try {
      await el.play();
      setIsPlaying(true);
      onPlayRef.current?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not play audio";
      setPlayError(msg);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEndedRef.current?.();
  };

  const isDisabled = !src;

  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      {/* key=src forces the <audio> element to remount when src changes */}
      <audio key={src ?? "__empty__"} ref={audioRef} src={src ?? undefined} onEnded={handleEnded} />

      <button
        type="button"
        onClick={handlePlayClick}
        disabled={isDisabled}
        className={`rounded-full px-8 py-4 text-lg font-semibold shadow-md transition-all focus:outline-none
          ${
            isDisabled
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : isPlaying
              ? "bg-emerald-500 text-white animate-pulse"
              : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
          }`}
        aria-label="Play audio"
      >
        {isPlaying ? "▶ Playing..." : "▶ Play"}
      </button>

      {playError && (
        <p className="text-xs text-red-400 text-center max-w-xs">
          Audio error — is the backend running?
        </p>
      )}
    </div>
  );
}
