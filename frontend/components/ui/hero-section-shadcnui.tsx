"use client";

import { motion, type Variants } from "framer-motion";
import { Sparkles } from "lucide-react";

export function HeroSection() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center text-center mt-[-1rem] mb-6"
        >
            <motion.div variants={itemVariants} className="mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Welcome to
                </span>
            </motion.div>

            <motion.h1
                variants={itemVariants}
                className="mb-4 text-5xl font-extrabold tracking-tight md:text-6xl text-white"
            >
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    LifeWords
                </span>
            </motion.h1>

            <motion.p
                variants={itemVariants}
                className="max-w-xl text-lg text-slate-400"
            >
                Learn English by speaking. Build your confidence with realistic scenarios and pronunciation practice.
            </motion.p>
        </motion.div>
    );
}
