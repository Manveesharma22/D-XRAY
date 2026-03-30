import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#00fbff', '#ffc400', '#a78bfa', '#34d399', '#fb7185', '#fb923c'];

export default function CollaborationPulse({ data, isHealed }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const [hoveredContributor, setHoveredContributor] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data?.contributors?.length) return;

        let isVisible = true;
        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        }, { threshold: 0.1 });
        observer.observe(canvas);

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
        let frame = 0;

        // Build conflict map: buckets where 2+ contributors are active
        const conflictBuckets = new Set();
        if (!isHealed) {
            for (let b = 0; b < buckets; b++) {
                const active = contributors.filter(c => (c.pulseData?.[b] || 0) > 0.45).length;
                if (active >= 2) conflictBuckets.add(b);
            }
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
            ctx.strokeStyle = 'rgba(0, 251, 255, 0.04)';
            ctx.lineWidth = 0.5;
            for (let gy = 0; gy < h; gy += rowH) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
            }

            // Sync zone: golden glow across all lines
            syncBuckets.forEach(b => {
                if (b >= buckets - 1) return;
                const x = b * segW;
                const grad = ctx.createLinearGradient(x, 0, x + segW, 0);
                grad.addColorStop(0, 'rgba(255, 196, 0, 0)');
                grad.addColorStop(0.3, 'rgba(255, 196, 0, 0.12)');
                grad.addColorStop(0.7, 'rgba(255, 196, 0, 0.12)');
                grad.addColorStop(1, 'rgba(255, 196, 0, 0)');
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

                const drawPath = () => {
                    for (let b = 0; b < buckets; b++) {
                        const x = b * segW;
                        const val = pulseData[b] || 0;
                        const isConflict = conflictBuckets.has(b) && val > 0.3 && !syncBuckets.has(b);
                        const isSync = syncBuckets.has(b) && val > 0.4;

                        let y;
                        if (isSync) {
                            const centerY = h / 2;
                            const pull = 0.6;
                            const t = (b * 2 + offset) % (Math.PI * 2);
                            y = baseY * (1 - pull) + centerY * pull + Math.sin(t * 0.5) * 10 * val;
                        } else if (isConflict) {
                            const direction = ci % 2 === 0 ? -1 : 1;
                            const spike = Math.sin((b * 1.6 + offset * 0.06)) * 24 * val;
                            y = baseY + direction * spike;
                        } else if (val > 0.5) {
                            const t = (b * 2.5 + offset) % 18;
                            if (t < 1) y = baseY - t * 12 * val;
                            else if (t < 2.5) y = baseY - 12 * val + (t - 1) * 9 * val;
                            else if (t < 4) y = baseY + 3 * val - (t - 2.5) * 2 * val;
                            else y = baseY + Math.sin(t * 0.35) * 2 * val;
                        } else {
                            y = baseY + Math.sin((b * 0.7 + offset * 0.018 + ci * 1.2)) * 4 * (val + 0.15);
                        }

                        if (b === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                };

                ctx.strokeStyle = color;
                ctx.lineWidth = 1.8;
                ctx.globalAlpha = alpha;

                if (isHovered) {
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    drawPath();
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.beginPath();
                drawPath();

                // Glow pass — bloom
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
                ctx.globalAlpha = alpha * 0.4;
                ctx.stroke();
                ctx.restore();

                // Sharp pass
                ctx.stroke();

                // Contributor label on left axis
                ctx.shadowBlur = 0;
                ctx.globalAlpha = isHovered ? 0.8 : 0.15;
                ctx.fillStyle = color;
                ctx.font = `bold ${dpr > 1 ? 9 : 9}px 'Space Grotesk'`;
                ctx.textAlign = 'right';
                ctx.fillText(contributor.name?.split(' ')[0]?.toUpperCase() || `DEV_${ci}`, 48, baseY + 3);

                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            });

            // Sync bloom: if all lines fully synced, pulse a golden ring
            if (syncBuckets.size > 3 || isHealed) {
                const centerX = isHealed ? w / 2 : (offset * 0.4) % w;
                const grad = ctx.createRadialGradient(centerX, h / 2, 0, centerX, h / 2, isHealed ? w : 60);
                grad.addColorStop(0, isHealed ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 196, 0, 0.12)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            // ─── Draw Scanline ──────────────────────────────────────────────
            const scanX = (frame * 3.5) % w;
            const scanGrad = ctx.createLinearGradient(scanX - 80, 0, scanX, 0);
            scanGrad.addColorStop(0, 'rgba(0,0,0,0)');
            scanGrad.addColorStop(0.5, 'rgba(0, 251, 255, 0.06)');
            scanGrad.addColorStop(1, 'rgba(0, 251, 255, 0.15)');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(scanX - 80, 0, 80, h);

            // Scanline leading edge
            ctx.strokeStyle = 'rgba(0, 251, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(scanX, 0);
            ctx.lineTo(scanX, h);
            ctx.stroke();

            offset += 0.05;

            frame++;
            if (isVisible) animRef.current = requestAnimationFrame(draw);
            else animRef.current = setTimeout(() => { if (isVisible) draw(); }, 1000);
        }

        draw();
        return () => {
            cancelAnimationFrame(animRef.current);
            observer.disconnect();
        };
    }, [data, hoveredContributor]);

    if (!data?.contributors?.length) return null;

    const syncPct = data.syncScore ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_20px_rgba(167,139,250,0.7)] animate-pulse" />
                    <div>
                        <span className="text-[11px] font-technical text-cyan-400/80 tracking-[0.4em] uppercase font-bold block">Subject_Interaction_Pulse</span>
                        <span className="text-[9px] font-technical text-cyan-400/40 tracking-[0.2em] uppercase">Real-time collaboration waveform analysis</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {syncPct > 0 && (
                        <span className="text-[11px] font-technical text-amber-400/80 font-bold tracking-[0.2em] uppercase">
                            {syncPct}%_SYNC_COHERENCE
                        </span>
                    )}
                    <span className="text-[11px] font-technical text-cyan-400/60 tracking-[0.3em] uppercase font-bold">{data.contributors.length}_MONITORED</span>
                </div>
            </div>

            {/* Legend — hover to isolate */}
            <div className="flex flex-wrap gap-4 mb-6">
                {data.contributors.map((c, i) => {
                    const color = c.color || COLORS[i % COLORS.length];
                    return (
                        <button
                            key={i}
                            onMouseEnter={() => setHoveredContributor(i)}
                            onMouseLeave={() => setHoveredContributor(null)}
                            className="flex items-center gap-2.5 transition-all group"
                            style={{ opacity: hoveredContributor === null || hoveredContributor === i ? 1 : 0.15 }}
                        >
                            <div className="w-3.5 h-[4px] rounded-full transition-all group-hover:scale-x-150" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                            <span className="text-[9px] font-technical tracking-[0.1em] uppercase font-bold group-hover:text-white transition-colors" style={{ color: `${color}90` }}>{c.name?.replace(' ', '_')}</span>
                        </button>
                    );
                })}
            </div>

            <canvas
                ref={canvasRef}
                className="w-full rounded-xl border border-cyan-900/10"
                style={{ background: 'rgba(0,0,0,0.5)', height: 220 }}
            />

            {/* Zone legend */}
            <div className="flex gap-6 mt-4 px-2">
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ background: 'rgba(245,200,80,0.35)', border: '1px solid rgba(245,200,80,0.3)' }} />
                    <span className="text-[10px] font-technical font-bold text-amber-400/70 uppercase tracking-wider">Synchronized_Work</span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ background: 'rgba(251,113,133,0.3)', border: '1px solid rgba(251,113,133,0.3)' }} />
                    <span className="text-[10px] font-technical font-bold text-rose-400/70 uppercase tracking-wider">Conflict_Zone</span>
                </span>
            </div>

            {data.conflicts?.length > 0 && !isHealed && (
                <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-rose-500/[0.04] border border-rose-500/10">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0 animate-pulse" />
                    <p className="text-sm font-technical text-rose-300/80 leading-relaxed">
                        {data.conflicts.length} conflict zone{data.conflicts.length > 1 ? 's' : ''} detected — lines spike against each other when contributors touch the same files
                    </p>
                </div>
            )}
            {isHealed && (
                <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <p className="text-sm font-technical text-emerald-300/80 leading-relaxed">
                        Restoration complete — collaborative friction has been reconciled through clinical context.
                    </p>
                </div>
            )}
            {data.finding && (
                <p className="text-sm text-cyan-400/60 mt-4 leading-relaxed font-technical italic p-4 rounded-xl bg-cyan-900/5 border border-cyan-900/10">{data.finding}</p>
            )}
        </motion.div>
    );
}
