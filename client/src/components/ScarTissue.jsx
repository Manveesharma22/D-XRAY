import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Scar score ring gauge
function ScarRing({ score, max }) {
    const r = 26, cx = 30, cy = 30, circumf = 2 * Math.PI * r;
    const pct = Math.min(100, Math.round((score / Math.max(max, 1)) * 100));
    const dashLen = (pct / 100) * circumf;
    const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#94a3b8';

    return (
        <div style={{ position: 'relative', width: 60, height: 60 }}>
            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(239,68,68,0.06)" strokeWidth="4" />
                <motion.circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke={color} strokeWidth="4" strokeLinecap="round"
                    style={{ strokeDasharray: circumf }}
                    initial={{ strokeDashoffset: circumf }}
                    animate={{ strokeDashoffset: circumf - dashLen }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, fontFamily: 'monospace', color,
            }}>
                {score}
            </div>
        </div>
    );
}

export default function ScarTissue({ data }) {
    const [expandedScar, setExpandedScar] = useState(null);

    if (!data?.scars?.length) return null;

    const topScars = data.scars.slice(0, 6);
    const maxScarScore = Math.max(...topScars.map(s => s.scarScore), 1);
    const totalScarScore = topScars.reduce((s, x) => s + x.scarScore, 0);

    // Build surgery notice
    function buildSurgeryNotice(scar) {
        if (scar.finding) return scar.finding;
        const path = scar.path.split('/').slice(-2).join('/');
        const rwCount = scar.rewriteCount || 0;
        const years = scar.ageYears || '?';
        return `${path} has been rewritten ${rwCount} time${rwCount !== 1 ? 's' : ''} in ${years} year${years !== 1 ? 's' : ''}. It is scar tissue. Every new feature that touches it causes a regression. The team knows this. Nobody has scheduled the surgery.`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-800 animate-pulse" />
                    <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">Scar Tissue Detector</span>
                </div>
                <div className="flex items-center gap-3">
                    <ScarRing score={Math.round(totalScarScore / topScars.length)} max={maxScarScore} />
                </div>
            </div>

            {/* Surgery notice for most scarred file */}
            {data.mostScared && data.mostScared.rewriteCount >= 3 && (
                <div className="mb-4 px-4 py-3 rounded-xl" style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.12)',
                    borderLeft: '3px solid rgba(239,68,68,0.35)',
                }}>
                    <div className="text-[8px] font-mono text-red-400/40 uppercase tracking-widest mb-1.5">Surgery Required</div>
                    <p className="text-xs leading-relaxed italic" style={{ color: 'rgba(252,165,165,0.6)' }}>
                        "{buildSurgeryNotice(data.mostScared)}"
                    </p>
                </div>
            )}

            {/* Bone-shaped scar bars */}
            <div className="mb-4 space-y-3">
                {topScars.map((scar, i) => {
                    const density = scar.scarDensity ?? (scar.scarScore / maxScarScore);
                    const shortPath = scar.path.split('/').slice(-2).join('/');
                    const boneOpacity = 0.35 + density * 0.65;
                    const boneH = Math.round(6 + density * 14); // 6px to 20px
                    const r = 200 - Math.round(density * 110);
                    const g = 30 + Math.round(density * 15);
                    const isExpanded = expandedScar === i;

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="cursor-pointer"
                            onClick={() => setExpandedScar(isExpanded ? null : i)}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <code className="text-[10px] font-mono text-rose-300/60">{shortPath}</code>
                                    <span className="text-[8px] font-mono text-rose-900/40">{scar.commitCount} commits · {scar.authorCount} authors</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {scar.rewriteCount >= 5 && (
                                        <span className="text-[8px] font-mono text-red-400/50 px-1.5 py-0.5 rounded bg-red-500/5 border border-red-500/10">
                                            {scar.rewriteCount}× rewritten
                                        </span>
                                    )}
                                    <span className="text-[10px] font-mono font-bold text-rose-400/60">{scar.scarScore}</span>
                                </div>
                            </div>

                            {/* Bone cross-section bar — rounded ends, 3D feel */}
                            <div className="relative w-full" style={{ height: boneH }}>
                                {/* Bone end cap left */}
                                <div className="absolute left-0 top-0 bottom-0 rounded-l-full" style={{
                                    width: boneH * 1.2,
                                    background: `rgba(${r},${g},30,${boneOpacity + 0.1})`,
                                }} />
                                {/* Bone body */}
                                <div className="absolute inset-0 rounded-sm" style={{
                                    marginLeft: boneH * 0.5,
                                    marginRight: boneH * 0.5,
                                    background: `rgba(${r},${g},30,${boneOpacity})`,
                                    boxShadow: density > 0.7 ? `0 0 ${Math.round(density * 14)}px rgba(180,30,30,${density * 0.4})` : 'none',
                                }} />
                                {/* Bone end cap right */}
                                <div className="absolute right-0 top-0 bottom-0 rounded-r-full" style={{
                                    width: boneH * 1.2,
                                    background: `rgba(${r},${g},30,${boneOpacity + 0.1})`,
                                }} />
                                {/* Shading highlight */}
                                <div className="absolute inset-x-0 top-0 rounded-sm" style={{
                                    height: Math.max(1, Math.round(boneH * 0.3)),
                                    background: `rgba(255,255,255,0.05)`,
                                }} />
                            </div>

                            {/* Expanded scar report */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mt-2"
                                    >
                                        <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                                            <p className="text-[9px] font-mono text-rose-400/40 leading-relaxed italic">
                                                {buildSurgeryNotice(scar)}
                                            </p>
                                            <div className="flex gap-4 mt-2 text-[8px] font-mono text-rose-900/40">
                                                {scar.ageYears && <span>Age: {scar.ageYears}y</span>}
                                                {scar.rewriteCount && <span>Rewrites: {scar.rewriteCount}</span>}
                                                {scar.topContributor && <span>Most responsible: {scar.topContributor}</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <p className="text-[9px] font-mono text-cyan-900/20 mb-2">Click a scar to see the full surgical report</p>

            {data.finding && (
                <p className="text-xs text-cyan-800/40 leading-relaxed italic border-t border-cyan-900/10 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
