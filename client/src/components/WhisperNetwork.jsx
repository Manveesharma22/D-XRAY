import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhisperNetwork({ data }) {
    const [currentWhisper, setCurrentWhisper] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!data?.whispers?.length) return;
        const cycle = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setCurrentWhisper(prev => (prev + 1) % data.whispers.length);
                setVisible(true);
            }, 800);
        }, 7000);
        return () => clearInterval(cycle);
    }, [data?.whispers?.length]);

    if (!data?.whispers?.length) return null;

    const whisper = data.whispers[currentWhisper];
    const isOld = (whisper?.daysAgo || 0) > 180;

    // Build full narrative sentence
    function buildNarrative(w) {
        if (w.narrative) return w.narrative;
        const parts = [];
        if (w.author) parts.push(`@${w.author} asked:`);
        parts.push(`"${w.question}"`);
        if (w.context) parts.push(w.context);
        if (w.daysAgo > 30) {
            const months = Math.floor(w.daysAgo / 30);
            parts.push(`That was ${months > 12 ? Math.floor(months / 12) + ' year' + (Math.floor(months / 12) > 1 ? 's' : '') : months + ' month' + (months > 1 ? 's' : '')} ago. It has never been answered.`);
        }
        return parts.join(' ');
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden relative"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_15px_#00fbff] animate-pulse" />
                    <span className="text-[10px] font-technical text-cyan-400/70 tracking-[0.5em] uppercase font-bold">Tribal_Knowledge_Network</span>
                </div>
                <span className="text-[10px] font-technical text-cyan-400/60 uppercase tracking-[0.3em] font-bold">
                    {data.whispers.length}_Unanswered_Nodes
                </span>
            </div>

            {/* Whisper display area */}
            <div
                className="relative rounded-2xl overflow-hidden glass-panel"
                style={{
                    background: 'rgba(0,0,0,0.6)',
                    minHeight: 160,
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
                }}
            >
                {/* Scan line texture */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.012) 0px, transparent 1px, transparent 3px)',
                }} />

                {/* Silence duration — large background number */}
                {whisper?.daysAgo && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{
                        fontSize: 64,
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: 'rgba(0,229,255,0.04)',
                        lineHeight: 1,
                    }}>
                        {whisper.daysAgo > 365
                            ? `${Math.floor(whisper.daysAgo / 365)}y`
                            : whisper.daysAgo > 30
                                ? `${Math.floor(whisper.daysAgo / 30)}mo`
                                : `${whisper.daysAgo}d`}
                    </div>
                )}

                {/* Main whisper — enters from left edge, drifts right */}
                <AnimatePresence mode="wait">
                    {visible && whisper && (
                        <motion.div
                            key={currentWhisper}
                            initial={{ opacity: 0, x: -30, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="p-6 relative z-10"
                        >
                            {/* Author + timestamp */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
                                    <span className="text-[10px] font-technical text-white/30 font-bold">@</span>
                                </div>
                                <span className="text-[10px] font-technical text-cyan-400 font-bold uppercase tracking-widest">{whisper.author || 'UNKNOWN'}</span>
                                <span className="text-[10px] font-technical text-white/10">//</span>
                                <span className="text-[10px] font-technical text-white/20 uppercase tracking-widest">{whisper.daysAgo}_DAYS_SILENT</span>
                                {isOld && (
                                    <span className="text-[8px] font-technical px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-widest holographic-bloom">
                                        Terminal_State
                                    </span>
                                )}
                            </div>

                            {/* Full narrative sentence */}
                            <p
                                className="text-base leading-relaxed font-technical tracking-tight"
                                style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    textShadow: '0 0 20px rgba(0,251,255,0.1)',
                                }}
                            >
                                <span className="text-cyan-500 font-bold mr-2 uppercase tracking-widest text-[10px]">Signal//</span>
                                "{buildNarrative(whisper).replace('.', '').toUpperCase()}"
                            </p>

                            {/* Echo — the unanswered question again, faint */}
                            {whisper.question && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5, duration: 1 }}
                                    className="text-xs font-mono mt-4 leading-relaxed"
                                    style={{ color: 'rgba(0,229,255,0.08)', letterSpacing: '0.05em' }}
                                >
                                    echo: "{whisper.question}"
                                </motion.p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress dots */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {data.whispers.slice(0, 8).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setVisible(false);
                                setTimeout(() => { setCurrentWhisper(i); setVisible(true); }, 300);
                            }}
                            className="rounded-full transition-all"
                            style={{
                                width: i === currentWhisper ? 14 : 4,
                                height: 4,
                                background: i === currentWhisper ? 'rgba(0,229,255,0.32)' : 'rgba(0,229,255,0.06)',
                            }}
                        />
                    ))}
                </div>
            </div>

            {data.finding && (
                <p className="text-sm text-cyan-400/60 mt-3 leading-relaxed italic border-t border-cyan-900/10 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
