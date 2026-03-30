import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const HOUR_LABELS = ['12a', '', '', '3a', '', '', '6a', '', '', '9a', '', '', '12p', '', '', '3p', '', '', '6p', '', '', '9p', '', ''];

const SLEEP_STAGES = [
    { label: 'CRISIS', color: '#ef4444', hours: [22, 23, 0, 1, 2] },
    { label: 'LIGHT WORK', color: '#f59e0b', hours: [8, 9, 17, 18, 19] },
    { label: 'DEEP WORK', color: '#34d399', hours: [10, 11, 12, 13, 14] },
    { label: 'REM', color: '#6366f1', hours: [15, 16] },
];

function getWaveType(wavePattern, activity, revertRate) {
    if (!wavePattern) {
        if (activity < 10) return 'flatline';
        if (activity > 60 && revertRate < 15) return 'deep_work';
        if (revertRate > 25) return 'crisis';
        return 'normal';
    }
    return wavePattern.type || 'normal';
}

export default function SleepStudy({ data }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    // Animated EEG wave on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data?.hourlyActivity?.length) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const maxActivity = Math.max(...data.hourlyActivity, 1);
        let t = 0;

        function draw() {
            ctx.clearRect(0, 0, w, h);

            // Grid lines
            ctx.strokeStyle = 'rgba(100,200,255,0.03)';
            ctx.lineWidth = 1;
            for (let gy = 0; gy < h; gy += h / 4) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
            }

            // Build path
            ctx.beginPath();
            data.hourlyActivity.forEach((v, i) => {
                const x = (i / 23) * w;
                const waveType = getWaveType(data.wavePattern?.[i], v, data.hourlyRevertRate?.[i] || 0);
                const revertRate = data.hourlyRevertRate?.[i] || 0;

                let y;
                if (waveType === 'flatline') {
                    y = h / 2 + Math.sin(t * 0.5 + i) * 1.5;
                } else if (waveType === 'crisis') {
                    y = h / 2 - (v / maxActivity) * (h * 0.72)
                        + Math.sin(i * 2.4 + t * 1.5) * 7
                        + Math.cos(i * 1.1 + t) * 4;
                } else if (waveType === 'deep_work') {
                    y = h / 2 - (v / maxActivity) * (h * 0.5) + Math.sin(i * 0.8 + t * 0.4) * 3;
                } else {
                    y = h / 2 - (v / maxActivity) * (h * 0.38) + Math.sin(i * 1.2 + t * 0.6) * 2;
                }

                // Color per wave type
                const color = waveType === 'flatline' ? 'rgba(100,116,139,0.5)'
                    : waveType === 'crisis' ? `rgba(239,68,68,${0.5 + (revertRate / 100) * 0.4})`
                        : waveType === 'deep_work' ? 'rgba(52,211,153,0.8)'
                            : 'rgba(99,102,241,0.6)';

                if (i === 0) { ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(x, y); }
                else ctx.lineTo(x, y);
            });

            // Glow stroke
            ctx.strokeStyle = 'rgba(99,102,241,0.6)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = 'rgba(99,102,241,0.4)';
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Re-draw with color segments
            data.hourlyActivity.forEach((v, i) => {
                if (i === 0) return;
                const prevV = data.hourlyActivity[i - 1];
                const x1 = ((i - 1) / 23) * w;
                const x2 = (i / 23) * w;
                const waveType = getWaveType(data.wavePattern?.[i], v, data.hourlyRevertRate?.[i] || 0);
                const revertRate = data.hourlyRevertRate?.[i] || 0;

                const getY = (val, wi) => {
                    const wt = getWaveType(data.wavePattern?.[wi], val, data.hourlyRevertRate?.[wi] || 0);
                    if (wt === 'flatline') return h / 2 + Math.sin(t * 0.5 + wi) * 1.5;
                    if (wt === 'crisis') return h / 2 - (val / maxActivity) * (h * 0.72) + Math.sin(wi * 2.4 + t * 1.5) * 7;
                    if (wt === 'deep_work') return h / 2 - (val / maxActivity) * (h * 0.5) + Math.sin(wi * 0.8 + t * 0.4) * 3;
                    return h / 2 - (val / maxActivity) * (h * 0.38) + Math.sin(wi * 1.2 + t * 0.6) * 2;
                };

                const color = waveType === 'flatline' ? 'rgba(100,116,139,0.35)'
                    : waveType === 'crisis' ? `rgba(239,68,68,${0.55 + (revertRate / 100) * 0.45})`
                        : waveType === 'deep_work' ? 'rgba(52,211,153,0.85)'
                            : 'rgba(99,102,241,0.65)';

                ctx.beginPath();
                ctx.moveTo(x1, getY(prevV, i - 1));
                ctx.lineTo(x2, getY(v, i));
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.shadowColor = color;
                ctx.shadowBlur = waveType === 'crisis' ? 6 : waveType === 'deep_work' ? 4 : 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            });

            t += 0.04;
            animRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [data]);

    if (!data?.hourlyActivity?.length) return null;

    const maxActivity = Math.max(...data.hourlyActivity, 1);

    const formatHour = (h) => {
        if (h === 0) return '12am';
        if (h < 12) return `${h}am`;
        if (h === 12) return '12pm';
        return `${h - 12}pm`;
    };

    // Build bedtime insight
    function buildBedtimeInsight() {
        if (data.bedtimeInsight) return data.bedtimeInsight;
        const best = data.bestHour;
        const inc = data.incidentCorrelation;
        if (!best && !inc) return null;
        const parts = [];
        if (best !== undefined) parts.push(`This team does its best work around ${formatHour(best)}.`);
        if (inc > 0) parts.push(`${inc}% of incidents were introduced in commits made after ${formatHour(data.worstHour || 19)}.`);
        parts.push(`The codebase has a bedtime. Nobody is respecting it.`);
        return parts.join(' ');
    }

    const bedtimeInsight = buildBedtimeInsight();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Sleep Study — 24h Activity</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    {data.bestHour !== undefined && (
                        <span className="text-emerald-400/60 font-bold">peak: {formatHour(data.bestHour)}</span>
                    )}
                    {data.incidentCorrelation > 0 && (
                        <span className="text-red-400/60 font-bold">{data.incidentCorrelation}% incidents post-{formatHour(data.worstHour || 18)}</span>
                    )}
                </div>
            </div>

            {/* Animated EEG canvas */}
            <div className="mb-3 rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', height: 80 }}>
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* 24-column heatmap */}
            <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
                {data.hourlyActivity.map((v, i) => {
                    const waveType = getWaveType(data.wavePattern?.[i], v, data.hourlyRevertRate?.[i] || 0);
                    const revertRate = data.hourlyRevertRate?.[i] || 0;
                    const height = Math.max(4, Math.round((v / maxActivity) * 56));
                    const isBest = i === data.bestHour;
                    const isWorst = i === data.worstHour && v > 20;
                    const isGolden = data.bestHour !== undefined && Math.abs(i - data.bestHour) <= 1;

                    let gradient;
                    if (waveType === 'flatline') gradient = 'rgba(100,116,139,0.18)';
                    else if (waveType === 'crisis') gradient = revertRate > 40 ? 'linear-gradient(to top, rgba(239,68,68,0.8), rgba(245,158,11,0.5))' : 'rgba(245,158,11,0.55)';
                    else if (waveType === 'deep_work') gradient = 'linear-gradient(to top, rgba(52,211,153,0.8), rgba(16,185,129,0.4))';
                    else gradient = 'linear-gradient(to top, rgba(99,102,241,0.6), rgba(129,140,248,0.3))';

                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center relative"
                            title={`${formatHour(i)}: ${v}% activity${revertRate > 0 ? `, ${revertRate}% incident rate` : ''}`}
                        >
                            {isGolden && !isWorst && (
                                <div className="absolute inset-0 rounded-sm pointer-events-none" style={{ background: 'rgba(245,200,80,0.07)', boxShadow: '0 0 6px rgba(245,200,80,0.15)' }} />
                            )}
                            <div
                                className="w-full rounded-sm transition-all"
                                style={{
                                    height,
                                    background: gradient,
                                    boxShadow: isBest ? '0 0 6px rgba(52,211,153,0.4)' : isWorst ? '0 0 6px rgba(239,68,68,0.3)' : 'none',
                                }}
                            />
                            {isBest && <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />}
                            {isWorst && v > 20 && <div className="w-1 h-1 rounded-full bg-red-400 mt-0.5" />}
                        </div>
                    );
                })}
            </div>

            {/* Hour labels */}
            <div className="grid mb-3" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
                {HOUR_LABELS.map((label, i) => (
                    <div key={i} className="text-center text-[10px] font-mono text-cyan-900/30">{label}</div>
                ))}
            </div>

            {/* Bedtime Insight — the main callout */}
            {bedtimeInsight && (
                <div className="mb-3 px-4 py-3 rounded-xl" style={{
                    background: 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.12)',
                    borderLeft: '3px solid rgba(99,102,241,0.3)',
                }}>
                    <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(165,180,252,0.65)' }}>
                        {bedtimeInsight}
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(52,211,153,0.7)' }} />Deep work</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(99,102,241,0.6)' }} />Normal</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(245,158,11,0.6)' }} />Crisis</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(239,68,68,0.7)' }} />High incident</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(245,200,80,0.3)' }} />Golden hours</span>
            </div>

            {data.finding && (
                <p className="text-sm text-cyan-800/40 leading-relaxed italic border-t border-cyan-900/10 pt-3 mt-4">{data.finding}</p>
            )}
        </motion.div>
    );
}
