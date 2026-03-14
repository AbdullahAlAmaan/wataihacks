"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WordLesson } from "@/components/WordLesson";

export default function WordLessonPage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [theme, setTheme] = useState<string | null>(null);

    useEffect(() => {
        setSessionId(localStorage.getItem("session_id"));
        setTheme(localStorage.getItem("theme"));
    }, []);

    return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-950">
            <header className="flex justify-between items-center p-6 border-b border-white/5">
                <button
                    onClick={() => router.push("/")}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={32} />
                </button>
                <span className="stage-pill bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Word
                </span>
                <div className="w-8"></div> {/* Spacer for centering */}
            </header>

            <main className="flex-1 flex flex-col p-6 items-center justify-center">
                {sessionId && theme ? (
                    <div className="w-full">
                        <WordLesson sessionId={sessionId} theme={theme} />
                    </div>
                ) : (
                    <div className="text-slate-400">Loading lesson...</div>
                )}
            </main>

            <footer className="p-6">
                <button
                    onClick={() => router.push("/lesson/sentence")}
                    className="btn-secondary w-full py-5 text-xl"
                >
                    <span>Next: Sentence Practice</span>
                    <ChevronRight size={24} />
                </button>
            </footer>
        </div>
    );
}
