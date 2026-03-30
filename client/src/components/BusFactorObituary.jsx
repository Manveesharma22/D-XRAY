import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function RiskGauge({ score }) {
    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f97316' : '#eab308';
    return (
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 3, boxShadow: `0 0 8px ${color}60` }}
            />
        </div>
    );
}

export default function BusFactorObituary({ data }) {
    const [selected, setSelected] = useState(null);

    if (!data?.triggered || !data?.risks?.length) return null;

    const { risks, busNumber, summary, teamSurvivalRate } = data;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(20,10,0,0.98) 0%, rgba(10,5,0,0.98) 100%)',
                boxShadow: '0 0 60px rgba(249,115,22,0.03), inset 0 0 80px rgba(0,0,0,0.6)',
            }}
        >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5">
                <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <path d="M16 8h4l3 4v5h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h3 className="text-xl font-bold text-white font-technical tracking-tighter uppercase leading-none">Personnel_Risk_Protocol</h3>
                            <span className="text-[10px] font-technical font-bold uppercase tracking-[0.4em] px-3 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                BUS_FACTOR: {busNumber ?? '??'}
                            </span>
                        </div>
                        <p className="text-[10px] text-orange-500/30 font-technical tracking-[0.5em] uppercase font-bold mt-2">
                            Institutional_Knowledge_Forensics // v2.0
                        </p>
                    </div>
                </div>

                {teamSurvivalRate !== undefined && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: 'rgba(249,115,22,0.5)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
                                TEAM SURVIVAL RATE
                            </span>
                            <span style={{
                                fontSize: 11, fontFamily: 'monospace',
                                color: teamSurvivalRate >= 70 ? '#4ade80' : teamSurvivalRate >= 40 ? '#fbbf24' : '#f87171',
                            }}>
                                {teamSurvivalRate}%
                            </span>
                        </div>
                        <RiskGauge score={100 - teamSurvivalRate} />
                    </div>
                )}
            </div>

            {/* Risk cards */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {risks.map((risk, i) => {
                    const isSelected = selected === i;
                    const riskColor = risk.riskScore >= 80 ? '#ef4444' : risk.riskScore >= 50 ? '#f97316' : '#eab308';

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setSelected(isSelected ? null : i)}
                            style={{
                                cursor: 'pointer', borderRadius: 16, overflow: 'hidden',
                                border: `1px solid ${isSelected ? riskColor + '40' : riskColor + '18'}`,
                                background: isSelected ? `${riskColor}06` : 'rgba(255,255,255,0.01)',
                                transition: 'border-color 0.2s, background 0.2s',
                            }}
                        >
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {risk.avatar ? (
                                            <img src={risk.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', opacity: 0.8 }} />
                                        ) : (
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                                background: `${riskColor}20`, border: `1px solid ${riskColor}40`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 'bold', color: riskColor,
                                            }}>
                                                {risk.login?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>@{risk.login}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: 1 }}>
                                                {risk.tenure} days · {risk.commits} commits · {risk.knowledgeAreas?.length || 0} critical areas
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="text-3xl font-bold text-white tracking-tighter font-technical holographic-bloom" style={{ color: riskColor }}>{risk.riskScore}</div>
                                        <div className="text-[8px] font-technical uppercase tracking-[0.2em] font-bold" style={{ color: `${riskColor}60` }}>RISK_INDEX</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <RiskGauge score={risk.riskScore} />
                                </div>
                            </div>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 16px 16px' }}>
                                            {/* Pre-written obituary */}
                                            <div style={{
                                                padding: '14px 16px', borderRadius: 12, marginBottom: 12,
                                                background: 'rgba(0,0,0,0.4)', border: `1px dashed ${riskColor}20`,
                                            }}>
                                                <div style={{ fontSize: 10, fontFamily: 'monospace', color: `${riskColor}50`, letterSpacing: '0.2em', marginBottom: 8 }}>
                                                    IN MEMORIAM — PRE-WRITTEN
                                                </div>
                                                <p style={{ fontSize: 14, color: 'rgba(255,235,210,0.75)', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                                                    {risk.obituary || `If @${risk.login} left tomorrow, ${risk.knowledgePercentage || '?'}% of this codebase's institutional knowledge would leave with them. The ${risk.criticalModule || 'core system'} they built has no living documentation. The team would spend the next quarter reverse-engineering their decisions.`}
                                                </p>
                                            </div>

                                            {/* Knowledge areas */}
                                            {risk.knowledgeAreas?.length > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 8 }}>
                                                        KNOWLEDGE HELD HOSTAGE
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                        {risk.knowledgeAreas.map((area, j) => (
                                                            <span key={j} style={{
                                                                fontSize: 11, padding: '4px 9px', borderRadius: 6,
                                                                background: `${riskColor}12`, color: `${riskColor}80`,
                                                                border: `1px solid ${riskColor}20`, fontFamily: 'monospace',
                                                            }}>
                                                                {area}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mitigation */}
                                            {risk.mitigation && (
                                                <div style={{
                                                    padding: '8px 12px', borderRadius: 8,
                                                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
                                                }}>
                                                    <div style={{ fontSize: 10, color: 'rgba(52,211,153,0.5)', fontFamily: 'monospace', letterSpacing: '0.15em', marginBottom: 4 }}>
                                                        SURVIVAL PLAN
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'rgba(52,211,153,0.75)', lineHeight: 1.5 }}>{risk.mitigation}</div>
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

            <div style={{ padding: '12px 32px', borderTop: '1px solid rgba(249,115,22,0.06)' }}>
                <p style={{ fontSize: 12, color: 'rgba(249,115,22,0.3)', fontFamily: 'monospace', margin: 0 }}>
                    Bus Factor: the number of team members who could be hit by a bus before this project collapses. Yours is {busNumber ?? '?'}. Plan accordingly.
                </p>
            </div>
        </motion.div>
    );
}
