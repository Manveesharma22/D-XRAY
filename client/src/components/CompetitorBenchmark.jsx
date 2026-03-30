import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = ['CI Health', 'Test Coverage', 'Documentation', 'Dev Velocity', 'Code Review', 'Onboarding', 'Dependencies', 'Environment'];

function RadarChart({ scores, comparisons }) {
    const N = CATEGORIES.length;
    const cx = 160, cy = 160, R = 120;
    const angleStep = (2 * Math.PI) / N;

    const polarToXY = (angle, r) => ({
        x: cx + r * Math.sin(angle),
        y: cy - r * Math.cos(angle),
    });

    const ownPoints = CATEGORIES.map((_, i) => {
        const s = scores[i] ?? 50;
        const p = polarToXY(i * angleStep, (s / 100) * R);
        return `${p.x},${p.y}`;
    }).join(' ');

    return (
        <svg width={320} height={320} viewBox="0 0 320 320" style={{ display: 'block', margin: '0 auto' }}>
            {/* Grid rings */}
            {[25, 50, 75, 100].map(pct => (
                <polygon
                    key={pct}
                    points={CATEGORIES.map((_, i) => {
                        const p = polarToXY(i * angleStep, (pct / 100) * R);
                        return `${p.x},${p.y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(0,229,255,0.06)"
                    strokeWidth={1}
                />
            ))}

            {/* Spokes */}
            {CATEGORIES.map((_, i) => {
                const outer = polarToXY(i * angleStep, R);
                return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(0,229,255,0.06)" strokeWidth={1} />;
            })}

            {/* Competitor fills */}
            {comparisons?.map((comp, ci) => {
                const pts = CATEGORIES.map((_, i) => {
                    const s = comp.scores?.[i] ?? 50;
                    const p = polarToXY(i * angleStep, (s / 100) * R);
                    return `${p.x},${p.y}`;
                }).join(' ');
                return (
                    <polygon
                        key={ci}
                        points={pts}
                        fill={`${comp.color || 'rgba(100,100,100'}0.04)`}
                        stroke={comp.color || 'rgba(150,150,150,0.2)'}
                        strokeWidth={1}
                        strokeDasharray="4 2"
                    />
                );
            })}

            {/* Own fill */}
            <motion.polygon
                points={ownPoints}
                fill="rgba(0,229,255,0.08)"
                stroke="#00e5ff"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.3))' }}
            />

            {/* Own points */}
            {CATEGORIES.map((cat, i) => {
                const s = scores[i] ?? 50;
                const p = polarToXY(i * angleStep, (s / 100) * R);
                const label = polarToXY(i * angleStep, R + 18);
                return (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={3} fill="#00e5ff" style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.6))' }} />
                        <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
                            style={{ fontSize: 8, fill: 'rgba(0,229,255,0.4)', fontFamily: 'monospace' }}>
                            {cat.split(' ')[0]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function CompetitorBenchmark({ data }) {
    const [activeComp, setActiveComp] = useState(null);
    if (!data?.benchmarks?.length) return null;
    const { benchmarks, ownScores, overallRank, percentile, summary } = data;

    const categoryScores = CATEGORIES.map((cat, i) => ownScores?.[i] ?? ownScores?.[cat] ?? 50);

    const comparisons = benchmarks.map((b, i) => ({
        ...b,
        color: ['rgba(234,179,8,0.5)', 'rgba(239,68,68,0.4)', 'rgba(52,211,153,0.4)', 'rgba(167,139,250,0.4)'][i % 4],
        scores: CATEGORIES.map((_, j) => b.scores?.[j] ?? b.scores?.[CATEGORIES[j]] ?? 50),
    }));

    const rankColor = (overallRank ?? 50) <= 25 ? '#4ade80' : (overallRank ?? 50) <= 60 ? '#fbbf24' : '#f87171';

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(3,0,12,0.97) 0%, rgba(6,2,18,0.95) 100%)', border: '1px solid rgba(139,92,246,0.12)', boxShadow: '0 0 50px rgba(139,92,246,0.04)' }}>
            {/* Header */}
            <div style={{ padding: '24px 32px 20px', borderBottom: '1px solid rgba(139,92,246,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Competitor Benchmark</h3>
                        <p style={{ fontSize: 11, color: 'rgba(139,92,246,0.45)', fontFamily: 'monospace', margin: '3px 0 0' }}>How you compare to industry standards</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: 'rgba(139,92,246,0.4)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>INDUSTRY RANK</div>
                    <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                        Top <span style={{ fontSize: 28, fontWeight: 900, color: rankColor }}>{percentile ?? '?'}</span>%
                    </div>
                </div>
            </div>

            {summary && <div style={{ padding: '12px 32px', background: 'rgba(139,92,246,0.03)', borderBottom: '1px solid rgba(139,92,246,0.06)' }}>
                <p style={{ fontSize: 12, color: 'rgba(220,210,255,0.5)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>{summary}</p>
            </div>}

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* Radar */}
                <div>
                    <div style={{ fontSize: 8, color: 'rgba(139,92,246,0.4)', fontFamily: 'monospace', letterSpacing: '0.2em', marginBottom: 12, textAlign: 'center' }}>
                        — RADAR ANALYSIS —
                    </div>
                    <RadarChart scores={categoryScores} comparisons={comparisons} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 2, background: '#00e5ff' }} />
                            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,229,255,0.6)' }}>This repo</span>
                        </div>
                        {comparisons.map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 8, height: 2, background: c.color, borderTop: '1px dashed' }} />
                                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 8, color: 'rgba(139,92,246,0.4)', fontFamily: 'monospace', letterSpacing: '0.2em', marginBottom: 4 }}>
                        — CATEGORY BREAKDOWN —
                    </div>
                    {CATEGORIES.map((cat, i) => {
                        const own = categoryScores[i];
                        const color = own >= 70 ? '#4ade80' : own >= 40 ? '#fbbf24' : '#f87171';
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', width: 80, flexShrink: 0 }}>{cat}</div>
                                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${own}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                        style={{ height: '100%', background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 3 }}
                                    />
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color, width: 28, textAlign: 'right', flexShrink: 0 }}>{own}</div>
                            </div>
                        );
                    })}

                    {/* Overall comparison vs benchmarks */}
                    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                        <div style={{ fontSize: 8, color: 'rgba(139,92,246,0.4)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 10 }}>
                            VS BENCHMARKS
                        </div>
                        {benchmarks.map((bench, i) => {
                            const ownAvg = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length);
                            const benchAvg = Math.round((bench.scores?.reduce?.((a, b) => a + b, 0) ?? 0) / CATEGORIES.length);
                            const diff = ownAvg - benchAvg;
                            return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{bench.name}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: diff >= 0 ? '#4ade80' : '#f87171', fontFamily: 'monospace' }}>
                                        {diff >= 0 ? '+' : ''}{diff}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
