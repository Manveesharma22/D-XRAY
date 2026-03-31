import React from 'react';
import { motion } from 'framer-motion';

export default function TheMirror({ data, onClose }) {
    if (!data) return null;

    const { user, heartbeat, shadow, fingerprint, debtSignature, burnout } = data;

    return (
        <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 80, delay: 0.5 }}
            style={{
                position: 'fixed',
                top: '10vh',
                left: 20,
                width: '400px',
                maxHeight: '80vh',
                zIndex: 100,
                background: 'rgba(5, 5, 10, 0.95)',
                border: '1px solid rgba(0, 229, 255, 0.15)',
                borderRadius: '16px',
                boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 229, 255, 0.05)',
                color: '#fff',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(20px)',
            }}
            className="custom-scrollbar"
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-6 h-6 rounded-full border border-cyan-500/20 flex items-center justify-center text-cyan-500/40 hover:text-cyan-400 hover:border-cyan-400/40 transition-all z-50 bg-black/20"
                title="Close Reflection"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Mourning / Clinical Border */}
            <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(0, 229, 255, 0.05)', borderRadius: '12px', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid rgba(0, 229, 255, 0.1)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <motion.img
                            src={user.avatar}
                            alt={user.login}
                            style={{ width: 56, height: 56, borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.3)' }}
                            initial={{ filter: 'grayscale(1) contrast(1.2)' }}
                            animate={{ filter: 'grayscale(0.5) contrast(1.1)' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, rgba(0,229,255,0.1), transparent)', borderRadius: '12px' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: 'rgba(0, 229, 255, 0.4)', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            Subject Identification
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0' }}>{user.name || user.login}</h2>
                        <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>@{user.login}</div>
                    </div>
                </div>

                {/* Mirror Label */}
                <div style={{
                    position: 'absolute', top: 32, right: 24, padding: '4px 8px',
                    background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)',
                    borderRadius: '4px', fontSize: 9, fontWeight: 900, color: '#00e5ff', letterSpacing: '0.1em'
                }}>
                    THE MIRROR
                </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* Coding Heartbeat */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 10px #00e5ff' }} />
                        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Coding Heartbeat</h3>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                            {heartbeat.perceivedVsReal}
                        </div>
                        {/* Visualizer for distribution */}
                        <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                            {heartbeat.hourDistribution.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.min(100, (h / (Math.max(...heartbeat.hourDistribution) || 1)) * 100)}%` }}
                                    style={{
                                        flex: 1,
                                        background: i === heartbeat.peakHour ? '#00e5ff' : 'rgba(0,229,255,0.2)',
                                        borderRadius: '1px'
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', mt: 4, fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                            <span>00h</span>
                            <span>12h</span>
                            <span>23h</span>
                        </div>
                    </div>
                </section>

                {/* Collaboration Shadow */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '2px', background: '#a855f7', boxShadow: '0 0 10px #a855f7' }} />
                        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Collaboration Shadow</h3>
                    </div>
                    <div style={{ background: 'rgba(168, 85, 247, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#a855f7', marginBottom: 4 }}>{shadow.gravity} Gravity</div>
                        <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                            {shadow.description}
                        </div>
                    </div>
                </section>

                {/* Fingerprint */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" /></svg>
                        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Stylistic Fingerprint</h3>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', mb: 12 }}>
                            {fingerprint.words.map((w, i) => (
                                <span key={i} style={{
                                    padding: '4px 10px', background: 'rgba(244, 63, 94, 0.1)',
                                    border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '20px',
                                    fontSize: 10, fontWeight: 700, color: '#f43f5e', fontFamily: 'monospace'
                                }}>
                                    {w}
                                </span>
                            ))}
                        </div>
                        <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
                            {fingerprint.description}
                        </div>
                    </div>
                </section>

                {/* Debt Signature */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 12, height: 2, background: '#eab308', boxShadow: '0 0 8px #eab308' }} />
                        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Debt Signature</h3>
                    </div>
                    <div style={{ background: 'rgba(234, 179, 8, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.1)' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#eab308', marginBottom: 4 }}>{debtSignature.role}</div>
                        <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                            {debtSignature.description}
                        </div>
                    </div>
                </section>

                {/* Burnout Fingerprint */}
                <section style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 12, height: 12, background: burnout.risk === 'Elevated' ? '#ef4444' : '#22c55e', borderRadius: '2px', animation: burnout.risk === 'Elevated' ? 'pulse 2s infinite' : 'none' }} />
                        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>Burnout Predictor</h3>
                    </div>
                    <div style={{ background: burnout.risk === 'Elevated' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.03)', padding: '16px', borderRadius: '12px', border: `1px solid ${burnout.risk === 'Elevated' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.1)'}` }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: burnout.risk === 'Elevated' ? '#ef4444' : '#22c55e', letterSpacing: '0.1em', marginBottom: 6 }}>
                            MOMENTUM: {burnout.risk.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                            {burnout.description}
                        </div>
                    </div>
                </section>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', mt: 'auto' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', textAlign: 'center' }}>
                    CONFIDENTIAL PERSONAL DIAGNOSTIC &mdash; FOR SUBJECT EYES ONLY
                </div>
            </div>
        </motion.div>
    );
}
