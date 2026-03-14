"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startLesson } from "@/lib/api";
import {
  ShoppingCart,
  Briefcase,
  HeartHandshake,
  Bus,
  Stethoscope,
  Play
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [wordsGoal, setWordsGoal] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const themes = [
    { id: "caregiver", name: "Caregiver", icon: HeartHandshake, color: "text-rose-400" },
    { id: "grocery", name: "Grocery", icon: ShoppingCart, color: "text-emerald-400" },
    { id: "work", name: "Work", icon: Briefcase, color: "text-blue-400" },
    { id: "transport", name: "Transport", icon: Bus, color: "text-amber-400" },
    { id: "doctor", name: "Doctor", icon: Stethoscope, color: "text-cyan-400" },
  ];

  const handleStart = async () => {
    if (!selectedTheme) return;
    setLoading(true);
    try {
      const res = await startLesson({ theme: selectedTheme, goal_words: wordsGoal, days: 7 });
      if (typeof window !== "undefined") {
        localStorage.setItem("session_id", res.session_id);
        localStorage.setItem("theme", selectedTheme);
      }
      router.push(`/lesson/word`);
    } catch (e) {
      console.error(e);
      alert("Failed to start lesson");
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 pt-12 flex flex-col min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold mb-3 text-white">VoiceFirst</h1>
        <p className="text-slate-400 text-lg">Learn English by speaking.</p>
      </div>

      <div className="flex-1 flex flex-col gap-8">
        {/* Goal Selection */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Daily Goal</h2>
          <div className="card flex items-center justify-between p-4">
            <span className="text-lg font-medium text-slate-300">Words to learn</span>
            <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-2 border border-white/5">
              <button
                onClick={() => setWordsGoal(Math.max(5, wordsGoal - 5))}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300"
              >-</button>
              <span className="text-2xl font-bold w-12 text-center text-white">{wordsGoal}</span>
              <button
                onClick={() => setWordsGoal(Math.min(50, wordsGoal + 5))}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300"
              >+</button>
            </div>
          </div>
        </section>

        {/* Theme Selection */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Choose a Topic</h2>
          <div className="grid grid-cols-2 gap-4">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isSelected = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`theme-tile ${isSelected ? 'selected' : ''}`}
                >
                  <Icon size={40} className={theme.color} />
                  <span className="font-semibold text-lg text-slate-200">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Action */}
      <div className="sticky bottom-6 mt-8">
        <button
          onClick={handleStart}
          disabled={!selectedTheme || loading}
          className={`w-full btn-primary py-6 text-2xl ${!selectedTheme || loading ? 'opacity-50 cursor-not-allowed bg-slate-700' : ''}`}
        >
          <Play fill="currentColor" size={28} />
          {loading ? "Starting..." : "Start Learning"}
        </button>
      </div>
    </main>
  );
}
