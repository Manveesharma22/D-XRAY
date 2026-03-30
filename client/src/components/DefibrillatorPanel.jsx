import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DefibrillatorPanel({ diagnosis, onDismiss }) {
    const [charge, setCharge] = useState(0);
    const [shocked, setShocked] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Charge up automatically
        intervalRef.current = setInterval(() => {
            setCharge(prev => {
                if (prev >= 100) { clearInterval(intervalRef.current); return 100; }
                return prev + 1.5;
            });
        }, 40);
        return () => clearInterval(intervalRef.current);
    }, []);

    const handleShock = () => {
        if (charge < 100) return;
        setShocked(true);
    };

    // Extract top 3 critical fixes from diagnosis
    const emergencyFixes = diagnosis?.sections
        ?.filter(s => s.severity === 'critical' || s.priority === 'urgent')
        ?.slice(0, 3) || [];

    const chargeColor = charge >= 100 ? '#ff2222' : charge >= 60 ? '#f59e0b' : '#00e5ff';

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-80"
            style={{ filter: shocked ? 'brightness(1.5)' : 'none' }}
        >
            <div className="glass-panel rounded-2xl p-6 border border-red-500/20" style={{
                boxShadow: charge >= 100 ? '0 0 40px rgba(255,34,34,0.25), 0 0 80px rgba(255,34,34,0.1)' : '0 0 20px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-mono text-red-400/80 tracking-[0.2em] uppercase">Emergency Triage</span>
                    </div>
                    <button onClick={onDismiss} className="text-cyan-400/50 hover:text-cyan-600/50 text-sm transition-colors">✕</button>
                </div>

                {/* EKG flatline visualization */}
                <div className="mb-4 h-8 rounded overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <svg width="100%" height="32" viewBox="0 0 280 32">
                        {/* Flatline */}
                        <line x1="0" y1="16" x2={charge >= 100 ? "100" : "280"} x2="280" y2="16" stroke="rgba(255,68,68,0.4)" strokeWidth="1.5" />
                        {/* Shock spike if charged */}
                        {charge >= 100 && !shocked && (
                            <path d="M 130,16 L 140,2 L 150,30 L 160,8 L 170,16 L 280,16" fill="none" stroke="#ff2222" strokeWidth="2"
                                style={{ filter: 'drop-shadow(0 0 4px #ff2222)' }}>
                                <animate attributeName="stroke-dashoffset" values="200;0" dur="0.5s" repeatCount="indefinite" />
                            </path>
                        )}
                        {shocked && (
                            <path d="M 80,16 L 100,0 L 120,32 L 140,2 L 160,28 L 180,10 L 200,16 L 280,16" fill="none" stroke="#00e5ff" strokeWidth="2"
                                style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }} />
                        )}
                    </svg>
                </div>

                {/* Paddles + Charge */}
                {!shocked ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            {/* Left paddle */}
                            <div className="flex-1 flex flex-col items-center p-3 rounded-xl border" style={{ borderColor: `${chargeColor}30`, background: `${chargeColor}08` }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <rect x="6" y="2" width="12" height="16" rx="2" stroke={chargeColor} strokeWidth="1.5" />
                                    <line x1="12" y1="18" x2="12" y2="22" stroke={chargeColor} strokeWidth="2" />
                                    <line x1="8" y1="22" x2="16" y2="22" stroke={chargeColor} strokeWidth="2" />
                                    <line x1="9" y1="8" x2="15" y2="8" stroke={chargeColor} strokeWidth="1" />
                                    <line x1="12" y1="6" x2="12" y2="12" stroke={chargeColor} strokeWidth="1" />
                                </svg>
                            </div>

                            {/* Charge bar */}
                            <div className="flex-1 space-y-1">
                                <div className="text-[9px] font-mono text-center" style={{ color: chargeColor }}>
                                    {charge >= 100 ? 'CHARGED' : `CHARGING ${Math.round(charge)}%`}
                                </div>
                                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${chargeColor}20` }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        animate={{ width: `${charge}%` }}
                                        style={{ background: `linear-gradient(to right, ${chargeColor}80, ${chargeColor})` }}
                                    />
                                </div>
                            </div>

                            {/* Right paddle */}
                            <div className="flex-1 flex flex-col items-center p-3 rounded-xl border" style={{ borderColor: `${chargeColor}30`, background: `${chargeColor}08` }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <rect x="6" y="2" width="12" height="16" rx="2" stroke={chargeColor} strokeWidth="1.5" />
                                    <line x1="12" y1="18" x2="12" y2="22" stroke={chargeColor} strokeWidth="2" />
                                    <line x1="8" y1="22" x2="16" y2="22" stroke={chargeColor} strokeWidth="2" />
                                    <line x1="9" y1="8" x2="15" y2="8" stroke={chargeColor} strokeWidth="1" />
                                </svg>
                            </div>
                        </div>

                        <button
                            onClick={handleShock}
                            disabled={charge < 100}
                            className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                                background: charge >= 100 ? 'linear-gradient(135deg, #ff2222, #cc0000)' : 'rgba(255,34,34,0.1)',
                                color: '#fff',
                                boxShadow: charge >= 100 ? '0 0 20px rgba(255,34,34,0.4)' : 'none',
                                animation: charge >= 100 ? 'pulse 1s ease-in-out infinite' : 'none'
                            }}
                        >
                            ⚡ SHOCK
                        </button>
                        <p className="text-[9px] font-mono text-red-400/30 text-center mt-2">
                            {charge < 100 ? 'Charging defibrillator...' : 'Ready to shock — click to run emergency triage'}
                        </p>
                    </>
                ) : (
                    /* Emergency Triage Results */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="text-[9px] font-mono text-cyan-400/60 tracking-widest uppercase mb-3">Emergency Protocol Activated</div>
                        {emergencyFixes.length > 0 ? (
                            <div className="space-y-2">
                                {emergencyFixes.map((fix, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                        <div className="text-[9px] font-mono text-red-400/60 mb-1">PRIORITY {i + 1}</div>
                                        <div className="text-xs font-bold text-white">{fix.title}</div>
                                        {fix.detail && <div className="text-[10px] text-cyan-800/50 mt-1 leading-relaxed">{fix.detail}</div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <div className="text-[9px] font-mono text-red-400/60 mb-1">PRIORITY 1</div>
                                    <div className="text-xs font-bold text-white">Restore CI pipeline immediately</div>
                                    <div className="text-[10px] text-cyan-800/50 mt-1">A broken build is a bleeding patient. Stop the bleeding first.</div>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <div className="text-[9px] font-mono text-amber-400/60 mb-1">PRIORITY 2</div>
                                    <div className="text-xs font-bold text-white">Add minimum test coverage</div>
                                    <div className="text-[10px] text-cyan-800/50 mt-1">Any test coverage is better than none. Ship one meaningful test today.</div>
                                </div>
                                <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                    <div className="text-[9px] font-mono text-cyan-600/60 mb-1">PRIORITY 3</div>
                                    <div className="text-xs font-bold text-white">Document the entry point</div>
                                    <div className="text-[10px] text-cyan-800/50 mt-1">Write one sentence in the README. Make the next person's first day survivable.</div>
                                </div>
                            </div>
                        )}
                        <button onClick={onDismiss} className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-cyan-600/50 border border-cyan-900/10 hover:border-cyan-800/20 transition-all">
                            Dismiss
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
