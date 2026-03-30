import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_STYLES = {
    critical: { color: '#ff4444', glow: 'rgba(255,68,68,0.35)', label: 'CRITICAL', bg: 'bg-red-500/5', border: 'border-red-500/15' },
    acute: { color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', label: 'ACUTE', bg: 'bg-amber-500/5', border: 'border-amber-500/15' },
    mild: { color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', label: 'MILD', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
};

// Mini bar for commit velocity during trauma window
function MiniVelocityBar({ value, max, color }) {
    const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
    return (
        <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full rounded-sm overflow-hidden" style={{ height: 20, background: 'rgba(0,0,0,0.3)' }}>
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full rounded-sm"
                    style={{
                        background: color,
                        alignSelf: 'flex-end',
                        display: 'block',
                        marginTop: `${100 - pct}%`,
                    }}
                />
            </div>
            <span className="text-[7px] font-mono" style={{ color: `${color}60` }}>{value}</span>
        </div>
    );
}

// Animated fracture mark with radiating crack lines
function ScarMark({ event, x, isActive, onClick }) {
    const style = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.mild;
    const size = event.severity === 'critical' ? 1.4 : event.severity === 'acute' ? 1.1 : 0.8;

    return (
        <g className="cursor-pointer" onClick={onClick} style={{ filter: isActive ? `drop-shadow(0 0 8px ${style.color})` : 'none' }}>
            {/* Bone fracture — main crack */}
            <line x1={x} y1={6} x2={x - 5 * size} y2={16} stroke={style.color} strokeWidth={isActive ? 2.5 : 2} strokeDasharray="3 1.5" />
            <line x1={x - 5 * size} y1={16} x2={x + 4 * size} y2={26} stroke={style.color} strokeWidth={isActive ? 2.5 : 2} strokeDasharray="3 1.5" />
            <line x1={x + 4 * size} y1={26} x2={x - 3 * size} y2={36} stroke={style.color} strokeWidth={isActive ? 2 : 1.5} strokeDasharray="2 2" />
            {/* Radiating crack lines */}
            {event.severity === 'critical' && (
                <>
                    <line x1={x - 3} y1={14} x2={x - 14} y2={10} stroke={style.color} strokeWidth="0.8" opacity="0.4" />
                    <line x1={x + 2} y1={20} x2={x + 12} y2={14} stroke={style.color} strokeWidth="0.8" opacity="0.4" />
                    <line x1={x} y1={28} x2={x - 8} y2={34} stroke={style.color} strokeWidth="0.6" opacity="0.3" />
                </>
            )}
            {/* Pulse ring on active */}
            {isActive && (
                <circle cx={x} cy={21} r={14} fill="none" stroke={style.color} strokeWidth={1} opacity={0.35}>
                    <animate attributeName="r" values="14;22;14" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="1.8s" repeatCount="indefinite" />
                </circle>
            )}
            {/* Severity dot */}
            <circle cx={x} cy={21} r={3 * size} fill={style.color} opacity={0.7} />
        </g>
    );
}

export default function TraumaTimeline({ data }) {
    const [activeEvent, setActiveEvent] = useState(null);

    if (!data?.traumaEvents?.length) return null;

    const events = data.traumaEvents.slice(0, 8);
    const totalWidth = 800;
    const startDate = new Date(events[events.length - 1]?.date || Date.now()).getTime();
    const endDate = new Date(events[0]?.date || Date.now()).getTime();
    const range = Math.max(endDate - startDate, 7 * 24 * 60 * 60 * 1000);

    const getX = (dateStr) => {
        const t = new Date(dateStr).getTime();
        return 50 + ((t - startDate) / range) * (totalWidth - 100);
    };

    const active = events.find(e => e.date === activeEvent);
    const maxCommits = Math.max(...events.map(e => e.commitCount || 1), 1);
    const style = active ? (SEVERITY_STYLES[active.severity] || SEVERITY_STYLES.mild) : null;

    // Build narrative text from event data
    function buildNarrative(event) {
        if (event.summary) return event.summary;
        const parts = [];
        if (event.displayDate) parts.push(`${event.displayDate} —`);
        if (event.commitCount) parts.push(`${event.commitCount} commits in ${event.windowDays || 7} days.`);
        if (event.revertCount > 0) parts.push(`${event.revertCount} reverts.`);
        if (event.messageLengthDrop > 20) parts.push(`Average commit message length dropped ${event.messageLengthDrop}%.`);
        if (event.topCommitter) parts.push(`${event.topCommitter} carried the weight.`);
        return parts.join(' ') || 'Trauma event detected.';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Trauma Timeline</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-cyan-400/50">
                    <span className="text-red-400/70">{events.filter(e => e.severity === 'critical').length} critical</span>
                    <span className="text-amber-400/50">{events.filter(e => e.severity !== 'critical').length} acute</span>
                </div>
            </div>

            {/* SVG Timeline */}
            <div className="overflow-x-auto">
                <svg width="100%" viewBox={`0 0 ${totalWidth} 54`} className="w-full" style={{ minWidth: 400 }}>
                    {/* Bone-style timeline spine — thick with gradient */}
                    <defs>
                        <linearGradient id="spineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(0,229,255,0)" />
                            <stop offset="8%" stopColor="rgba(0,229,255,0.18)" />
                            <stop offset="92%" stopColor="rgba(0,229,255,0.18)" />
                            <stop offset="100%" stopColor="rgba(0,229,255,0)" />
                        </linearGradient>
                    </defs>
                    {/* Bone body */}
                    <rect x={30} y={17} width={totalWidth - 60} height={6} rx={3} fill="url(#spineGrad)" />
                    {/* Bone end caps */}
                    <circle cx={30} cy={20} r={6} fill="rgba(0,229,255,0.12)" stroke="rgba(0,229,255,0.2)" strokeWidth={1} />
                    <circle cx={totalWidth - 30} cy={20} r={6} fill="rgba(0,229,255,0.12)" stroke="rgba(0,229,255,0.2)" strokeWidth={1} />

                    {/* Date labels */}
                    {events.length > 0 && (
                        <>
                            <text x={30} y={50} fontSize={10} fill="rgba(0,229,255,0.2)" textAnchor="middle">
                                {new Date(events[events.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                            </text>
                            <text x={totalWidth - 30} y={50} fontSize={10} fill="rgba(0,229,255,0.2)" textAnchor="middle">
                                {new Date(events[0]?.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                            </text>
                        </>
                    )}

                    {/* Scar marks */}
                    {events.map((event, i) => (
                        <ScarMark
                            key={i}
                            event={event}
                            x={getX(event.date)}
                            isActive={activeEvent === event.date}
                            onClick={() => setActiveEvent(activeEvent === event.date ? null : event.date)}
                        />
                    ))}
                </svg>
            </div>

            {/* Trauma Card */}
            <AnimatePresence>
                {active && style && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2"
                    >
                        <div className={`p-5 rounded-xl border ${style.bg} ${style.border}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: style.color }}>
                                        {style.label} TRAUMA EVENT
                                    </div>
                                    <div className="text-sm font-bold text-white">{active.displayDate}</div>
                                </div>
                                <button onClick={() => setActiveEvent(null)} className="text-cyan-400/50 hover:text-cyan-600/50 transition-colors text-lg">✕</button>
                            </div>

                            {/* Full narrative paragraph */}
                            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                                "{buildNarrative(active)}"
                            </p>

                            {/* Metrics row */}
                            <div className="flex flex-wrap gap-4 text-[10px] font-mono mb-4">
                                {active.commitCount && <span className="text-cyan-800/50">{active.commitCount} commits</span>}
                                {active.revertCount > 0 && <span className="text-red-400/60">{active.revertCount} reverts</span>}
                                {active.topCommitter && <span style={{ color: `${style.color}70` }}>peak: {active.topCommitter}</span>}
                                {active.messageLengthDrop > 20 && <span className="text-rose-400/60">msg quality ↓{active.messageLengthDrop}%</span>}
                                {active.windowDays && <span className="text-cyan-400/50">{active.windowDays}-day window</span>}
                            </div>

                            {/* Recovery indicator */}
                            {active.recovered !== undefined && (
                                <div className={`flex items-center gap-2 text-[10px] font-mono ${active.recovered ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
                                    <span>{active.recovered ? '↑' : '↓'}</span>
                                    <span>{active.recovered ? 'Codebase recovered after this event' : 'Test coverage never fully recovered after this event'}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!activeEvent && (
                <p className="text-xs text-cyan-400/50 font-mono mt-2">Click a fracture mark to expand the trauma report</p>
            )}

            {data.finding && (
                <p className="text-sm text-cyan-400/60 mt-4 leading-relaxed italic border-t border-cyan-900/10 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
