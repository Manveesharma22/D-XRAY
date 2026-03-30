import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RISK_COLORS = { high: '#fb7185', medium: '#f59e0b', low: '#34d399' };

export default function CloneDetectorDNA({ data }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const [activeClone, setActiveClone] = useState(0);
    const [showRejection, setShowRejection] = useState(false);

    useEffect(() => {
        // Check for organ rejection
        setShowRejection(data?.clones?.some(c => c.divergenceRisk === 'high') ?? false);
    }, [data]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data?.clones?.length) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const clones = data.clones.slice(0, 6);
        const activeRisk = clones[activeClone]?.divergenceRisk || 'low';
        const highlightColor = RISK_COLORS[activeRisk] || '#00e5ff';
        const activeCount = clones[activeClone]?.count || 1;

        let t = 0;

        // Base letters for highlighted rungs
        const BASES = ['A', 'T', 'G', 'C'];

        function draw() {
            ctx.clearRect(0, 0, w, h);

            const PERIOD = 80;
            const AMP = 30;
            const RUNGS = Math.floor(w / 16);

            // Draw two strands
            for (let strand = 0; strand < 2; strand++) {
                const phase = strand === 0 ? 0 : Math.PI;
                ctx.beginPath();
                for (let x = 0; x <= w; x += 2) {
                    const y = h / 2 + Math.sin((x / PERIOD) * Math.PI * 2 + phase + t) * AMP;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = 'rgba(0,229,255,0.22)';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 4;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Rungs — highlight active clone rungs with pulse
            const highlightInterval = Math.max(1, Math.floor(RUNGS / Math.min(activeCount, RUNGS)));

            for (let r = 0; r < RUNGS; r++) {
                const x = (r / RUNGS) * w + (t * 15 % (w / RUNGS));
                const y1 = h / 2 + Math.sin((x / PERIOD) * Math.PI * 2 + t) * AMP;
                const y2 = h / 2 + Math.sin((x / PERIOD) * Math.PI * 2 + Math.PI + t) * AMP;

                const isHighlighted = r % highlightInterval === 0;
                const pulseAlpha = isHighlighted ? 0.6 + Math.sin(t * 3 + r * 0.4) * 0.4 : 1;

                if (isHighlighted) {
                    ctx.beginPath();
                    ctx.moveTo(x, y1);
                    ctx.lineTo(x, y2);
                    ctx.strokeStyle = highlightColor;
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = highlightColor;
                    ctx.shadowBlur = 10;
                    ctx.globalAlpha = pulseAlpha;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;

                    // Base letter at rung center
                    const midY = (y1 + y2) / 2;
                    const letter = BASES[r % BASES.length];
                    ctx.fillStyle = `${highlightColor}60`;
                    ctx.font = `bold 7px monospace`;
                    ctx.textAlign = 'center';
                    ctx.fillText(letter, x, midY + 3);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(x, y1);
                    ctx.lineTo(x, y2);
                    ctx.strokeStyle = 'rgba(0,229,255,0.05)';
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 1;
                    ctx.stroke();
                }
            }

            t += 0.016;
            animRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [data, activeClone]);

    if (!data?.clones?.length) return null;

    const selected = data.clones[activeClone];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Clone Detector — DNA Match</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-800/30">{data.clones.length} duplicate pattern{data.clones.length > 1 ? 's' : ''}</span>
            </div>

            {/* Organ rejection banner */}
            <AnimatePresence>
                {showRejection && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{
                            background: 'rgba(251,113,133,0.06)',
                            border: '1px solid rgba(251,113,133,0.18)',
                        }}>
                            <span className="text-rose-400/70 text-sm mt-0.5">⚠</span>
                            <p className="text-[11px] font-mono text-rose-400/60 leading-relaxed">
                                <strong>Organ rejection detected.</strong> This body is fighting itself. Duplicated logic has diverged enough that a fix in one copy no longer propagates to the others.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <canvas
                ref={canvasRef}
                className="w-full rounded-lg mb-4"
                style={{ background: 'rgba(0,0,0,0.35)', height: 140 }}
            />

            {/* Active clone detail */}
            {selected && (
                <div className="mb-4 px-4 py-3 rounded-xl" style={{
                    background: `${RISK_COLORS[selected.divergenceRisk]}08`,
                    border: `1px solid ${RISK_COLORS[selected.divergenceRisk]}18`,
                }}>
                    <p className="text-[11px] font-mono leading-relaxed" style={{ color: `${RISK_COLORS[selected.divergenceRisk]}70` }}>
                        {selected.finding || `This pattern exists in ${selected.count} different files. They have diverged enough that fixing a bug in one no longer fixes it in the others. You have ${selected.count} versions of the same organ and they are no longer compatible.`}
                    </p>
                </div>
            )}

            {/* Clone list */}
            <div className="space-y-2 max-h-52 overflow-y-auto">
                {data.clones.slice(0, 6).map((clone, i) => {
                    const riskColor = RISK_COLORS[clone.divergenceRisk];
                    return (
                        <button
                            key={i}
                            onClick={() => setActiveClone(i)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${activeClone === i ? 'bg-violet-500/5 border-violet-500/20' : 'bg-black/10 border-cyan-900/10 hover:border-cyan-900/20'}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <code className="text-xs font-mono text-cyan-300/80">{clone.baseName}.*</code>
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${riskColor}15`, color: riskColor }}>
                                            {clone.divergenceRisk.toUpperCase()} RISK
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {clone.locations.slice(0, 3).map((loc, j) => (
                                            <span key={j} className="text-[9px] font-mono text-cyan-800/30 truncate max-w-[150px]">{loc}</span>
                                        ))}
                                        {clone.locations.length > 3 && <span className="text-[9px] font-mono text-cyan-900/20">+{clone.locations.length - 3} more</span>}
                                    </div>
                                </div>
                                <span className="text-lg font-black shrink-0" style={{ color: riskColor }}>{clone.count}×</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {data.finding && (
                <p className="text-xs text-cyan-800/40 mt-3 leading-relaxed italic border-t border-cyan-900/10 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
