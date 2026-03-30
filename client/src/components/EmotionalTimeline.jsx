import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOTION_COLORS = {
    euphoria: '#4ade80',
    momentum: '#60a5fa',
    stress: '#f97316',
    crisis: '#ef4444',
    exhaustion: '#a78bfa',
    grief: '#f472b6',
    recovery: '#34d399',
    neutral: 'rgba(0,229,255,0.5)',
};

const EMOTION_LABELS = {
    euphoria: '🌟 Euphoria',
    momentum: '🚀 Momentum',
    stress: '⚡ Stress',
    crisis: '🔥 Crisis',
    exhaustion: '😮‍💨 Exhaustion',
    grief: '💔 Grief',
    recovery: '🌱 Recovery',
    neutral: '➖ Neutral',
};

export default function EmotionalTimeline({ data }) {
    const [hovered, setHovered] = useState(null);
    const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
    const svgRef = useRef(null);

    if (!data?.events?.length) return null;

    const { events, arc, peakEmotion, lowestPoint, summary, moodScore } = data;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build SVG path from mood values
    const W = 700, H = 120;
    const pts = sorted.map((e, i) => {
        const x = (i / Math.max(sorted.length - 1, 1)) * W;
        const y = H - ((e.moodValue ?? 50) / 100) * H;
        return { x, y, ...e };
    });

    const pathD = pts.length > 1
        ? pts.map((p, i) => {
            if (i === 0) return `M ${p.x},${p.y}`;
            const prev = pts[i - 1];
            const cpx = (prev.x + p.x) / 2;
            return `C ${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
        }).join(' ')
        : '';

    const fillD = pathD
        ? `${pathD} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(8,5,16,0.98) 0%, rgba(5,3,12,0.98) 100%)',
                boxShadow: '0 0 60px rgba(139,92,246,0.03), inset 0 0 80px rgba(0,0,0,0.6)',
            }}
        >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-technical tracking-tighter uppercase leading-none">Psychological_Trajectory</h3>
                            <p className="text-[10px] text-violet-500/30 font-technical tracking-[0.5em] uppercase font-bold mt-2">
                                Emotional_Biofeedback_Forensics // v4.1
                            </p>
                        </div>
                    </div>
                    {moodScore !== undefined && (
                        <div className="text-right">
                            <div className="text-[8px] font-technical text-violet-500/40 font-bold uppercase tracking-[0.1em] mb-1">STABILITY_INDEX</div>
                            <div className="text-4xl font-bold font-technical tracking-tighter holographic-bloom" style={{
                                color: moodScore >= 60 ? '#4ade80' : moodScore >= 35 ? '#fbbf24' : '#f87171',
                            }}>{moodScore}</div>
                        </div>
                    )}
                </div>

                {summary && (
                    <p style={{ fontSize: 12, color: 'rgba(255,240,255,0.5)', margin: '14px 0 0', lineHeight: 1.6, fontStyle: 'italic', maxWidth: 600 }}>
                        {summary}
                    </p>
                )}
            </div>

            {/* SVG mood graph */}
            <div style={{ padding: '24px 32px 8px', position: 'relative', overflowX: 'auto' }}>
                <div style={{ fontSize: 8, color: 'rgba(167,139,250,0.3)', fontFamily: 'monospace', letterSpacing: '0.2em', marginBottom: 8 }}>
                    EMOTIONAL TRAJECTORY — {sorted.length} EVENTS PLOTTED
                </div>
                <svg
                    ref={svgRef}
                    width="100%"
                    viewBox={`0 0 ${W} ${H + 10}`}
                    style={{ display: 'block', overflow: 'visible' }}
                >
                    <defs>
                        <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(167,139,250,0.3)" />
                            <stop offset="100%" stopColor="rgba(167,139,250,0)" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[25, 50, 75].map(pct => (
                        <line
                            key={pct}
                            x1={0} y1={H - (pct / 100) * H}
                            x2={W} y2={H - (pct / 100) * H}
                            stroke="rgba(167,139,250,0.06)" strokeWidth={1}
                        />
                    ))}

                    {/* Fill area */}
                    {fillD && (
                        <motion.path
                            d={fillD}
                            fill="url(#moodFill)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                        />
                    )}

                    {/* Line */}
                    {pathD && (
                        <motion.path
                            d={pathD}
                            fill="none"
                            stroke="rgba(167,139,250,0.6)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                            style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.4))' }}
                        />
                    )}

                    {/* Data points */}
                    {pts.map((pt, i) => {
                        const col = EMOTION_COLORS[pt.emotion] || EMOTION_COLORS.neutral;
                        return (
                            <g key={i}>
                                <circle
                                    cx={pt.x} cy={pt.y} r={hovered === i ? 8 : 5}
                                    fill={col}
                                    opacity={hovered === i ? 1 : 0.75}
                                    style={{ cursor: 'pointer', transition: 'r 0.15s, opacity 0.15s', filter: `drop-shadow(0 0 6px ${col})` }}
                                    onMouseEnter={(e) => {
                                        setHovered(i);
                                        const rect = svgRef.current?.getBoundingClientRect();
                                        setTooltip({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) });
                                    }}
                                    onMouseLeave={() => setHovered(null)}
                                />
                                {/* Spike line for crisis events */}
                                {pt.emotion === 'crisis' && (
                                    <line
                                        x1={pt.x} y1={pt.y - 8} x2={pt.x} y2={pt.y - 22}
                                        stroke="#ef4444" strokeWidth={1.5} opacity={0.6}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                <AnimatePresence>
                    {hovered !== null && pts[hovered] && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                position: 'absolute',
                                left: Math.min(tooltip.x + 12, 400),
                                top: tooltip.y - 60,
                                pointerEvents: 'none', zIndex: 10,
                                background: 'rgba(8,5,20,0.95)',
                                border: `1px solid ${EMOTION_COLORS[pts[hovered].emotion] || '#8b5cf6'}40`,
                                borderRadius: 10, padding: '8px 12px', minWidth: 160,
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <div style={{ fontSize: 10, fontWeight: 700, color: EMOTION_COLORS[pts[hovered].emotion] || '#a78bfa', marginBottom: 3 }}>
                                {EMOTION_LABELS[pts[hovered].emotion] || pts[hovered].emotion}
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginBottom: 4 }}>
                                {pts[hovered].date ? new Date(pts[hovered].date).toLocaleDateString() : ''}
                            </div>
                            {pts[hovered].description && (
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{pts[hovered].description}</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Peak and lowest */}
            <div style={{ padding: '16px 32px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {peakEmotion && (
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                        <div style={{ fontSize: 8, color: 'rgba(74,222,128,0.5)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 6 }}>
                            PEAK MOMENT
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{EMOTION_LABELS[peakEmotion.emotion] || peakEmotion.emotion}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.4 }}>
                            {peakEmotion.description || `Best period: ${peakEmotion.date ? new Date(peakEmotion.date).toLocaleDateString() : 'Unknown'}`}
                        </div>
                    </div>
                )}
                {lowestPoint && (
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <div style={{ fontSize: 8, color: 'rgba(239,68,68,0.5)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 6 }}>
                            LOWEST POINT
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{EMOTION_LABELS[lowestPoint.emotion] || lowestPoint.emotion}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.4 }}>
                            {lowestPoint.description || `Hardest period: ${lowestPoint.date ? new Date(lowestPoint.date).toLocaleDateString() : 'Unknown'}`}
                        </div>
                    </div>
                )}
            </div>

            {/* Emotion legend */}
            <div style={{ padding: '12px 32px 20px', borderTop: '1px solid rgba(167,139,250,0.06)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {Object.entries(EMOTION_LABELS).slice(0, 6).map(([key, label]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: EMOTION_COLORS[key] }} />
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{label}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
