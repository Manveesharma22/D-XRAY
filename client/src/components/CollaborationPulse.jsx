import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#00e5ff', '#f59e0b', '#a78bfa', '#34d399', '#fb7185', '#fb923c'];

export default function CollaborationPulse({ data }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const [hoveredContributor, setHoveredContributor] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data?.contributors?.length) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const contributors = data.contributors.slice(0, 6);
        const buckets = contributors[0]?.pulseData?.length || 30;
        const segW = w / (buckets - 1);
        const rowH = h / (contributors.length + 0.5);

        let offset = 0;

        // Build conflict map: buckets where 2+ contributors are active
        const conflictBuckets = new Set();
        for (let b = 0; b < buckets; b++) {
            const active = contributors.filter(c => (c.pulseData?.[b] || 0) > 0.45).length;
            if (active >= 2) conflictBuckets.add(b);
        }

        // Build sync map: buckets where all active contributors match
        const syncBuckets = new Set();
        for (let b = 0; b < buckets; b++) {
            const vals = contributors.map(c => c.pulseData?.[b] || 0);
            const allHigh = vals.every(v => v > 0.5);
            if (allHigh && contributors.length >= 2) syncBuckets.add(b);
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);

            // Background grid
            ctx.strokeStyle = 'rgba(0,229,255,0.025)';
            ctx.lineWidth = 0.5;
            for (let gy = 0; gy < h; gy += rowH) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
            }

            // Sync zone: golden glow across all lines
            syncBuckets.forEach(b => {
                if (b >= buckets - 1) return;
                const x = b * segW;
                const grad = ctx.createLinearGradient(x, 0, x + segW, 0);
                grad.addColorStop(0, 'rgba(245,200,80,0)');
                grad.addColorStop(0.3, 'rgba(245,200,80,0.07)');
                grad.addColorStop(0.7, 'rgba(245,200,80,0.07)');
                grad.addColorStop(1, 'rgba(245,200,80,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 0, segW, h);
            });

            // Conflict zone: red flush
            conflictBuckets.forEach(b => {
                if (syncBuckets.has(b)) return; // sync > conflict
                const x = b * segW;
                ctx.fillStyle = 'rgba(251,113,133,0.05)';
                ctx.fillRect(x - 3, 0, 7, h);
            });

            // Draw each contributor line
            contributors.forEach((contributor, ci) => {
                const pulseData = contributor.pulseData || [];
                const color = contributor.color || COLORS[ci % COLORS.length];
                const baseY = rowH * (ci + 0.75); // each line stacked in its own row
                const isHovered = hoveredContributor === null || hoveredContributor === ci;
                const alpha = isHovered ? 0.92 : 0.25;

                ctx.strokeStyle = color;
                ctx.lineWidth = 1.8;
                ctx.shadowColor = color;
                ctx.shadowBlur = isHovered ? 8 : 2;
                ctx.globalAlpha = alpha;
                ctx.beginPath();

                for (let b = 0; b < buckets; b++) {
                    const x = b * segW;
                    const val = pulseData[b] || 0;
                    const isConflict = conflictBuckets.has(b) && val > 0.3 && !syncBuckets.has(b);
                    const isSync = syncBuckets.has(b) && val > 0.4;

                    let y;
                    if (isSync) {
                        // Sync: converge all lines toward center, gentle shared wave
                        const centerY = h / 2;
                        const pull = 0.6;
                        const t = (b * 2 + offset) % (Math.PI * 2);
                        y = baseY * (1 - pull) + centerY * pull + Math.sin(t * 0.5) * 10 * val;
                    } else if (isConflict) {
                        // Conflict: lines diverge away from each other and spike
                        const direction = ci % 2 === 0 ? -1 : 1;
                        const spike = Math.sin((b * 1.6 + offset * 0.06)) * 24 * val;
                        y = baseY + direction * spike;
                    } else if (val > 0.5) {
                        // High activity: EKG shape
                        const t = (b * 2.5 + offset) % 18;
                        if (t < 1) y = baseY - t * 12 * val;
                        else if (t < 2.5) y = baseY - 12 * val + (t - 1) * 9 * val;
                        else if (t < 4) y = baseY + 3 * val - (t - 2.5) * 2 * val;
                        else y = baseY + Math.sin(t * 0.35) * 2 * val;
                    } else {
                        // Idle: gentle sine drift
                        y = baseY + Math.sin((b * 0.7 + offset * 0.018 + ci * 1.2)) * 4 * (val + 0.15);
                    }

                    if (b === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Contributor label on left axis
                ctx.shadowBlur = 0;
                ctx.globalAlpha = isHovered ? 0.5 : 0.15;
                ctx.fillStyle = color;
                ctx.font = `${dpr > 1 ? 8 : 8}px monospace`;
                ctx.textAlign = 'right';
                ctx.fillText(contributor.name?.split(' ')[0] || `dev${ci}`, 42, baseY + 3);

                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            });

            // Sync bloom: if all lines fully synced, pulse a golden ring
            if (syncBuckets.size > 3) {
                const centerX = (offset * 0.4) % w;
                const grad = ctx.createRadialGradient(centerX, h / 2, 0, centerX, h / 2, 60);
                grad.addColorStop(0, 'rgba(245,200,80,0.08)');
                grad.addColorStop(1, 'rgba(245,200,80,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            offset += 0.7;
            animRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [data, hoveredContributor]);

    if (!data?.contributors?.length) return null;

    const syncPct = data.syncScore ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Collaboration Pulse</span>
                </div>
                <div className="flex items-center gap-3">
                    {syncPct > 0 && (
                        <span className="text-[10px] font-mono text-amber-400/60">
                            {syncPct}% in sync
                        </span>
                    )}
                    <span className="text-[10px] font-mono text-cyan-800/30">{data.contributors.length} contributors</span>
                </div>
            </div>

            {/* Legend — hover to isolate */}
            <div className="flex flex-wrap gap-3 mb-3">
                {data.contributors.map((c, i) => {
                    const color = c.color || COLORS[i % COLORS.length];
                    return (
                        <button
                            key={i}
                            onMouseEnter={() => setHoveredContributor(i)}
                            onMouseLeave={() => setHoveredContributor(null)}
                            className="flex items-center gap-1.5 transition-opacity"
                            style={{ opacity: hoveredContributor === null || hoveredContributor === i ? 1 : 0.3 }}
                        >
                            <div className="w-4 h-[2px] rounded" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-mono" style={{ color: `${color}80` }}>{c.name}</span>
                        </button>
                    );
                })}
            </div>

            <canvas
                ref={canvasRef}
                className="w-full rounded-lg"
                style={{ background: 'rgba(0,0,0,0.35)', height: 180 }}
            />

            {/* Zone legend */}
            <div className="flex gap-4 mt-2 text-[9px] font-mono">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(245,200,80,0.3)' }} />
                    <span className="text-amber-400/40">Synchronized work</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(251,113,133,0.25)' }} />
                    <span className="text-rose-400/40">Conflict zone</span>
                </span>
            </div>

            {data.conflicts?.length > 0 && (
                <div className="mt-3 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                    <p className="text-[10px] font-mono text-rose-400/50">
                        {data.conflicts.length} conflict zone{data.conflicts.length > 1 ? 's' : ''} detected — lines spike against each other when contributors touch the same files
                    </p>
                </div>
            )}
            {data.finding && (
                <p className="text-xs text-cyan-800/40 mt-2 leading-relaxed italic">{data.finding}</p>
            )}
        </motion.div>
    );
}
