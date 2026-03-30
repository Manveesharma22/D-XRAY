import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrognosisSimulator = ({ data, currentScore }) => {
    const [days, setDays] = useState(0);
    const [isActing, setIsActing] = useState(false);

    if (!data || !data.timeline) return null;

    const currentFrame = useMemo(() => {
        const frame = data.timeline.find(f => f.day >= days) || data.timeline[data.timeline.length - 1];
        return frame;
    }, [days, data.timeline]);

    // Interpolate health for visual effects
    const displayScore = isActing ? currentFrame.interventionScore : currentFrame.score;
    const severity = (100 - displayScore) / 100;

    return (
        <div className="glass-panel rounded-3xl p-8 border-cyan-500/10 overflow-hidden relative grayscale-[0.2]">
            <div className="absolute top-0 right-0 p-6 opacity-10">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20M5 12h14" /></svg>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-8">
                <div className="flex-1">
                    <div className="text-[10px] font-mono text-cyan-600/40 tracking-[0.3em] uppercase mb-2">Prognosis Engine v1.0</div>
                    <h2 className="text-3xl font-black text-white mb-4">Forward Simulation</h2>
                    <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                        Visualizing the next 90 days of this codebase. Every day without intervention increases technical debt compounding
                        and burnout risk. <span className="text-white/60">Drag the slider to see the drift.</span>
                    </p>
                </div>

                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl min-w-[200px] text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Remediation Cost</div>
                    <div className="text-5xl font-black text-white mb-1 group">
                        {currentFrame.costToFix}
                        <span className="text-xs text-slate-600 ml-1 font-mono uppercase">Days</span>
                    </div>
                    {days > 0 && (
                        <div className="text-[10px] font-mono text-red-500/60 animate-pulse">
                            +{Math.round((currentFrame.costToFix / data.timeline[0].costToFix - 1) * 100)}% Compounding
                        </div>
                    )}
                </div>
            </div>

            {/* Side-by-Side View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Panel 1: Today */}
                <div className="relative group">
                    <div className="text-center mb-4">
                        <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">ADMITTED_STATE</div>
                        <div className="text-xs text-white/40">Day 0 (Baseline)</div>
                    </div>
                    <div className="aspect-[4/5] bg-black/60 rounded-2xl border border-cyan-500/20 relative overflow-hidden flex items-center justify-center">
                        <XRayVisual score={currentScore} severity={0.2} />
                        <div className="absolute top-4 right-4 text-[40px] font-black text-cyan-500/20">{currentScore}</div>
                    </div>
                </div>

                {/* Panel 2: Simulation */}
                <div className="relative group">
                    <div className="text-center mb-4">
                        <div className={`text-[10px] font-mono uppercase tracking-widest ${isActing ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isActing ? 'OPTIMIZED_FUTURE' : 'SIMULATED_FUTURE'}
                        </div>
                        <div className="text-xs text-white/40">Day {days} (Prognosis)</div>
                    </div>
                    <div className={`aspect-[4/5] bg-black/60 rounded-2xl border relative overflow-hidden flex items-center justify-center transition-colors duration-500 ${isActing ? 'border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.05)]' : 'border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]'}`}>
                        <XRayVisual score={displayScore} severity={severity} isFuture={true} />
                        <div className={`absolute top-4 right-4 text-[40px] font-black opacity-20 ${isActing ? 'text-emerald-500' : 'text-red-500'}`}>{displayScore}</div>

                        {/* Critical Events */}
                        {days >= 67 && data.atRiskContributor && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute bottom-6 left-6 right-6 p-4 glass-panel border-red-500/20 rounded-xl"
                            >
                                <div className="text-red-400 text-[10px] font-mono uppercase mb-1">Critical Crisis Event: @{data.atRiskContributor.login}</div>
                                <div className="text-white font-bold text-sm tracking-tight leading-tight">Elevated Exit Risk: {data.atRiskContributor.impact}</div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slider Controls */}
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="relative">
                    <input
                        type="range"
                        min="0"
                        max="90"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500 tracking-tighter uppercase">
                        <span>Today</span>
                        <span>30 Days</span>
                        <span>60 Days</span>
                        <span>90 Days</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                    <button
                        onClick={() => setIsActing(!isActing)}
                        className={`px-8 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-500 border ${isActing ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-transparent border-white/10 text-white/40 hover:text-white hover:border-emerald-500/50'}`}
                    >
                        {isActing ? '✓ Acting on prescriptions' : 'Show me what changes if we act today'}
                    </button>

                    <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-600 uppercase mb-1">Simulation State</div>
                        <div className={`text-xs font-bold font-mono tracking-widest ${isActing ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {isActing ? 'CORRECTIVE_PATH_STABILIZED' : 'DEFAULT_TRAJECTORY_ACTIVE'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const XRayVisual = ({ score, severity, isFuture }) => {
    // A simplified visual for the demo that darkens as health drops
    const opacity = 0.1 + (isFuture ? severity * 0.4 : 0);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: `radial-gradient(circle at center, rgba(${isFuture && score < 40 ? '255,50,50' : '0,229,255'}, ${0.1 + severity}) 0%, transparent 70%)` }}
            />

            <svg width="200" height="300" viewBox="0 0 200 300" fill="none" className="z-10 transition-all duration-700">
                {/* Simplified Ribcage structure */}
                {[...Array(6)].map((_, i) => (
                    <motion.path
                        key={i}
                        d={`M 40 ${60 + i * 30} Q 100 ${50 + i * 35} 160 ${60 + i * 30}`}
                        stroke={isFuture && score < 50 ? 'rgba(255,100,100,0.5)' : 'rgba(255,255,255,0.4)'}
                        strokeWidth="4"
                        animate={{
                            strokeWidth: isFuture && score < 30 ? [2, 4, 3] : 2,
                            opacity: isFuture && score < 40 ? [0.4, 0.2, 0.4] : 0.4
                        }}
                    />
                ))}

                {/* Spine */}
                <rect x="98" y="40" width="4" height="220" fill="rgba(255,255,255,0.1)" />

                {/* Simulated Fractures appearing at low score */}
                {isFuture && score < 60 && (
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        d="M 120 80 L 140 100 L 130 110"
                        stroke="#ff0000"
                        strokeWidth="1.5"
                    />
                )}
                {isFuture && score < 40 && (
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        d="M 60 180 L 40 200 L 50 210"
                        stroke="#ff0000"
                        strokeWidth="1.5"
                    />
                )}
                {isFuture && score < 20 && (
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        d="M 100 140 L 110 160 L 90 170"
                        stroke="#ff0000"
                        strokeWidth="2"
                    />
                )}
            </svg>

            {/* EKG unstable on the right at low score */}
            {isFuture && (
                <div className="absolute bottom-10 left-0 right-0 h-10 opacity-30">
                    <svg width="100%" height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
                        <motion.path
                            d="M 0 20 L 50 20 L 55 10 L 65 30 L 70 20 L 150 20 L 155 5 L 165 35 L 170 20"
                            stroke={score < 40 ? "#ff4444" : "#00e5ff"}
                            strokeWidth="1"
                            fill="none"
                            animate={{
                                translateX: ["0%", "-50%"]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: score < 40 ? 0.5 : 2,
                                ease: "linear"
                            }}
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default PrognosisSimulator;
