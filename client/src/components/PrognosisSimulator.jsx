import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrognosisSimulator = ({ data, currentScore }) => {
    const [days, setDays] = useState(0);
    const [isActing, setIsActing] = useState(false);
    const logRef = useRef(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [days, isActing]);

    if (!data || !data.timeline) return null;

    const currentFrame = useMemo(() => {
        // Find the closest data point
        return data.timeline.reduce((prev, curr) =>
            Math.abs(curr.day - days) < Math.abs(prev.day - days) ? curr : prev
        );
    }, [days, data.timeline]);

    // Interpolate health for visual effects
    const displayScore = isActing ? currentFrame.interventionScore : currentFrame.score;
    const severity = (100 - displayScore) / 100;

    const phase = days < 30 ? 'The Drift' : days < 60 ? 'The Threshold' : 'The Crisis';
    const phaseColor = days < 30 ? 'text-cyan-500' : days < 60 ? 'text-amber-500' : 'text-red-500';

    // Collect story beats encountered so far
    const visibleBeats = useMemo(() => {
        return data.timeline
            .filter(f => f.day <= days && (isActing ? f.healingBeat : f.storyBeat))
            .map(f => ({ day: f.day, text: isActing ? f.healingBeat : f.storyBeat }));
    }, [days, data.timeline, isActing]);

    return (
        <div className="glass-panel rounded-3xl p-8 border-cyan-500/10 overflow-hidden relative">
            {/* Background Narrative Watermark */}
            <div className="absolute inset-x-0 top-0 pointer-events-none opacity-[0.02] font-black text-[120px] flex items-center justify-center select-none uppercase tracking-tighter overflow-hidden whitespace-nowrap leading-none pt-12">
                {isActing ? 'RESOLUTION' : phase}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-8 relative z-10">
                <div className="flex-1">
                    <div className="text-[10px] font-mono text-cyan-600/40 tracking-[0.3em] uppercase mb-2">Prognosis Engine v2.0 // Temporal Simulation</div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tight">The Price of Inaction</h2>
                    <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                        Visualizing the next 90 days. This is a **forward-simulation**
                        pattern-matched against thousands of repo death spirals. <br className="hidden md:block" />
                        <span className="text-white/60 font-mono text-[10px] uppercase tracking-widest">Scrub to witness the narrative &rarr;</span>
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-black/80 border border-white/5 p-6 rounded-2xl min-w-[200px] text-center shadow-2xl relative overflow-hidden group">
                        {isActing && <motion.div initial={{ x: '-100%' }} animate={{ x: '200%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12" />}
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Remediation Cost</div>
                        <div className="text-6xl font-black text-white mb-1 group-hover:scale-110 transition-transform">
                            {currentFrame.costToFix}
                            <span className="text-xs text-slate-600 ml-1 font-mono uppercase">Days</span>
                        </div>
                        {days > 0 && (
                            <div className={`text-[10px] font-mono uppercase tracking-tighter ${isActing ? 'text-emerald-500' : 'text-red-500'} animate-pulse`}>
                                {isActing ? 'Reducing Momentum' : `+${Math.round((currentFrame.costToFix / data.timeline[0].costToFix - 1) * 100)}% compounding`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Side-by-Side View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative z-10">
                {/* Panel 1: Today */}
                <div className="relative">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <div>
                            <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">ADMITTED_STATE</div>
                            <div className="text-xs text-white/40">Baseline Morphology</div>
                        </div>
                        <div className="text-2xl font-black text-cyan-500/40 font-mono">{currentScore}</div>
                    </div>
                    <div className="aspect-[4/5] bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                        <XRayVisual score={currentScore} severity={0.1} />
                    </div>
                </div>

                {/* Panel 2: Simulation */}
                <div className="relative">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <div>
                            <div className={`text-[10px] font-mono uppercase tracking-widest ${phaseColor}`}>
                                {isActing ? 'OPTIMIZED_FUTURE' : phase}
                            </div>
                            <div className="text-xs text-white/40">T-Plus {days} Days</div>
                        </div>
                        <div className={`text-2xl font-black font-mono transition-colors duration-500 ${isActing ? 'text-emerald-500' : phaseColor}`}>
                            {displayScore}
                        </div>
                    </div>
                    <div className={`aspect-[4/5] rounded-3xl border transition-all duration-700 relative overflow-hidden flex items-center justify-center ${isActing ? 'bg-emerald-950/20 border-emerald-500/30' : (days > 60 ? 'bg-red-950/20 border-red-500/30 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]' : 'bg-black/60 border-white/5')}`}>
                        <XRayVisual score={displayScore} severity={severity} isFuture={true} />

                        {/* Phase Notifications */}
                        <AnimatePresence mode="wait">
                            {currentFrame.signals.length > 0 && !isActing && (
                                <motion.div
                                    key={currentFrame.signals[0]}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-6 left-6 right-6 p-4 bg-black/60 border border-white/10 rounded-xl backdrop-blur-md"
                                >
                                    <div className="text-white text-xs font-bold mb-1">{currentFrame.signals[0]}</div>
                                    <div className="text-white/40 text-[10px]">{currentFrame.signals[1]}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Critical Person Risk */}
                        {days >= 67 && data.atRiskContributor && !isActing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute bottom-6 left-6 right-6 p-5 bg-red-950/40 border border-red-500/40 rounded-2xl backdrop-blur-xl shadow-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 font-bold">!</div>
                                    <div>
                                        <div className="text-red-400 text-[10px] font-mono uppercase tracking-[0.2em]">Contributor Fracture: Day {days}</div>
                                        <div className="text-white font-bold text-sm">@{data.atRiskContributor.login} at critical disengagement risk.</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slider Interface */}
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="relative group">
                    <input
                        type="range"
                        min="0"
                        max="90"
                        step="2"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className={`w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer focus:outline-none transition-all ${days > 60 ? 'accent-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'accent-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'}`}
                    />
                    <div className="flex justify-between mt-4 text-[9px] font-mono text-slate-500 tracking-widest uppercase">
                        <span className={days === 0 ? 'text-white' : ''}>Baseline</span>
                        <span className={days === 30 ? 'text-white' : ''}>Day 30</span>
                        <span className={days === 60 ? 'text-white' : ''}>Day 60</span>
                        <span className={days === 90 ? 'text-white' : ''}>Day 90</span>
                    </div>

                    {/* Scrubbing tip */}
                    {days === 0 && (
                        <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-10 left-0 text-cyan-400 text-[10px] font-mono tracking-widest uppercase">
                            Scrub timeline &rarr;
                        </motion.div>
                    )}
                </div>

                {/* THE TEMPORAL LOG — Suspense Story */}
                <div ref={logRef} className="glass-panel border-white/5 bg-black/60 p-5 rounded-2xl h-[130px] overflow-y-auto font-mono scroll-smooth shadow-inner">
                    <div className="text-[10px] text-cyan-600/40 uppercase tracking-widest mb-3 flex justify-between items-center sticky top-0 bg-black/40 backdrop-blur-sm py-1">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span>Temporal Log // Transcript</span>
                        </div>
                        <span className="text-[8px] opacity-40">System-Time: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="space-y-4">
                        {visibleBeats.length > 0 ? (
                            visibleBeats.map((beat, idx) => (
                                <motion.div
                                    key={`${beat.day}-${idx}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-4 border-l border-white/5 pl-3 group"
                                >
                                    <span className="text-white/20 whitespace-nowrap text-[9px] pt-1 font-mono">D{beat.day.toString().padStart(2, '0')}</span>
                                    <span className={`text-[11px] leading-relaxed transition-colors ${isActing ? 'text-emerald-400' : (beat.day >= 67 ? 'text-red-400' : 'text-slate-300')} group-hover:text-white`}>
                                        {beat.text}
                                    </span>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-white/10 text-[10px] text-center pt-8 italic">Awaiting simulation data... Move the slider to witness the narrative timeline.</div>
                        )}
                        <div id="narrative-bottom" />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsActing(!isActing)}
                        className={`group relative px-10 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-700 border overflow-hidden ${isActing ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-transparent border-white/20 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'}`}
                    >
                        <span className="relative z-10">{isActing ? '✓ Clinical Action Active' : 'Show me what changes if we act today'}</span>
                        {!isActing && <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />}
                    </motion.button>

                    <div className="text-center sm:text-right">
                        <div className="text-[10px] font-mono text-slate-600 uppercase mb-1 tracking-widest">Compounding Velocity Loss</div>
                        <div className={`text-xl font-black font-mono ${isActing ? 'text-emerald-500' : 'text-white'}`}>
                            {isActing ? '0.0x' : (1 + (severity * 4)).toFixed(1)}<span className="text-xs ml-1 opacity-40">COF_MULTIPLIER</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const XRayVisual = ({ score, severity, isFuture }) => {
    // Advanced visual logic: darker background, more fractures, unstable EKG
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Ambient Darkening */}
            <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ background: isFuture ? `radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,${Math.min(0.9, severity * 0.8)}) 100%)` : 'none' }}
            />

            <svg width="220" height="320" viewBox="0 0 200 300" fill="none" className="z-10 transition-all duration-700">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ribcage */}
                {[...Array(7)].map((_, i) => (
                    <motion.path
                        key={i}
                        d={`M 40 ${50 + i * 35} Q 100 ${45 + i * 38} 160 ${50 + i * 35}`}
                        stroke={isFuture && score < 50 ? `rgba(255, 100, 100, ${0.3 + (1 - score / 100)})` : 'rgba(255,255,255,0.3)'}
                        strokeWidth={4 - (i * 0.2)}
                        filter="url(#glow)"
                        animate={{
                            opacity: isFuture && score < 40 ? [0.3, 0.1, 0.3] : 0.3,
                            strokeWidth: isFuture && score < 30 ? [3, 4.5, 3] : 3.5
                        }}
                    />
                ))}

                {/* Spine */}
                <rect x="98" y="30" width="4" height="240" fill="rgba(255,255,255,0.15)" />

                {/* Growth of Fractures based on score */}
                {isFuture && score < 80 && <Fracture x={130} y={70} scale={1 - score / 100} />}
                {isFuture && score < 60 && <Fracture x={50} y={150} scale={1.2 - score / 100} rotation={180} />}
                {isFuture && score < 40 && <Fracture x={140} y={220} scale={1.5 - score / 100} rotation={45} />}
                {isFuture && score < 20 && <Fracture x={80} y={100} scale={2 - score / 100} rotation={90} />}
                {isFuture && score < 15 && <Fracture x={100} y={180} scale={2.5 - score / 100} />}
            </svg>

            {/* EKG - destabilizes at low score */}
            {isFuture && (
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-20 opacity-20 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 400 80" preserveAspectRatio="none">
                        <motion.path
                            d="M 0 40 L 100 40 L 110 10 L 130 70 L 140 40 L 250 40 L 260 0 L 280 80 L 290 40"
                            stroke={score < 40 ? "#ff0000" : "#00ffff"}
                            strokeWidth={score < 30 ? "2" : "1"}
                            fill="none"
                            animate={{
                                translateX: ["0%", "-50%"],
                                opacity: score < 40 ? [0.2, 0.8, 0.2] : 0.2
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: score < 30 ? 0.3 : 1.5,
                                ease: "linear"
                            }}
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};

const Fracture = ({ x, y, scale, rotation = 0 }) => (
    <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        d="M 0 0 L 10 10 L 5 15 L 15 25 L 10 30"
        stroke="#ff3333"
        strokeWidth={1.5 * scale}
        fill="none"
        transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}
    />
);

export default PrognosisSimulator;
