"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import ProgressDashboard from "@/components/ProgressDashboard";
import { getProgress, ProgressResponse } from "@/lib/api";

export default function ProgressPage() {
    const router = useRouter();
    const [progress, setProgress] = useState<ProgressResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sid = localStorage.getItem("session_id");
        if (sid) {
            getProgress(sid)
                .then(data => setProgress(data))
                .catch(e => console.error(e))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-950 p-6 pt-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold mb-3 text-white">Great Job!</h1>
                <p className="text-slate-400 text-lg">You are making progress.</p>
            </div>

            <div className="flex-1">
                {loading ? (
                    <div className="text-center text-slate-400 mt-10">Loading progress...</div>
                ) : progress ? (
                    <ProgressDashboard
                        wordsLearned={progress.words_learned}
                        goalWords={progress.goal_words}
                        streakDays={progress.streak_days}
                        theme={progress.theme}
                    />
                ) : (
                    <div className="text-center text-slate-400 mt-10">No progress found.</div>
                )}
            </div>

            <div className="mt-8">
                <button
                    onClick={() => router.push("/")}
                    className="btn-primary w-full py-6 text-xl bg-slate-800 hover:bg-slate-700 text-white shadow-none border-2 border-slate-700 hover:border-slate-600"
                >
                    <Home size={28} />
                    <span>Back to Home</span>
                </button>
            </div>
        </div>
    );
}
