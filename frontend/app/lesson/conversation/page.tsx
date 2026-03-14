"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConversationMode } from "@/components/ConversationMode";
import { getConversation, ConversationResponse } from "@/lib/api";

export default function ConversationModePage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [theme, setTheme] = useState<string>("caregiver");
    const [convoData, setConvoData] = useState<ConversationResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sid = localStorage.getItem("session_id");
        const t = localStorage.getItem("theme") || "caregiver";
        setSessionId(sid);
        setTheme(t);
        if (sid) {
            getConversation({ theme: t })
                .then(data => setConvoData(data))
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
                    onClick={() => router.push("/lesson/sentence")}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={32} />
                </button>
                <span className="stage-pill bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Conversation
                </span>
                <div className="w-8"></div>
            </header>

            <main className="flex-1 flex flex-col p-6 items-center justify-center">
                {loading ? (
                    <div className="text-slate-400 text-center italic">Loading conversation...</div>
                ) : sessionId && convoData ? (
                    <div className="w-full">
                        <ConversationMode
                            sessionId={sessionId}
                            theme={theme}
                            turns={convoData.turns}
                            onConversationComplete={() => router.push("/lesson/photo")}
                        />
                    </div>
                ) : (
                    <div className="text-slate-400 text-center italic">Couldn't load conversation.</div>
                )}
            </main>

            <footer className="p-6">
                <button
                    onClick={() => router.push("/lesson/photo")}
                    className="btn-secondary w-full py-5 text-xl text-emerald-300 border-emerald-500/30 hover:border-emerald-400 hover:text-emerald-200"
                >
                    <span>Next: Photo Challenge</span>
                    <ChevronRight size={24} />
                </button>
            </footer>
        </div>
    );
}
