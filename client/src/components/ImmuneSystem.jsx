import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Small metric ring gauge
function MetricRing({ label, value, displayValue, status }) {
    const r = 30, cx = 36, cy = 36, circumf = 2 * Math.PI * r;
    const pct = typeof value === 'number' ? Math.min(100, value) : 0;
    const dashLen = (pct / 100) * circumf;
    const color = status === 'healthy' || status === 'fast' ? '#00fbff'
        : status === 'critical' || status === 'compromised' ? '#ff4444'
            : '#ffc400';

    return (
        <div className="flex flex-col items-center gap-2">
            <div style={{ position: 'relative', width: 72, height: 72 }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                    <motion.circle
                        cx={cx} cy={cy} r={r} fill="none"
                        stroke={color} strokeWidth="4" strokeLinecap="round"
                        style={{ strokeDasharray: circumf }}
                        initial={{ strokeDashoffset: circumf }}
                        animate={{ strokeDashoffset: circumf - dashLen }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: displayValue?.length > 10 ? 8 : 10,
                    fontWeight: 900, fontFamily: 'monospace', color,
                    textAlign: 'center', padding: '0 8px',
                    textShadow: `0 0 10px ${color}40`,
                    lineHeight: 1.1
                }}>
                    {displayValue.split(' ').map((word, i) => (
                        <div key={i}>{word.toUpperCase()}</div>
                    ))}
                </div>
            </div>
            <div className="text-[9px] font-mono font-bold tracking-widest text-center leading-tight uppercase opacity-40 px-1" style={{ color }}>{label}</div>
        </div>
    );
}

export default function ImmuneSystem({ data, isHealed }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    const effectiveScore = isHealed ? 98 : (data?.immuneScore ?? 50);
    const effectiveSpeed = isHealed ? 'moderate' : (data?.whiteCellSpeed || 'slow');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        let isVisible = false;
        const observer = new IntersectionObserver(([entry]) => {
            const wasVisible = isVisible;
            isVisible = entry.isIntersecting;
            if (isVisible && !wasVisible) {
                draw(); // Restart loop when becoming visible
            }
        }, { threshold: 0.1 });
        observer.observe(canvas);

        // Immune color palette
        const immuneColor = effectiveScore >= 70
            ? [0, 251, 255]      // supernova cyan
            : effectiveScore >= 40
                ? [255, 196, 0]  // electric amber
                : [255, 68, 68];  // vibrant red

        const cellCount = isHealed ? 20 : (effectiveSpeed === 'fast' ? 22 : effectiveSpeed === 'moderate' ? 12 : effectiveSpeed === 'slow' ? 6 : 2);
        const baseSpeed = isHealed ? 0.6 : (effectiveSpeed === 'fast' ? 1.6 : effectiveSpeed === 'moderate' ? 0.85 : effectiveSpeed === 'slow' ? 0.38 : 0.12);

        // Branching vein paths (Y-junctions)
        const veins = [
            { points: [[0.02, 0.5], [0.2, 0.3], [0.45, 0.45], [0.72, 0.32], [0.95, 0.48]] },
            { points: [[0.02, 0.3], [0.28, 0.48], [0.52, 0.22], [0.78, 0.52], [0.95, 0.3]] },
            { points: [[0.08, 0.72], [0.32, 0.58], [0.58, 0.68], [0.82, 0.62], [0.95, 0.7]] },
            // Branch from vein 1 midpoint
            { points: [[0.45, 0.45], [0.52, 0.62], [0.6, 0.72], [0.78, 0.78]] },
        ];

        const cells = [];
        for (let i = 0; i < cellCount; i++) {
            const veinIdx = i % veins.length;
            cells.push({
                veinIdx,
                t: Math.random(),
                speed: baseSpeed * (0.6 + Math.random() * 0.8),
                size: 3.5 + Math.random() * 2.5,
                glow: effectiveSpeed === 'fast' ? 10 : effectiveSpeed === 'moderate' ? 6 : 4,
                // Stopped cells for compromised state
                stopped: effectiveSpeed === 'stopped' || (effectiveSpeed === 'slow' && Math.random() < 0.3),
                stopPoint: Math.random(),
            });
        }

        function getBezierPoint(points, t) {
            const n = points.length - 1;
            let x = 0, y = 0;
            for (let i = 0; i <= n; i++) {
                const b = binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
                x += b * points[i][0] * w;
                y += b * points[i][1] * h;
            }
            return { x, y };
        }

        function binomial(n, k) {
            if (k === 0 || k === n) return 1;
            let res = 1;
            for (let i = 0; i < k; i++) res = res * (n - i) / (i + 1);
            return res;
        }

        let frame = 0;

        function draw() {
            if (!isVisible) return;
            ctx.clearRect(0, 0, w, h);

            // Background immune wash — subtle color based on health
            const bgAlpha = 0.04;
            ctx.fillStyle = `rgba(${immuneColor.join(',')}, ${bgAlpha})`;
            ctx.fillRect(0, 0, w, h);

            // Draw veins — branching tubes
            veins.forEach((vein, vi) => {
                const isBranch = vi === 3;
                ctx.beginPath();
                const start = getBezierPoint(vein.points, 0);
                ctx.moveTo(start.x, start.y);
                for (let t = 0.02; t <= 1; t += 0.02) {
                    const pt = getBezierPoint(vein.points, t);
                    ctx.lineTo(pt.x, pt.y);
                }
                // Vein wall — outer glow
                ctx.strokeStyle = `rgba(${immuneColor.join(',')}, 0.06)`;
                ctx.lineWidth = isBranch ? 7 : 9;
                ctx.stroke();
                // Vein core
                ctx.strokeStyle = `rgba(${immuneColor.join(',')}, 0.04)`;
                ctx.lineWidth = isBranch ? 4 : 6;
                ctx.stroke();
            });

            // Subtle pulse animation on veins
            const pulsePct = (Math.sin(frame * 0.04) * 0.5 + 0.5);
            veins.forEach(vein => {
                const pt = getBezierPoint(vein.points, pulsePct);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${immuneColor.join(',')}, 0.15)`;
                ctx.fill();
            });

            // White blood cells
            cells.forEach(cell => {
                if (!cell.stopped) {
                    cell.t = (cell.t + cell.speed / (w * 0.45)) % 1;
                } else {
                    // Dim stopped cells pulsing faintly
                    cell.size = 3 + Math.sin(frame * 0.05) * 0.5;
                }
                const vein = veins[cell.veinIdx];
                const t = cell.stopped ? cell.stopPoint : cell.t;
                const pt = getBezierPoint(vein.points, t);

                ctx.beginPath();
                ctx.arc(pt.x, pt.y, cell.size, 0, Math.PI * 2);
                if (cell.stopped && !isHealed) {
                    ctx.fillStyle = 'rgba(180,180,180,0.45)';
                    ctx.fill();
                } else {
                    // Multi-pass glow — clinical bloom
                    ctx.save();
                    const glowGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, cell.size + 4);
                    glowGrad.addColorStop(0, isHealed ? 'rgba(52,211,153,0.4)' : `rgba(${immuneColor.join(',')}, 0.5)`);
                    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = glowGrad;
                    ctx.fillRect(pt.x - 10, pt.y - 10, 20, 20);
                    ctx.restore();

                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, cell.size, 0, Math.PI * 2);
                    ctx.fillStyle = isHealed ? '#ecfdf5' : '#ffffff';
                    ctx.fill();
                }
            });

            frame++;
            animRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => {
            cancelAnimationFrame(animRef.current);
            observer.disconnect();
        };
    }, [data]);

    if (!data) return null;

    const immuneColor = effectiveScore >= 70 ? 'text-cyan-400' : effectiveScore >= 40 ? 'text-amber-400' : 'text-red-400';
    const immuneLabel = effectiveScore >= 70 ? 'HEALTHY' : effectiveScore >= 40 ? 'MODERATE' : 'COMPROMISED';

    // Build one-sentence verdict
    function buildVerdict() {
        if (isHealed) return "Clinical context has been provided. The repository's immune response has been successfully reconciled.";
        if (data.verdict) return data.verdict;
        const label = effectiveScore >= 70 ? 'a healthy' : effectiveScore >= 40 ? 'a moderately compromised' : 'a compromised';
        const vulnMetric = data.metrics?.find(m => m.label?.toLowerCase().includes('vuln') || m.label?.toLowerCase().includes('patch'));
        if (vulnMetric && effectiveScore < 50) {
            const days = vulnMetric.avgDays || 47;
            const count = vulnMetric.count || 3;
            return `This codebase has ${label} immune system. It has ignored ${count} known vulnerabilities for an average of ${days} days each.`;
        }
        return `This codebase has ${label} immune system. Response time to threats is ${effectiveSpeed}.`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_15px_white] animate-pulse ${effectiveScore >= 70 ? 'bg-cyan-400' : effectiveScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                    <span className="text-[11px] font-technical text-cyan-400/60 tracking-[0.4em] uppercase font-bold">Biometric_Pathology_Core</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className={`text-[10px] font-technical font-bold tracking-[0.3em] uppercase ${immuneColor}`}>{immuneLabel}_RESPONSE</span>
                    <span className={`text-5xl font-black font-technical tracking-tighter holographic-bloom ${immuneColor}`}>{effectiveScore}</span>
                </div>
            </div>

            {/* Health Core Pulse — biological feel */}
            <div className="absolute top-10 right-4 w-48 h-48 pointer-events-none opacity-20">
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-full h-full rounded-full blur-3xl ${effectiveScore >= 70 ? 'bg-cyan-500' : effectiveScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                />
            </div>

            {/* One-sentence verdict — the clinical summary */}
            <div className="mb-8 px-6 py-6 rounded-2xl relative z-10" style={{ background: 'rgba(0,12,24,0.7)', border: '1px solid rgba(0,229,255,0.1)', borderLeft: `6px solid ${effectiveScore >= 70 ? '#00fbff' : effectiveScore >= 40 ? '#fbbf24' : '#ef4444'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,229,255,0.05)' }}>
                <p className="text-[15px] leading-relaxed font-technical tracking-tight" style={{ color: effectiveScore < 50 ? '#fecaca' : '#e2e8f0' }}>
                    <span className="text-cyan-400/40 font-black mr-3 tracking-widest">DIAGNOSIS //</span>
                    {buildVerdict().toUpperCase()}
                </p>
            </div>

            <canvas
                ref={canvasRef}
                className="w-full rounded-lg mb-4"
                style={{ background: 'rgba(0,0,0,0.35)', height: 110 }}
            />

            {/* Metric rings */}
            {data.metrics?.length > 0 && (
                <div className="flex justify-around gap-2">
                    {data.metrics.slice(0, 4).map((m, i) => (
                        <MetricRing
                            key={i}
                            label={m.label}
                            value={m.score ?? m.numericValue ?? i * 20 + 20}
                            displayValue={m.value}
                            status={m.status}
                        />
                    ))}
                </div>
            )}

            {data.finding && (
                <p className="text-sm text-cyan-400/60 leading-relaxed font-technical italic border-t border-cyan-900/15 pt-3 mt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
