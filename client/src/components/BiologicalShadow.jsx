import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BiologicalShadow({ data }) {
    const [hoveredNode, setHoveredNode] = useState(null);

    if (!data || data.shadowScore === 0) return null;

    const { shadowScore, totalHoursStolen, circadianViolations, marathonSessions, weekendSacrifices, fatigueSignals, summary } = data;

    // Normalization for the 'Nerve' path
    const points = circadianViolations.map((v, i) => ({
        x: (i / (circadianViolations.length - 1)) * 100,
        y: 50 + (Math.sin(i * 1.5) * 20) + (Math.random() * 10 - 5),
        ...v
    }));

    const pathData = points.length > 1
        ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl overflow-hidden border border-red-500/10 shadow-[0_0_50px_rgba(255,0,0,0.05)]"
        >
            <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-red-500/60 uppercase tracking-[0.3em]">The Biological Shadow</span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight">The Human Price</h3>
                        <p className="text-red-400/40 text-xs font-mono mt-1 max-w-md">{summary}</p>
                    </div>

                    <div className="text-right">
                        <div className="text-[48px] font-black leading-none text-red-500">{totalHoursStolen}</div>
                        <div className="text-[10px] font-mono text-red-500/40 uppercase tracking-widest">Hours Stolen from Life</div>
                    </div>
                </div>

                {/* The Nerve Visualization */}
                <div className="relative h-48 w-full bg-black/40 rounded-2xl border border-red-900/10 mb-8 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_70%)]" />
                    </div>

                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                        {/* The base nerve */}
                        <motion.path
                            d={pathData}
                            fill="none"
                            stroke="rgba(255,0,0,0.15)"
                            strokeWidth="0.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />

                        {/* The active, vibrating shadow nerve */}
                        <motion.path
                            d={pathData}
                            fill="none"
                            stroke="rgba(255,50,50,0.4)"
                            strokeWidth="0.8"
                            animate={{
                                d: points.map(p => `${p.x},${p.y + (Math.random() * 2 - 1)}`).join(' L '),
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 0.1, repeat: Infinity }}
                        />

                        {/* Violation Nodes */}
                        {points.map((p, i) => (
                            <motion.circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r="1.2"
                                fill={hoveredNode === i ? "#ff4444" : "rgba(255,0,0,0.5)"}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredNode(i)}
                                onMouseLeave={() => setHoveredNode(null)}
                                whileHover={{ r: 2 }}
                            >
                                <animate attributeName="r" values="1.2;1.8;1.2" dur="2s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
                            </motion.circle>
                        ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    <AnimatePresence>
                        {hoveredNode !== null && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute top-4 left-4 glass-panel p-4 rounded-xl border-red-500/20 max-w-xs z-10"
                            >
                                <div className="text-[8px] font-mono text-red-500/60 uppercase mb-1">Circadian Violation</div>
                                <div className="text-xs font-bold text-white mb-1">{points[hoveredNode].author} committed at {points[hoveredNode].hour}:00</div>
                                <div className="text-[10px] text-red-300/60 line-clamp-2 italic">"{points[hoveredNode].message}"</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute bottom-2 right-4 text-[8px] font-mono text-red-900/40 uppercase tracking-[0.2em]">
                        Neural Mapping of Exhaustion
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <div className="text-[8px] font-mono text-red-500/40 uppercase mb-1">Night Violations</div>
                        <div className="text-xl font-black text-red-200">{circadianViolations.length}</div>
                        <div className="text-[9px] text-red-400/30 mt-1">Commits between 1AM - 5AM</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <div className="text-[8px] font-mono text-red-500/40 uppercase mb-1">Weekend Sacrifices</div>
                        <div className="text-xl font-black text-red-200">{weekendSacrifices.length}</div>
                        <div className="text-[9px] text-red-400/30 mt-1">Saturday and Sunday work sessions</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <div className="text-[8px] font-mono text-red-500/40 uppercase mb-1">Fatigue Echoes</div>
                        <div className="text-xl font-black text-red-200">{fatigueSignals.length}</div>
                        <div className="text-[9px] text-red-400/30 mt-1">Exhaustion keywords in history</div>
                    </div>
                </div>

                {/* Fatigue Signal Fragments */}
                {fatigueSignals.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-red-900/10">
                        <div className="text-[9px] font-mono text-red-500/40 uppercase tracking-widest mb-4">Fragments of the Exhausted</div>
                        <div className="flex flex-wrap gap-2">
                            {fatigueSignals.slice(0, 6).map((s, i) => (
                                <div key={i} className="px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/10 text-[10px] text-red-300/60 italic">
                                    "{s.message.length > 40 ? s.message.substring(0, 40) + '...' : s.message}"
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
