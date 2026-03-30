import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEP_ICONS = { clone: '⬇️', install: '📦', env: '⚙️', run: '▶️', test: '🧪', docs: '📄', pr: '🔗', blocked: '🚫' };

function StepStatus({ status }) {
    if (status === 'ok') return <span style={{ color: '#4ade80', fontSize: 12 }}>✓ OK</span>;
    if (status === 'blocked') return <span style={{ color: '#ef4444', fontSize: 12 }}>✗ BLOCKED</span>;
    if (status === 'warning') return <span style={{ color: '#fbbf24', fontSize: 12 }}>⚠ WARNING</span>;
    return <span style={{ color: 'rgba(0,229,255,0.5)', fontSize: 12 }}>— ?</span>;
}

export default function FirstDaySim({ data }) {
    const [activeStep, setActiveStep] = useState(-1);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    if (!data?.steps?.length) return null;
    const { steps, survivalScore, totalBlocks, timeToFirstCommit, summary, verdict } = data;

    const runSimulation = () => {
        if (running || done) return;
        setRunning(true);
        setActiveStep(-1);
        steps.forEach((_, i) => {
            setTimeout(() => setActiveStep(i), i * 800 + 300);
        });
        setTimeout(() => { setRunning(false); setDone(true); }, steps.length * 800 + 500);
    };

    const scoreColor = (survivalScore ?? 50) >= 70 ? '#4ade80' : (survivalScore ?? 50) >= 40 ? '#fbbf24' : '#f87171';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(0,12,10,0.98) 0%, rgba(0,8,6,0.98) 100%)',
                boxShadow: '0 0 60px rgba(6,182,212,0.03), inset 0 0 80px rgba(0,0,0,0.6)',
            }}
        >
            <div className="px-8 pt-8 pb-6 border-b border-white/5">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-technical tracking-tighter uppercase leading-none">Onboarding_Live_Simulation</h3>
                            <p className="text-[10px] text-cyan-500/30 font-technical tracking-[0.5em] uppercase font-bold mt-2">
                                Subject_Acclimatization_Analytics // v9.0
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] font-technical text-cyan-500/40 font-bold uppercase tracking-[0.1em] mb-1">SURVIVAL_PROJECTION</div>
                        <div className="text-4xl font-bold font-technical tracking-tighter holographic-bloom" style={{ color: scoreColor }}>{survivalScore ?? '??'}%</div>
                        {timeToFirstCommit && <div className="text-[9px] font-technical text-white/20 uppercase tracking-widest mt-1">EST_TIME_TO_COMMIT // {timeToFirstCommit.toUpperCase()}</div>}
                    </div>
                </div>
            </div>
            {summary && <div style={{ padding: '12px 32px', background: 'rgba(6,182,212,0.03)', borderBottom: '1px solid rgba(6,182,212,0.06)' }}>
                <p style={{ fontSize: 12, color: 'rgba(180,240,255,0.5)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>{summary}</p>
            </div>}

            <div style={{ margin: '20px 24px', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(6,182,212,0.08)', background: 'rgba(0,0,0,0.5)', fontFamily: "'Courier New', monospace" }}>
                <div style={{ padding: '8px 14px', background: 'rgba(6,182,212,0.06)', borderBottom: '1px solid rgba(6,182,212,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {['#ff5f57', '#ffbd2e', '#28c840'].map((c, i) => <div key={i} className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: c }} />)}
                    <span className="text-[9px] font-technical text-cyan-500/40 tracking-[0.3em] uppercase font-bold ml-4">Terminal_Input // Onboarding_Core</span>
                    <div style={{ marginLeft: 'auto' }}>
                        {!done ? (
                            <button onClick={runSimulation} disabled={running} style={{ fontSize: 9, padding: '3px 10px', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer', background: running ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.15)', color: running ? 'rgba(6,182,212,0.4)' : 'rgba(6,182,212,0.9)', border: '1px solid rgba(6,182,212,0.2)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                                {running ? 'SIMULATING...' : 'RUN SIMULATION'}
                            </button>
                        ) : (
                            <button onClick={() => { setActiveStep(-1); setRunning(false); setDone(false); }} style={{ fontSize: 9, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>RESET</button>
                        )}
                    </div>
                </div>
                <div style={{ padding: '14px 16px', minHeight: 180 }}>
                    {!running && !done && <div style={{ color: 'rgba(6,182,212,0.3)', fontSize: 11 }}><span style={{ color: '#4ade80' }}>$</span> Click "Run Simulation" to experience Day 1</div>}
                    {(running || done) && steps.map((step, i) => {
                        const isActive = activeStep === i;
                        const isPast = activeStep > i;
                        if (!isPast && !isActive) return null;
                        return (
                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <span style={{ fontSize: 10, flexShrink: 0 }}>{STEP_ICONS[step.type] || '▸'}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: step.status === 'blocked' ? '#f87171' : step.status === 'warning' ? '#fbbf24' : 'rgba(200,240,255,0.8)' }}>{step.label}</span>
                                        {isPast && <StepStatus status={step.status} />}
                                        {isActive && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ display: 'inline-block', width: 7, height: 12, background: '#06b6d4' }} />}
                                    </div>
                                    {step.command && <div style={{ fontSize: 10, color: 'rgba(6,182,212,0.5)', fontFamily: 'monospace', marginTop: 1 }}>$ {step.command}</div>}
                                    {isPast && step.error && <div style={{ fontSize: 10, color: 'rgba(239,68,68,0.7)', marginTop: 2 }}>✗ {step.error}</div>}
                                    {isPast && step.warning && <div style={{ fontSize: 10, color: 'rgba(234,179,8,0.6)', marginTop: 2 }}>⚠ {step.warning}</div>}
                                </div>
                            </motion.div>
                        );
                    })}
                    {done && verdict && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(6,182,212,0.08)' }}>
                            <span style={{ color: '#4ade80' }}>$</span>{' '}<span style={{ color: 'rgba(180,240,255,0.6)', fontSize: 11 }}>{verdict}</span>
                        </motion.div>
                    )}
                </div>
            </div>

            <div style={{ padding: '16px 32px 24px', display: 'flex', gap: 20, flexWrap: 'wrap', borderTop: '1px solid rgba(6,182,212,0.06)' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 900, color: '#f87171' }}>{totalBlocks ?? 0}</div><div style={{ fontSize: 8, color: 'rgba(239,68,68,0.4)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>BLOCKERS</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>{steps.filter(s => s.status === 'warning').length}</div><div style={{ fontSize: 8, color: 'rgba(234,179,8,0.4)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>WARNINGS</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>{steps.filter(s => s.status === 'ok').length}</div><div style={{ fontSize: 8, color: 'rgba(74,222,128,0.4)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>PASSED</div></div>
                <div style={{ marginLeft: 'auto', maxWidth: 280 }}>
                    <p style={{ fontSize: 10, color: 'rgba(6,182,212,0.3)', fontFamily: 'monospace', margin: 0, lineHeight: 1.6 }}>This is what the next developer who joins your team will experience on their first day.</p>
                </div>
            </div>
        </motion.div>
    );
}
