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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/30 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Whisper Network</span>
                </div>
                <span className="text-xs font-mono text-cyan-800/30">
                    {data.whispers.length} unanswered question{data.whispers.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* Whisper display area */}
            <div
                className="relative rounded-xl overflow-hidden"
                style={{
                    background: 'rgba(0,0,0,0.45)',
                    minHeight: 150,
                    border: '1px solid rgba(0,229,255,0.04)'
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
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-5 h-5 rounded-full border border-cyan-800/15 flex items-center justify-center bg-cyan-900/10">
                                    <span className="text-[10px] font-mono text-cyan-600/40">@</span>
                                </div>
                                <span className="text-xs font-mono text-cyan-700/35">{whisper.author || 'unknown'}</span>
                                <span className="text-[10px] font-mono text-cyan-900/20">·</span>
                                <span className="text-[10px] font-mono text-cyan-900/25">{whisper.daysAgo} days ago</span>
                                {isOld && (
                                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                        color: 'rgba(239,68,68,0.5)'
                                    }}>
                                        Still Unanswered
                                    </span>
                                )}
                            </div>

                            {/* Full narrative sentence */}
                            <p
                                className="text-sm leading-relaxed"
                                style={{
                                    color: 'rgba(0,229,255,0.28)',
                                    fontStyle: 'italic',
                                    textShadow: '0 0 20px rgba(0,229,255,0.08)',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {buildNarrative(whisper)}
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
                <p className="text-sm text-cyan-800/40 mt-3 leading-relaxed italic border-t border-cyan-900/10 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
