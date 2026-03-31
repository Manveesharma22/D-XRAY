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
                ctx.stroke();
                // Simpler glow: draw a second, fainter line if high risk
                if (activeRisk === 'high') {
                    ctx.strokeStyle = 'rgba(0,229,255,0.05)';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
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
                    ctx.globalAlpha = pulseAlpha;
                    ctx.stroke();

                    // Simple glow fallback (no shadowBlur)
                    ctx.strokeStyle = `${highlightColor}33`;
                    ctx.lineWidth = 5;
                    ctx.stroke();
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
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-600 shadow-[0_0_15px_#8b5cf6] animate-pulse" />
                    <span className="text-[10px] font-technical text-cyan-400/70 tracking-[0.5em] uppercase font-bold">Genomic_Pattern_Sequencer</span>
                </div>
                <span className="text-[10px] font-technical text-cyan-400/60 uppercase tracking-[0.3em] font-bold">
                    {data.clones.length}_Duplicate_Sequences
                </span>
            </div>

            {/* Organ rejection banner */}
            <AnimatePresence>
                {showRejection && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="flex items-start gap-5 px-8 py-7 rounded-3xl relative z-10" style={{
                            background: 'rgba(251,113,133,0.12)',
                            border: '1px solid rgba(251,113,133,0.3)',
                            borderLeft: '8px solid #fb7185',
                            boxShadow: '0 0 50px rgba(251,113,133,0.1)',
                        }}>
                            <div className="w-full">
                                <div className="text-[12px] font-technical text-rose-400 font-bold uppercase tracking-[0.5em] mb-3">CRITICAL_ORGAN_REJECTION</div>
                                <p className="text-[18px] leading-tight font-technical font-bold tracking-tight text-white/90">
                                    PATHOLOGY// <span className="text-rose-200">THIS_BODY_IS_FIGHTING_ITSELF. DUPLICATED_LOGIC_HAS_DIVERGED_ENOUGH_THAT_A_FIX_IN_ONE_COPY_NO_LONGER_PROPAGATES.</span>
                                </p>
                            </div>
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
            <div className="mb-8 px-8 py-6 rounded-3xl relative z-10" style={{
                background: 'rgba(0,15,30,0.8)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderLeft: `8px solid ${RISK_COLORS[selected.divergenceRisk]}`,
                boxShadow: `0 0 40px ${RISK_COLORS[selected.divergenceRisk]}15`
            }}>
                <p className="text-[16px] leading-snug font-technical font-bold tracking-tight text-white/90">
                    <span className="text-cyan-400/80 font-black mr-3 uppercase tracking-widest">SIGNAL//</span>
                    {selected.finding ? selected.finding.toUpperCase() : `ENCOUNTERED_PATTERN_IN_${selected.count}_NODES_DIFFERENTIATION_DETECTED`.toUpperCase()}
                </p>
            </div>

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
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {clone.locations.slice(0, 3).map((loc, j) => (
                                            <span key={j} className="text-[10px] font-mono text-cyan-400/50 truncate max-w-[150px]">{loc}</span>
                                        ))}
                                        {clone.locations.length > 3 && <span className="text-[10px] font-mono text-cyan-400/30">+{clone.locations.length - 3}_MORE</span>}
                                    </div>
                                </div>
                                <span className="text-lg font-black shrink-0" style={{ color: riskColor }}>{clone.count}×</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {data.finding && (
                <p className="text-sm text-cyan-400/60 mt-4 leading-relaxed font-technical italic border-t border-cyan-900/20 pt-4 bg-cyan-900/5 px-4 py-2 rounded-xl">
                    {data.finding}
                </p>
            )}
        </motion.div>
    );
}
