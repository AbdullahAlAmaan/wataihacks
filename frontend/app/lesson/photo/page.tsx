"use client";

import { ChevronLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PhotoCapture } from "@/components/PhotoCapture";

export default function PhotoCapturePage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        setSessionId(localStorage.getItem("session_id"));
    }, []);

    return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-950">
            <header className="flex justify-between items-center p-6 border-b border-white/5">
                <button
                    onClick={() => router.push("/lesson/conversation")}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={32} />
                </button>
                <span className="stage-pill bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Photo
                </span>
                <div className="w-8"></div>
            </header>

            <main className="flex-1 flex flex-col p-6 items-center justify-center">
                {sessionId ? (
                    <div className="w-full">
                        <PhotoCapture sessionId={sessionId} />
                    </div>
                ) : (
                    <div className="text-slate-400 text-center italic">Loading...</div>
                )}
            </main>

            <footer className="p-6">
                <button
                    onClick={() => router.push("/progress")}
                    className="btn-primary w-full py-6 text-xl bg-violet-600 hover:bg-violet-500 shadow-violet-900/40"
                >
                    <Trophy size={28} className="text-yellow-400" />
                    <span>Finish Session</span>
                </button>
            </footer>
        </div>
    );
}
