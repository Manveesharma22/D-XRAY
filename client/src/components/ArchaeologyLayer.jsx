import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ArchaeologyLayer({ data }) {
    const [sliderVal, setSliderVal] = useState(30); // 0=show original, 100=show current

    if (!data) return null;

    const driftPercent = data.driftScore || 0;
    const sharedPct = data.sharedPercentage ?? 100 - driftPercent;
    const rewriteCount = data.rewriteCount || 0;

    // Opacity blending
    const origOpacity = Math.max(0.06, (100 - sliderVal) / 100);
    const currOpacity = Math.max(0.12, sliderVal / 100);
    // At midpoint (50), show a double-exposure ghost effect
    const atMidpoint = sliderVal >= 44 && sliderVal <= 56;

    // Drift annotations — which parts changed most
    const driftAnnotations = data.driftAnnotations || [];
    const hasCIRebuild = driftAnnotations.some(a => a.area === 'spine') || driftPercent > 60;
    const hasTestingShift = driftAnnotations.some(a => a.area === 'ribcage') || driftPercent > 40;

    // Rewrite timeline dots
    const rewriteDots = data.rewriteTimeline || (rewriteCount > 0
        ? Array.from({ length: Math.min(rewriteCount, 5) }, (_, i) => ({
            label: `Rewrite ${i + 1}`,
            pos: (i + 1) / (rewriteCount + 1),
        }))
        : []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#ffc400] animate-pulse" />
                    <span className="text-[11px] font-technical text-cyan-400/80 tracking-[0.4em] uppercase font-bold">Archaeology_Layer</span>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-amber-400 font-technical tracking-tighter">{sharedPct}%</div>
                    <div className="text-[10px] font-technical text-amber-400/70 tracking-[0.2em] uppercase font-bold">V1.0_ORIGINAL_CORE</div>
                </div>
            </div>

            {/* Dual skeleton visualization */}
            <div className="relative mb-2" style={{ height: 180 }}>
                <svg width="100%" height="180" viewBox="0 0 600 180" className="absolute inset-0">
                    <defs>
                        <filter id="ghostBlur">
                            <feGaussianBlur stdDeviation={atMidpoint ? "1.5" : "0"} />
                        </filter>
                    </defs>

                    {/* Ghost skeleton — original architecture */}
                    <g opacity={origOpacity} style={{ transition: 'opacity 0.25s ease' }} filter={atMidpoint ? "url(#ghostBlur)" : "none"}>
                        {/* Skull */}
                        <ellipse cx="300" cy="24" rx="42" ry="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                        <circle cx="284" cy="22" r="5" fill="none" stroke="#f59e0b" strokeWidth="1" />
                        <circle cx="316" cy="22" r="5" fill="none" stroke="#f59e0b" strokeWidth="1" />
                        <line x1="300" y1="44" x2="300" y2="50" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                        {/* Spine — original */}
                        {[52, 66, 78, 90, 102, 114, 126].map((y, i) => (
                            <rect key={i} x="291" y={y} width="18" height="9" rx="2.5" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
                        ))}
                        {/* Original ribs */}
                        {[58, 78, 98].map((y, i) => (
                            <g key={i}>
                                <path d={`M 300 ${y} Q 242 ${y + 14} 224 ${y + 8}`} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                                <path d={`M 300 ${y} Q 358 ${y + 14} 376 ${y + 8}`} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                            </g>
                        ))}
                        {/* Original arms */}
                        <line x1="258" y1="58" x2="180" y2="110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                        <line x1="342" y1="58" x2="420" y2="110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                        {/* Legs */}
                        <line x1="290" y1="140" x2="268" y2="168" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
                        <line x1="310" y1="140" x2="332" y2="168" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
                    </g>

                    {/* Current skeleton */}
                    <g opacity={currOpacity} style={{ transition: 'opacity 0.25s ease' }}>
                        {/* Skull */}
                        <ellipse cx="300" cy="24" rx="40" ry="18" fill="none" stroke="#00e5ff" strokeWidth="2" />
                        <circle cx="286" cy="22" r="5" fill="none" stroke="#00e5ff" strokeWidth="1.3" />
                        <circle cx="314" cy="22" r="5" fill="none" stroke="#00e5ff" strokeWidth="1.3" />
                        <line x1="300" y1="42" x2="300" y2="50" stroke="#00e5ff" strokeWidth="2" />
                        {/* Spine — current (may differ) */}
                        {[52, 65, 77, 89, 101, 113, 125].map((y, i) => (
                            <rect key={i} x="292" y={y} width="16" height="8" rx="2" fill="rgba(0,229,255,0.05)" stroke="#00e5ff" strokeWidth="1.5" />
                        ))}
                        {/* Current ribs — extended */}
                        {[55, 74, 93].map((y, i) => (
                            <g key={i}>
                                <path d={`M 300 ${y} Q 238 ${y + 18} 218 ${y + 10}`} fill="none" stroke="#00e5ff" strokeWidth="1.5" />
                                <path d={`M 300 ${y} Q 362 ${y + 18} 382 ${y + 10}`} fill="none" stroke="#00e5ff" strokeWidth="1.5" />
                            </g>
                        ))}
                        {/* Current arms */}
                        <line x1="261" y1="56" x2="178" y2="112" stroke="#00e5ff" strokeWidth="2" />
                        <line x1="339" y1="56" x2="422" y2="112" stroke="#00e5ff" strokeWidth="2" />
                        {/* Pelvis */}
                        <ellipse cx="300" cy="138" rx="32" ry="13" fill="none" stroke="#00e5ff" strokeWidth="1.5" />
                        {/* Legs */}
                        <line x1="286" y1="151" x2="265" y2="170" stroke="#00e5ff" strokeWidth="2" />
                        <line x1="314" y1="151" x2="335" y2="170" stroke="#00e5ff" strokeWidth="2" />
                    </g>

                    {/* Drift annotations — labeled overlays */}
                    {hasCIRebuild && (
                        <g opacity={Math.max(0.15, origOpacity)}>
                            <line x1="220" y1="80" x2="170" y2="60" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                            <rect x="140" y="52" width="60" height="16" rx="3" fill="rgba(245,158,11,0.08)" />
                            <text x="170" y="63" fontSize="9" fill="rgba(245,158,11,0.5)" textAnchor="middle">Spine rebuilt</text>
                        </g>
                    )}
                    {hasTestingShift && (
                        <g opacity={Math.max(0.15, origOpacity)}>
                            <line x1="220" y1="90" x2="175" y2="100" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" />
                            <rect x="140" y="92" width="70" height="16" rx="3" fill="rgba(245,158,11,0.08)" />
                            <text x="175" y="103" fontSize="9" fill="rgba(245,158,11,0.45)" textAnchor="middle">Test philosophy</text>
                        </g>
                    )}

                    {/* Legend */}
                    <g>
                        <line x1="10" y1="12" x2="40" y2="12" stroke="#ffc400" strokeWidth="1.5" strokeDasharray="5 3" opacity={origOpacity + 0.1} />
                        <text x="44" y="16" fontSize="9" fill="rgba(255, 196, 0, 0.4)" className="font-technical">v1.0 Base_Original</text>
                        <line x1="10" y1="24" x2="40" y2="24" stroke="#00fbff" strokeWidth="1.5" opacity={currOpacity + 0.1} />
                        <text x="44" y="28" fontSize="9" fill="rgba(0, 251, 255, 0.4)" className="font-technical">Current_Drift</text>
                    </g>
                </svg>
            </div>

            {/* Film-strip slider */}
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[10px] font-technical uppercase tracking-[0.2em]">
                    <span className="text-amber-400/70 font-bold">v1.0 — ORIGIN</span>
                    {atMidpoint && <span className="text-white/60 text-[9px] animate-pulse font-bold">Holographic_Fusion</span>}
                    <span className="text-cyan-400/70 font-bold">PRESENT — DRIFT</span>
                </div>
                <div className="relative">
                    {/* Film strip track */}
                    <div className="w-full h-4 rounded-full overflow-hidden flex" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Film perforations */}
                        {Array.from({ length: 14 }).map((_, i) => (
                            <div key={i} className="flex-1 flex items-center justify-center">
                                <div className="w-1.5 h-2 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            </div>
                        ))}
                    </div>
                    <input
                        type="range" min="5" max="95" value={sliderVal}
                        onChange={e => setSliderVal(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ zIndex: 10 }}
                    />
                    {/* Thumb */}
                    <div
                        className="absolute top-0 bottom-0 w-1 rounded-full pointer-events-none"
                        style={{
                            left: `${sliderVal}%`,
                            transform: 'translateX(-50%)',
                            background: `linear-gradient(to bottom, #f59e0b, #00e5ff)`,
                            boxShadow: '0 0 8px rgba(245,158,11,0.3)',
                        }}
                    />
                </div>
                <p className="text-[11px] font-technical text-cyan-400/50 text-center uppercase tracking-wider font-bold">Drag to morph between original and current skeleton</p>
            </div>

            {/* Rewrite timeline */}
            {rewriteDots.length > 0 && (
                <div className="mb-4">
                    <div className="text-[10px] font-technical text-amber-400/60 uppercase mb-2 font-bold tracking-wider">Estimated rewrites</div>
                    <div className="relative h-3">
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                            <div className="w-full h-0.5 bg-amber-400/10" />
                        </div>
                        {rewriteDots.map((rw, i) => (
                            <div
                                key={i}
                                title={rw.label}
                                className="absolute w-2 h-2 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2"
                                style={{
                                    left: `${(rw.pos || (i + 1) / (rewriteDots.length + 1)) * 100}%`,
                                    background: `rgba(245,158,11,${0.3 + (i / rewriteDots.length) * 0.5})`,
                                    border: '1px solid rgba(245,158,11,0.3)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-3 rounded-2xl bg-black/40 border border-white/5 shadow-[inset_0_0_20px_rgba(255,196,0,0.03)]">
                    <div className="text-[10px] font-technical text-amber-400/70 uppercase tracking-widest font-bold">Architecture_Drift</div>
                    <div className="text-xl font-bold text-amber-400 font-technical">{driftPercent}%</div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-black/40 border border-white/5 shadow-[inset_0_0_20px_rgba(255,68,68,0.03)]">
                    <div className="text-[10px] font-technical text-red-400/70 uppercase tracking-widest font-bold">Extinct_Paths</div>
                    <div className="text-xl font-bold text-red-400 font-technical">{data.extinctPaths?.length || 0}</div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-black/40 border border-white/5 shadow-[inset_0_0_20px_rgba(0,251,255,0.03)]">
                    <div className="text-[10px] font-technical text-cyan-400/70 uppercase tracking-widest font-bold">Rewrites_Est</div>
                    <div className="text-xl font-bold text-cyan-400 font-technical">{rewriteCount}</div>
                </div>
            </div>

            {data.extinctPaths?.length > 0 && (
                <div className="mb-3">
                    <div className="text-[10px] font-technical text-amber-400/60 uppercase mb-1.5 font-bold tracking-wider">Extinct architecture</div>
                    <div className="flex flex-wrap gap-1.5">
                        {data.extinctPaths.slice(0, 6).map((p, i) => (
                            <span key={i} className="text-xs font-mono text-amber-400/60 bg-amber-500/8 border border-amber-500/15 px-2 py-0.5 rounded">
                                /{p}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {data.finding && (
                <p className="text-sm text-cyan-400/60 leading-relaxed font-technical italic border-t border-cyan-900/15 pt-3">{data.finding}</p>
            )}
        </motion.div>
    );
}
