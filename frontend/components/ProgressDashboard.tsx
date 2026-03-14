import { Flame, Star, Trophy, ArrowRight } from "lucide-react";

export interface ProgressProps {
    wordsLearned: number;
    goalWords: number;
    streakDays: number;
    theme: string;
}

export default function ProgressDashboard({
    wordsLearned,
    goalWords,
    streakDays,
    theme,
}: ProgressProps) {
    const percentComplete = Math.min(100, Math.round((wordsLearned / goalWords) * 100));

    return (
        <div className="flex flex-col gap-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card flex flex-col items-center justify-center p-6 bg-amber-500/10 border-amber-500/30">
                    <Flame size={48} className="text-amber-500 mb-2" strokeWidth={1.5} fill="currentColor" />
                    <div className="text-3xl font-black text-white">{streakDays}</div>
                    <div className="text-sm font-medium text-amber-200/80 uppercase tracking-wider mt-1">Day Streak</div>
                </div>

                <div className="card flex flex-col items-center justify-center p-6 bg-violet-500/10 border-violet-500/30">
                    <Star size={48} className="text-violet-400 mb-2" strokeWidth={1.5} fill="currentColor" />
                    <div className="text-xl font-bold text-white capitalize">{theme}</div>
                    <div className="text-sm font-medium text-violet-300/80 uppercase tracking-wider mt-1">Current Theme</div>
                </div>
            </div>

            {/* Main Goal Progress */}
            <div className="card p-8 bg-slate-800 border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${percentComplete}%` }}
                    />
                </div>

                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center relative">
                        {percentComplete >= 100 ? (
                            <Trophy size={36} className="text-yellow-400" fill="currentColor" />
                        ) : (
                            <span className="text-2xl font-black text-white">{percentComplete}%</span>
                        )}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="36" cy="36" r="34"
                                stroke="currentColor" strokeWidth="4" fill="none"
                                className="text-emerald-500 transition-all duration-1000 ease-out"
                                strokeDasharray="213"
                                strokeDashoffset={213 - (213 * percentComplete) / 100}
                            />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">Daily Goal</h3>
                        <div className="text-lg text-slate-400">
                            <span className="text-white font-bold">{wordsLearned}</span> of {goalWords} words learned
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
