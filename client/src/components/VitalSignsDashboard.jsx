import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function VitalDisplay({ label, value, unit, status, detail }) {
    const statusColors = {
        normal: '#34d399',
        elevated: '#f59e0b',
        fever: '#fb923c',
        critical: '#ef4444',
        default: '#00e5ff'
    };
    const color = statusColors[status] || statusColors.default;

    return (
        <div className="flex flex-col items-center px-4 py-2.5 relative group">
            <div className="text-[9px] font-mono tracking-widest uppercase mb-1" style={{ color: `${color}60` }}>{label}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-mono" style={{ color, textShadow: `0 0 8px ${color}40` }}>
                    {value}
                </span>
                {unit && <span className="text-[9px] font-mono" style={{ color: `${color}50` }}>{unit}</span>}
            </div>
            {detail && (
                <div className="text-[8px] font-mono mt-0.5" style={{ color: `${color}40` }}>{detail}</div>
            )}
            {/* Pulse dot */}
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
        </div>
    );
}

export default function VitalSignsDashboard({ ekgState, tracks, corpusScore, scanning }) {
    const [vitals, setVitals] = useState({
        heartRate: { value: '—', status: 'default', detail: '' },
        bloodPressure: { value: '—/—', status: 'default', detail: '' },
        temperature: { value: '—', status: 'default', detail: '' },
        oxygen: { value: '—', status: 'default', unit: '%', detail: '' }
    });

    useEffect(() => {
        const newVitals = { ...vitals };

        // Heart Rate — commit frequency BPM equivalent
        if (ekgState?.bpm) {
            const bpm = ekgState.bpm;
            newVitals.heartRate = {
                value: bpm === 0 ? '0' : bpm.toString(),
                unit: 'BPM',
                status: bpm === 0 ? 'critical' : bpm > 130 ? 'fever' : bpm > 90 ? 'elevated' : 'normal',
                detail: ekgState.pattern === 'flatline' ? 'FLATLINE' : ekgState.pattern === 'tachycardia' ? 'TACHYCARDIA' : ''
            };
        }

        // Blood Pressure — CI pass/fail (systolic/diastolic format)
        if (tracks?.A) {
            const ciScore = tracks.A.score || 0;
            const systolic = Math.round(80 + (ciScore / 100) * 60); // 80-140
            const diastolic = Math.round(50 + (ciScore / 100) * 40); // 50-90
            newVitals.bloodPressure = {
                value: `${systolic}/${diastolic}`,
                status: ciScore >= 70 ? 'normal' : ciScore >= 40 ? 'elevated' : 'critical',
                detail: ciScore >= 70 ? 'stable' : ciScore >= 40 ? 'elevated' : 'critical'
            };
        }

        // Temperature — issue/incident count
        if (corpusScore) {
            const critCount = corpusScore.criticalIssues || 0;
            let tempVal, tempStatus;
            if (critCount === 0) { tempVal = '36.8°C'; tempStatus = 'normal'; }
            else if (critCount <= 2) { tempVal = '38.1°C'; tempStatus = 'elevated'; }
            else if (critCount <= 5) { tempVal = '39.4°C'; tempStatus = 'fever'; }
            else { tempVal = '40.9°C'; tempStatus = 'critical'; }
            newVitals.temperature = {
                value: tempVal,
                status: tempStatus,
                detail: `${critCount} critical finding${critCount !== 1 ? 's' : ''}`
            };
        }

        // Oxygen — test coverage
        if (tracks?.B) {
            const testScore = tracks.B.score || 0;
            const o2 = Math.round(40 + (testScore / 100) * 58); // 40-98%
            newVitals.oxygen = {
                value: o2.toString(),
                unit: '%',
                status: o2 >= 90 ? 'normal' : o2 >= 70 ? 'elevated' : o2 >= 50 ? 'fever' : 'critical',
                detail: o2 >= 90 ? 'healthy' : o2 >= 70 ? 'low' : o2 >= 50 ? 'hypoxic' : 'critical'
            };
        }

        setVitals(newVitals);
    }, [ekgState, tracks, corpusScore]);

    const isDefibrillatorAlert = vitals.oxygen.status === 'critical' || vitals.heartRate.status === 'critical';

    return (
        <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-30 border-b border-cyan-900/10"
            style={{
                background: 'rgba(0,5,10,0.85)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between divide-x divide-cyan-900/10">
                    {/* Logo */}
                    <div className="px-4 py-2.5 shrink-0">
                        <span className="text-[10px] font-mono text-cyan-800/50 tracking-[0.3em] uppercase">DX-Ray·v2</span>
                    </div>

                    {/* Vitals */}
                    <div className="flex flex-1 divide-x divide-cyan-900/10">
                        <VitalDisplay
                            label="Heart rate"
                            value={vitals.heartRate.value}
                            unit={vitals.heartRate.unit}
                            status={vitals.heartRate.status}
                            detail={vitals.heartRate.detail}
                        />
                        <VitalDisplay
                            label="Blood pressure"
                            value={vitals.bloodPressure.value}
                            status={vitals.bloodPressure.status}
                            detail={vitals.bloodPressure.detail}
                        />
                        <VitalDisplay
                            label="Temperature"
                            value={vitals.temperature.value}
                            status={vitals.temperature.status}
                            detail={vitals.temperature.detail}
                        />
                        <VitalDisplay
                            label="O₂ saturation"
                            value={vitals.oxygen.value}
                            unit={vitals.oxygen.unit}
                            status={vitals.oxygen.status}
                            detail={vitals.oxygen.detail}
                        />
                    </div>

                    {/* Status + defibrillator alert */}
                    <div className="px-4 py-2.5 shrink-0 flex items-center gap-2">
                        {scanning && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[9px] font-mono text-cyan-600/50">SCANNING</span>
                            </div>
                        )}
                        {isDefibrillatorAlert && (
                            <motion.div
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20"
                            >
                                <span className="text-[8px] font-mono text-red-400">⚡ DEFIB READY</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
