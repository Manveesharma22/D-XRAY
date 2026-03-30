import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function VitalMetric({ label, value, unit, status = 'stable' }) {
    const color = status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-cyan-400 shadow-[0_0_10px_rgba(0,251,255,0.3)]';
    const [jitter, setJitter] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setJitter((Math.random() - 0.5) * 2);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const displayValue = typeof value === 'number' ? (value + jitter).toFixed(1) : value;

    return (
        <div className="flex flex-col items-center px-8 border-r border-white/5 last:border-0 relative group">
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00fbff]" />
            </div>
            <span className="text-[9px] font-technical text-cyan-500/20 uppercase tracking-[0.4em] mb-1 font-bold">{label?.replace(' ', '_')}</span>
            <div className="flex items-baseline gap-2 font-technical">
                <span className={`text-2xl font-bold tracking-tighter holographic-bloom ${color}`}>{displayValue}</span>
                <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">{unit}</span>
            </div>
        </div>
    );
}

export default function VitalsBar({ data }) {
    const [time, setTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(t);
    }, []);

    const hr = data?.vitals?.hr || 74;
    const bp = data?.vitals?.bp || "120/80";
    const oxygen = data?.vitals?.oxygen || 98;
    const temp = data?.vitals?.temp || 36.6;

    return (
        <div className="fixed top-0 left-0 w-full h-20 bg-[#111417]/95 backdrop-blur-3xl border-b border-white/10 z-[100] flex items-center justify-between px-10 shadow-[0_0_80px_rgba(0,0,0,1)] glass-panel">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 pr-10 border-r border-white/5">
                    <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden bg-black/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.03)] group transition-all hover:border-cyan-500/30">
                        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                        <div className="w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-[0_0_15px_#00fbff] relative z-10 animate-holographic-breath" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white tracking-tighter font-technical uppercase leading-none mb-1">SUBJECT_001</div>
                        <div className="text-[9px] font-technical text-cyan-500/30 tracking-[0.5em] uppercase font-bold">STATUS:_SYNCHRONIZED</div>
                    </div>
                </div>

                <div className="flex items-center">
                    <VitalMetric label="Heart Rate" value={hr} unit="bpm" status={hr > 100 ? 'critical' : 'stable'} />
                    <VitalMetric label="Blood Pressure" value={bp} unit="sys/dia" />
                    <VitalMetric label="O₂ Coverage" value={oxygen} unit="%" status={oxygen < 90 ? 'critical' : 'stable'} />
                    <VitalMetric label="Temperature" value={temp} unit="°c" />
                </div>
            </div>

            <div className="flex items-center gap-10 font-technical">
                <div className="text-right">
                    <div className="text-[9px] text-white/20 uppercase tracking-[0.5em] font-bold mb-1">Clinical_Time</div>
                    <div className="text-base font-bold text-cyan-400/80 tracking-widest">{time}</div>
                </div>
                <div className="px-6 py-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.6em] animate-pulse">TERMINAL_OK</span>
                </div>
            </div>
        </div>
    );
}
