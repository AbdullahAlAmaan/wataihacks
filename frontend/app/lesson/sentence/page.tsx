"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SentencePractice } from "@/components/SentencePractice";
import { getNextWord, ttsUrl, WordLessonResponse } from "@/lib/api";

export default function SentencePracticePage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [wordData, setWordData] = useState<WordLessonResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sid = localStorage.getItem("session_id");
        const t = localStorage.getItem("theme") || "caregiver";
        setSessionId(sid);
        if (sid) {
            getNextWord({ theme: t, session_id: sid })
                .then(data => setWordData(data))
                .catch(e => console.error(e))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-950">
            <header className="flex justify-between items-center p-6 border-b border-white/5">
                <button
                    onClick={() => router.push("/lesson/word")}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={32} />
                </button>
                <span className="stage-pill bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Sentence
                </span>
                <div className="w-8"></div>
            </header>

            <main className="flex-1 flex flex-col p-6 items-center justify-center">
                {loading ? (
                    <div className="text-slate-400 text-center italic">Loading sentences...</div>
                ) : sessionId && wordData ? (
                    <div className="w-full">
                        <SentencePractice
                            sessionId={sessionId}
                            word={wordData.word}
                            sentences={wordData.sentence_examples?.map(s => ({ text: s, audioUrl: ttsUrl(s) })) || []}
                            onCompleteAll={() => router.push("/lesson/conversation")}
                        />
                    </div>
                ) : (
                    <div className="text-slate-400 text-center italic">Couldn't load sentence practice.</div>
                )}
            </main>

            <footer className="p-6">
                <button
                    onClick={() => router.push("/lesson/conversation")}
                    className="btn-secondary w-full py-5 text-xl text-blue-300 border-blue-500/30 hover:border-blue-400 hover:text-blue-200"
                >
                    <span>Next: Conversation</span>
                    <ChevronRight size={24} />
                </button>
            </footer>
        </div>
    );
}
