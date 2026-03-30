import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Small metric ring gauge
function MetricRing({ label, value, status }) {
    const r = 22, cx = 26, cy = 26, circumf = 2 * Math.PI * r;
    const pct = typeof value === 'number' ? Math.min(100, value) : 0;
    const dashLen = (pct / 100) * circumf;
    const color = status === 'healthy' || status === 'fast' ? '#34d399'
        : status === 'critical' || status === 'compromised' ? '#ef4444'
            : '#f59e0b';
    const displayVal = typeof value === 'number' ? (value > 10 ? `${value}d` : `${value}x`) : value;

    return (
        <div className="flex flex-col items-center gap-1">
            <div style={{ position: 'relative', width: 52, height: 52 }}>
                <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <motion.circle
                        cx={cx} cy={cy} r={r} fill="none"
                        stroke={color} strokeWidth="3" strokeLinecap="round"
                        style={{ strokeDasharray: circumf }}
                        initial={{ strokeDashoffset: circumf }}
                        animate={{ strokeDashoffset: circumf - dashLen }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color,
                }}>
                    {displayVal}
                </div>
            </div>
            <div className="text-[8px] font-mono text-center leading-tight" style={{ color: `${color}60`, maxWidth: 52 }}>{label}</div>
        </div>
    );
}

export default function ImmuneSystem({ data }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

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

        let isVisible = true;
        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        }, { threshold: 0.1 });
        observer.observe(canvas);

        const speed = data.whiteCellSpeed;
        const cellCount = speed === 'fast' ? 22 : speed === 'moderate' ? 12 : speed === 'slow' ? 6 : 2;
        const baseSpeed = speed === 'fast' ? 1.6 : speed === 'moderate' ? 0.85 : speed === 'slow' ? 0.38 : 0.12;

        // Immune color palette
        const immuneColor = (data.immuneScore || 50) >= 70
            ? [0, 229, 100]      // healthy: blue-green
            : (data.immuneScore || 50) >= 40
                ? [245, 158, 11]  // moderate: amber
                : [239, 68, 68];  // critical: red

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
                glow: speed === 'fast' ? 10 : speed === 'moderate' ? 6 : 4,
                // Stopped cells for compromised state
                stopped: speed === 'stopped' || (speed === 'slow' && Math.random() < 0.3),
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
                if (cell.stopped) {
                    ctx.fillStyle = 'rgba(180,180,180,0.35)';
                    ctx.fill();
                } else {
                    // Multi-pass glow
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, cell.size + 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${immuneColor.join(',')}, 0.4)`;
                    ctx.fill();
                    ctx.restore();

                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, cell.size, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,255,0.95)';
                    ctx.fill();
                }
            });

            frame++;
            if (isVisible) animRef.current = requestAnimationFrame(draw);
            else animRef.current = setTimeout(() => { if (isVisible) draw(); }, 1000);
        }

        draw();
        return () => {
            cancelAnimationFrame(animRef.current);
            observer.disconnect();
        };
    }, [data]);

    if (!data) return null;

    const immuneScore = data.immuneScore ?? 50;
    const immuneColor = immuneScore >= 70 ? 'text-emerald-400' : immuneScore >= 40 ? 'text-amber-400' : 'text-red-400';
    const immuneLabel = immuneScore >= 70 ? 'HEALTHY' : immuneScore >= 40 ? 'MODERATE' : 'COMPROMISED';

    // Build one-sentence verdict
    function buildVerdict() {
        if (data.verdict) return data.verdict;
        const label = immuneScore >= 70 ? 'a healthy' : immuneScore >= 40 ? 'a moderately compromised' : 'a compromised';
        const vulnMetric = data.metrics?.find(m => m.label?.toLowerCase().includes('vuln') || m.label?.toLowerCase().includes('patch'));
        if (vulnMetric && immuneScore < 50) {
            const days = vulnMetric.avgDays || 47;
            const count = vulnMetric.count || 3;
            return `This codebase has ${label} immune system. It has ignored ${count} known vulnerabilities for an average of ${days} days each.`;
        }
        return `This codebase has ${label} immune system. Response time to threats is ${data.whiteCellSpeed || 'slow'}.`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Immune System</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold ${immuneColor}`}>{immuneLabel}</span>
                    <span className={`text-2xl font-black font-mono ${immuneColor}`}>{immuneScore}</span>
                </div>
            </div>

            {/* One-sentence verdict — the clinical summary */}
            <div className="mb-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${immuneScore >= 70 ? 'rgba(52,211,153,0.3)' : immuneScore >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                <p className="text-xs leading-relaxed italic" style={{ color: immuneScore < 50 ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.5)' }}>
                    {buildVerdict()}
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
                        <MetricRing key={i} label={m.label} value={m.numericValue ?? i * 20 + 20} status={m.status} />
                    ))}
                </div>
            )}

            {data.finding && (
                <p className="text-xs text-cyan-800/40 leading-relaxed italic border-t border-cyan-900/10 pt-3 mt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
