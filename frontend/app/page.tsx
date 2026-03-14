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
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [wordsGoal, setWordsGoal] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const themes = [
    { id: "caregiver", name: "Caregiver", description: "Medical observing, patient care, daily interactions.", icon: <HeartHandshake size={32} />, color: "text-rose-400" },
    { id: "grocery", name: "Grocery", description: "Shopping, asking for items, basic food vocab.", icon: <ShoppingCart size={32} />, color: "text-emerald-400" },
    { id: "work", name: "Work", description: "Colleagues, managers, tasks and schedules.", icon: <Briefcase size={32} />, color: "text-blue-400" },
    { id: "transport", name: "Transport", description: "Bus, train, directions, and tickets.", icon: <Bus size={32} />, color: "text-amber-400" },
    { id: "doctor", name: "Doctor", description: "Doctor visits, prescriptions, and health.", icon: <Stethoscope size={32} />, color: "text-cyan-400" },
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
    <main className="max-w-5xl mx-auto p-6 pt-12 flex flex-col min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold mb-3 text-white">VoiceFirst</h1>
        <p className="text-slate-300 text-lg font-medium mb-3">
          English learning for Rohingya newcomers
        </p>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          No reading required. Learn English entirely through listening and speaking —
          built for refugees and newcomers preparing for caregiver work.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-10">
        {/* Goal Selection */}
        <section className="max-w-md mx-auto w-full">
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
          <div className="-mx-6">
            <FeaturesSectionWithHoverEffects
              items={themes}
              selectedId={selectedTheme}
              onSelect={setSelectedTheme}
            />
          </div>
        </section>
      </div>

      {/* Sticky Bottom Action */}
      <div className="sticky bottom-6 mt-8 max-w-md mx-auto w-full">
        <GradientButton
          variant="variant"
          onClick={handleStart}
          disabled={!selectedTheme || loading}
          className={`w-full py-6 text-2xl shadow-xl hover:shadow-2xl transition-all ${!selectedTheme || loading ? "opacity-50 cursor-not-allowed saturate-0" : ""
            }`}
        >
          <Play fill="currentColor" size={28} className="mr-3" />
          {loading ? "Starting..." : "Start Learning"}
        </GradientButton>
      </div>
    </main>
  );
}
