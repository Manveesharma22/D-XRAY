import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function CountdownClock({ seconds }) {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (!seconds) return;
        setRemaining(seconds);
        const iv = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
        return () => clearInterval(iv);
    }, [seconds]);

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;

    const pads = (n) => String(n).padStart(2, '0');

    return (
        <div style={{ display: 'flex', gap: 6, fontFamily: 'monospace', alignItems: 'center' }}>
            {[
                { v: pads(days), l: 'd' },
                { v: pads(hours), l: 'h' },
                { v: pads(mins), l: 'm' },
                { v: pads(secs), l: 's' },
            ].map(({ v, l }, i) => (
                <React.Fragment key={l}>
                    {i > 0 && <span style={{ color: 'rgba(239,68,68,0.4)', fontSize: 20 }}>:</span>}
                    <div style={{ textAlign: 'center' }}>
                        <motion.div
                            key={v}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                fontSize: 28, fontWeight: 900, color: 'rgba(239,68,68,0.95)',
                                textShadow: '0 0 20px rgba(239,68,68,0.5)',
                                lineHeight: 1,
                            }}
                        >
                            {v}
                        </motion.div>
                        <div style={{ fontSize: 8, color: 'rgba(239,68,68,0.4)', letterSpacing: '0.2em', marginTop: 2 }}>{l}</div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

export default function TimeBombAlert({ data }) {
    const [expanded, setExpanded] = useState(null);
    if (!data?.triggered || !data?.bombs?.length) return null;

    const { bombs, risk, summary } = data;
    const criticalBombs = bombs.filter(b => b.severity === 'critical');
    const highBombs = bombs.filter(b => b.severity === 'high');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(20,0,0,0.95) 0%, rgba(12,2,0,0.97) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
                boxShadow: '0 0 60px rgba(239,68,68,0.06), inset 0 0 40px rgba(0,0,0,0.3)',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '24px 32px 20px',
                borderBottom: '1px solid rgba(239,68,68,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Animated bomb icon */}
                    <motion.div
                        animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 20px rgba(239,68,68,0.4)', '0 0 0px rgba(239,68,68,0)'] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <circle cx="12" cy="14" r="7" />
                            <path d="M12 7v-3M16 5l2-2M8 5l-2-2" />
                            <circle cx="12" cy="14" r="2" fill="#ef4444" />
                        </svg>
                    </motion.div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Time Bomb Alert</h3>
                            <span style={{
                                fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.15em',
                                background: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.9)',
                                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                                padding: '2px 7px', textTransform: 'uppercase',
                            }}>
                                {risk || 'CRITICAL'}
                            </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.45)', fontFamily: 'monospace', margin: '3px 0 0', letterSpacing: '0.05em' }}>
                            {bombs.length} active threat{bombs.length !== 1 ? 's' : ''} detected • Detonation imminent
                        </p>
                    </div>
                </div>
                {criticalBombs.length > 0 && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: 'rgba(239,68,68,0.4)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 4 }}>
                            CRITICAL DETONATION IN
                        </div>
                        <CountdownClock seconds={criticalBombs[0]?.daysUntilDetonation
                            ? criticalBombs[0].daysUntilDetonation * 86400
                            : 864000} />
                    </div>
                )}
            </div>

            {/* Summary */}
            {summary && (
                <div style={{ padding: '14px 32px', background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid rgba(239,68,68,0.06)' }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,200,200,0.6)', fontFamily: 'monospace', margin: 0, lineHeight: 1.6 }}>
                        {summary}
                    </p>
                </div>
            )}

            {/* Bombs list */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bombs.slice(0, 6).map((bomb, i) => {
                    const isExpanded = expanded === i;
                    const sColor = bomb.severity === 'critical' ? '#ef4444'
                        : bomb.severity === 'high' ? '#f97316'
                            : '#eab308';

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={() => setExpanded(isExpanded ? null : i)}
                            style={{
                                cursor: 'pointer',
                                borderRadius: 14, overflow: 'hidden',
                                border: `1px solid ${sColor}22`,
                                background: `rgba(${bomb.severity === 'critical' ? '239,68,68' : bomb.severity === 'high' ? '249,115,22' : '234,179,8'},0.04)`,
                            }}
                        >
                            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {/* Fuse animation */}
                                    <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 0.6 + i * 0.15, repeat: Infinity }}
                                        style={{ width: 8, height: 8, borderRadius: '50%', background: sColor, flexShrink: 0 }}
                                    />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{bomb.name || bomb.package}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginTop: 1 }}>
                                            {bomb.type} · {bomb.daysUntilDetonation ? `${bomb.daysUntilDetonation}d until detonation` : 'Active threat'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.1em',
                                        background: `${sColor}22`, color: sColor,
                                        border: `1px solid ${sColor}44`, borderRadius: 5,
                                        padding: '2px 6px', textTransform: 'uppercase',
                                    }}>{bomb.severity}</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"
                                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 16px 14px' }}>
                                            <div style={{ height: 1, background: `${sColor}20`, marginBottom: 12 }} />
                                            {bomb.description && (
                                                <p style={{ fontSize: 12, color: 'rgba(255,220,220,0.6)', margin: '0 0 8px', lineHeight: 1.6 }}>
                                                    {bomb.description}
                                                </p>
                                            )}
                                            {bomb.fix && (
                                                <div style={{
                                                    padding: '8px 12px', borderRadius: 8, marginTop: 8,
                                                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
                                                }}>
                                                    <div style={{ fontSize: 8, color: 'rgba(52,211,153,0.5)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 4 }}>
                                                        RECOMMENDED FIX
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'rgba(52,211,153,0.8)', fontFamily: 'monospace' }}>{bomb.fix}</div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer metric */}
            <div style={{
                padding: '14px 32px', borderTop: '1px solid rgba(239,68,68,0.06)',
                display: 'flex', gap: 24,
            }}>
                <div>
                    <div style={{ fontSize: 8, color: 'rgba(239,68,68,0.35)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>CRITICAL</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{criticalBombs.length}</div>
                </div>
                <div>
                    <div style={{ fontSize: 8, color: 'rgba(249,115,22,0.35)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>HIGH</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#f97316' }}>{highBombs.length}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <p style={{ fontSize: 10, color: 'rgba(239,68,68,0.3)', fontFamily: 'monospace', margin: 0 }}>
                        These will explode. The only question is whether you're still around when they do.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
