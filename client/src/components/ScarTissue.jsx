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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_15px_#e11d48] animate-pulse" />
                    <span className="text-[10px] font-technical text-cyan-400/70 tracking-[0.5em] uppercase font-bold">Deep_Pathology_Detector</span>
                </div>
                <div className="flex items-center gap-4">
                    <ScarRing score={Math.round(totalScarScore / topScars.length)} max={maxScarScore} />
                </div>
            </div>

            {/* Surgery notice for most scarred file */}
            {data.mostScared && data.mostScared.rewriteCount >= 3 && (
                <div className="mb-6 px-6 py-5 rounded-2xl relative z-10" style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderLeft: '6px solid #ef4444',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
                }}>
                    <div className="text-[10px] font-technical text-red-500 font-bold uppercase tracking-[0.4em] mb-2">CRITICAL_SURGERY_REQUIRED</div>
                    <p className="text-[14px] leading-relaxed font-technical tracking-tight" style={{ color: '#fecaca' }}>
                        <span className="text-white/20 font-bold mr-2">LOG//</span>
                        "{buildSurgeryNotice(data.mostScared).replace('.', '').toUpperCase()}"
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
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <code className="text-[11px] font-technical text-rose-400 font-bold tracking-tight uppercase">{shortPath}</code>
                                    <span className="text-[9px] font-technical text-white/20 uppercase tracking-widest">{scar.commitCount}_PULSES // {scar.authorCount}_SUBJECTS</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {scar.rewriteCount >= 5 && (
                                        <span className="text-[8px] font-technical text-red-500 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 uppercase tracking-widest">
                                            {scar.rewriteCount}x_RECONSTRUCTED
                                        </span>
                                    )}
                                    <span className="text-lg font-bold font-technical text-rose-500 holographic-bloom">{scar.scarScore}</span>
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
                                    filter: density > 0.7 ? `drop-shadow(0 0 5px rgba(180,30,30,${density * 0.3}))` : 'none',
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
                                        <div className="px-3 py-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                                            <p className="text-sm font-mono text-rose-400/40 leading-relaxed italic">
                                                {buildSurgeryNotice(scar)}
                                            </p>
                                            <div className="flex gap-4 mt-3 text-xs font-mono text-rose-900/40">
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

            <p className="text-xs text-cyan-400/35 mb-2">Click a scar to see the full surgical report</p>

            {data.finding && (
                <p className="text-sm text-cyan-400/60 leading-relaxed italic border-t border-cyan-900/10 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
