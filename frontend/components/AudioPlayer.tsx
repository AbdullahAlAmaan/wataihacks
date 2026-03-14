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

  useEffect(() => {
    if (!audioRef.current) return;
    if (autoPlay && src) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlay?.();
        })
        .catch(() => {
          // Autoplay might be blocked; user can tap manually.
        });
    } else {
      setIsPlaying(false);
    }
  }, [autoPlay, src, onPlay]);

  const handlePlayClick = async () => {
    if (!audioRef.current || !src) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    } catch {
      // Ignore play errors; usually user gesture issues.
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const isDisabled = !src;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <audio ref={audioRef} src={src ?? undefined} onEnded={handleEnded} />
      <button
        type="button"
        onClick={handlePlayClick}
        disabled={isDisabled}
        className={`rounded-full px-8 py-4 text-lg font-semibold shadow-md focus:outline-none focus:ring-4 focus:ring-offset-2
          ${
            isDisabled
              ? "bg-gray-400 text-gray-800 cursor-not-allowed"
              : isPlaying
              ? "bg-emerald-500 text-white animate-pulse"
              : "bg-blue-600 text-white"
          }`}
        aria-label="Play audio"
      >
        {isDisabled ? "No audio" : isPlaying ? "Playing..." : "Play"}
      </button>
    </div>
  );
}

