import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SKELETON_PARTS = [
  { id: 'skull', label: 'Documentation', trackKey: 'C', d: 'M80 30 C80 15 120 5 140 5 C160 5 200 15 200 30 C200 50 180 55 160 58 L160 65 L120 65 L120 58 C100 55 80 50 80 30Z', delay: 0.5 },
  { id: 'spine', label: 'CI/Build', trackKey: 'A', d: 'M140 68 L140 180', delay: 0.8 },
  { id: 'rib-l1', label: 'Tests', trackKey: 'B', d: 'M140 85 L100 95', delay: 1.0 },
  { id: 'rib-r1', label: 'Tests', trackKey: 'B', d: 'M140 85 L180 95', delay: 1.0 },
  { id: 'rib-l2', label: 'Tests', trackKey: 'B', d: 'M140 100 L95 115', delay: 1.1 },
  { id: 'rib-r2', label: 'Tests', trackKey: 'B', d: 'M140 100 L185 115', delay: 1.1 },
  { id: 'rib-l3', label: 'Tests', trackKey: 'B', d: 'M140 115 L100 135', delay: 1.2 },
  { id: 'rib-r3', label: 'Tests', trackKey: 'B', d: 'M140 115 L180 135', delay: 1.2 },
  { id: 'rib-l4', label: 'Tests', trackKey: 'B', d: 'M140 130 L105 150', delay: 1.3 },
  { id: 'rib-r4', label: 'Tests', trackKey: 'B', d: 'M140 130 L175 150', delay: 1.3 },
  { id: 'pelvis', label: 'Onboarding', trackKey: 'D', d: 'M110 180 L140 195 L170 180', delay: 1.5 },
  { id: 'arm-l', label: 'Dependencies', trackKey: 'E', d: 'M100 95 L75 140 L65 175', delay: 1.6 },
  { id: 'arm-r', label: 'Developer Flow', trackKey: 'F', d: 'M180 95 L205 140 L215 175', delay: 1.6 },
  { id: 'leg-l', label: 'Code Review', trackKey: 'G', d: 'M125 195 L115 250 L110 290', delay: 1.8 },
  { id: 'leg-r', label: 'Environment', trackKey: 'H', d: 'M155 195 L165 250 L170 290', delay: 1.8 },
];

function getBoneColor(trackKey, tracks) {
  const f = tracks[trackKey];
  if (!f) return 'rgba(0, 229, 255, 0.3)';
  if (f.score >= 75) return 'rgba(120, 230, 255, 0.6)';
  if (f.score >= 50) return 'rgba(160, 200, 210, 0.42)';
  if (f.score >= 35) return 'rgba(180, 140, 60, 0.38)';
  return 'rgba(100, 40, 40, 0.28)'; // heavily compromised — darker bone
}

function getFractureSeverity(score) {
  if (score < 20) return 'critical';
  if (score < 35) return 'severe';
  if (score < 50) return 'moderate';
  return null;
}

export default function XRayVisualization({ phase, patient, tracks, deadCode }) {
  const [visibleParts, setVisibleParts] = useState([]);
  const [fractures, setFractures] = useState([]);
  const [healingFractures, setHealingFractures] = useState(false);
  const [scanBeamY, setScanBeamY] = useState(-100);
  const [showScanBeam, setShowScanBeam] = useState(false);
  const [sweepCount, setSweepCount] = useState(0);
  const [mriMode, setMriMode] = useState(false);
  const [hoveredPart, setHoveredPart] = useState(null);
  const timeoutsRef = useRef([]);
  const beamIntervalRef = useRef(null);
  const prevPhaseRef = useRef('');

  // Scan beam sweeps top-to-bottom THREE times per PRD
  useEffect(() => {
    if (phase === 'sweep_1' && prevPhaseRef.current !== 'sweep_1') {
      prevPhaseRef.current = 'sweep_1';

      // Clear old
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      if (beamIntervalRef.current) clearInterval(beamIntervalRef.current);

      // Reveal skeleton immediately for diagnostic clarity
      setVisibleParts(SKELETON_PARTS.map(p => p.id));

      // 3 sweeps
      setShowScanBeam(true);
      setSweepCount(0);
      let currentSweep = 0;
      let beamPos = -80;

      const animateBeam = () => {
        beamPos += 3;
        if (beamPos > 420) {
          currentSweep++;
          setSweepCount(currentSweep);
          if (currentSweep >= 3) {
            clearInterval(beamIntervalRef.current);
            beamIntervalRef.current = null;
            setShowScanBeam(false);
            return;
          }
          beamPos = -80; // reset for next sweep
        }
        setScanBeamY(beamPos);
      };

      beamIntervalRef.current = setInterval(animateBeam, 22);
    }

    // Healing phase: fractures seal (animate out)
    if (phase === 'healing' && prevPhaseRef.current !== 'healing') {
      prevPhaseRef.current = 'healing';
      setHealingFractures(true);
      setTimeout(() => setFractures([]), 1800);
    }

    // Reset on new scan
    if (phase === '' && prevPhaseRef.current !== '') {
      prevPhaseRef.current = '';
      setVisibleParts([]);
      setFractures([]);
      setHealingFractures(false);
      setShowScanBeam(false);
      setSweepCount(0);
      timeoutsRef.current.forEach(clearTimeout);
      if (beamIntervalRef.current) clearInterval(beamIntervalRef.current);
    }

    // Sweep 2 or later: Ensure skeleton is visible even if sweep_1 was missed (e.g. cache hit)
    if ((phase === 'sweep_2' || phase === 'v2_scan') && visibleParts.length === 0) {
      setVisibleParts(SKELETON_PARTS.map(p => p.id));
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      if (beamIntervalRef.current) clearInterval(beamIntervalRef.current);
    };
  }, [phase, visibleParts.length]);

  // Fractures appear progressively as tracks report findings
  useEffect(() => {
    const newFracs = [];
    for (const [key, findings] of Object.entries(tracks)) {
      const severity = getFractureSeverity(findings.score);
      if (!severity) continue;
      for (const p of SKELETON_PARTS) {
        if (p.trackKey === key && !newFracs.find(f => f.partId === p.id)) {
          newFracs.push({
            id: `fracture_${p.id}`,
            partId: p.id,
            severity,
            score: findings.score,
            trackKey: key,
            label: findings.issues?.[0]?.message || ''
          });
        }
      }
    }
    setFractures(prev => {
      const prevIds = new Set(prev.map(f => f.partId));
      const additions = newFracs.filter(f => !prevIds.has(f.partId));
      if (additions.length === 0) return prev;
      return [...prev, ...additions];
    });
  }, [tracks]);

  const phaseLabel = {
    sweep_1: 'SCANNING STRUCTURE — SWEEP ' + Math.min(sweepCount + 1, 3) + '/3',
    sweep_1_done: 'STRUCTURE MAPPED',
    sweep_2: 'DIAGNOSTIC IMAGING — ALL 8 TRACKS',
    sweep_2_done: 'ALL TRACKS COMPLETE',
    sweep_3: 'ANALYZING DEBT INHERITANCE...',
    coroner: 'DEAD CODE SWEEP...',
  }[phase] || 'STANDBY';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel rounded-3xl p-6 relative overflow-hidden"
      style={{ minHeight: 440 }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Scan beam — sweeps 3 times */}
      <AnimatePresence>
        {showScanBeam && (
          <motion.div
            key={`beam-${sweepCount}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 h-24 pointer-events-none z-30"
            style={{
              top: scanBeamY,
              background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.05) 20%, rgba(0,229,255,0.12) 50%, rgba(0,229,255,0.05) 80%, transparent)',
              boxShadow: '0 0 60px rgba(0,229,255,0.08), 0 -2px 30px rgba(0,229,255,0.04), 0 2px 30px rgba(0,229,255,0.04)',
              borderRadius: '4px'
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex justify-center items-center relative z-10">
        <div className="relative">
          <svg
            viewBox="40 0 200 310"
            className="w-full max-w-[320px]"
            style={{
              filter: mriMode
                ? 'invert(1) contrast(1.4) brightness(1.1) drop-shadow(0 0 20px rgba(255,255,255,0.15))'
                : 'drop-shadow(0 0 25px rgba(0,229,255,0.1))'
            }}
          >
            <defs>
              <radialGradient id="xrayGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,229,255,0.08)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <circle cx="140" cy="150" r="130" fill="url(#xrayGlow)" />

            {/* Skeleton bones — color per track health, with invisible hover areas */}
            {SKELETON_PARTS.map(part => (
              <AnimatePresence key={part.id}>
                {visibleParts.includes(part.id) && (
                  <g>
                    <motion.path
                      d={part.d}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                      stroke={getBoneColor(part.trackKey, tracks)}
                      strokeWidth="3"
                      fill="none"
                      style={{ filter: 'drop-shadow(0 0 1.5px rgba(0,229,255,0.4))' }}
                      strokeLinecap="round"
                    />
                    {/* Invisible thick hover area */}
                    <path
                      d={part.d}
                      stroke="transparent"
                      strokeWidth="14"
                      fill="none"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                    />
                  </g>
                )}
              </AnimatePresence>
            ))}

            {/* Fractures — density-encoded: critical=obscured bone, severe=wide crack, moderate=hairline */}
            {fractures.map((f, idx) => {
              const part = SKELETON_PARTS.find(p => p.id === f.partId);
              if (!part || !visibleParts.includes(f.partId)) return null;
              const color = f.severity === 'critical' ? '#ff2222' : f.severity === 'severe' ? '#ff4444' : '#ffbb33';
              // Density parameters per severity
              const shadowW = f.severity === 'critical' ? 18 : f.severity === 'severe' ? 11 : 5;
              const shadowOp = f.severity === 'critical' ? 0.55 : f.severity === 'severe' ? 0.38 : 0.18;
              const crackW = f.severity === 'critical' ? 6 : f.severity === 'severe' ? 4 : 1.5;
              const dashArr = f.severity === 'critical' ? '8 3' : f.severity === 'severe' ? '5 3' : '2 3';
              const pulseAmp = f.severity === 'critical' ? [1, 0.3, 1] : [1, 0.6, 1];
              return (
                <motion.g key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: healingFractures ? 0 : 1 }}
                  transition={healingFractures
                    ? { duration: 1.4, ease: 'easeOut' }
                    : { delay: idx * 0.4, duration: 0.6 }}
                >
                  {/* Dark bone-shadow — makes bone look broken/obscured */}
                  <path d={part.d}
                    stroke={f.severity === 'critical' ? 'rgba(60,0,0,0.6)' : f.severity === 'severe' ? 'rgba(70,30,0,0.35)' : 'rgba(60,40,0,0.15)'}
                    strokeWidth={shadowW} fill="none" opacity={shadowOp} />
                  {/* Crack line — width + dash encode severity */}
                  <motion.path
                    d={part.d}
                    animate={{ opacity: pulseAmp }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                    stroke={color}
                    strokeWidth={crackW}
                    fill="none"
                    strokeDasharray={dashArr}
                    style={{ filter: `drop-shadow(0 0 3px ${color})` }}
                  />
                  {/* Radiating micro-cracks for critical only */}
                  {f.severity === 'critical' && (
                    <motion.path
                      d={part.d}
                      animate={{ opacity: [0.15, 0.45, 0.15] }}
                      transition={{ duration: 3.5, repeat: Infinity, delay: 0.7 }}
                      stroke="#ff0000"
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray="2 8"
                      strokeDashoffset={12}
                    />
                  )}
                </motion.g>
              );
            })}

            {/* Dead code chalk outlines + crime scene tape */}
            {deadCode?.deceased?.length > 0 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 2.5 }}>
                <rect x={40} y={276} width={200} height={9} rx={1.5}
                  fill="rgba(255,200,0,0.06)" stroke="rgba(255,200,0,0.18)" strokeWidth={0.6}
                  strokeDasharray="8 4" />
                <text x={140} y={283} textAnchor="middle" fill="rgba(255,200,0,0.3)" fontSize="4.5" fontFamily="monospace" letterSpacing="2">
                  DEAD CODE — DO NOT CROSS
                </text>
              </motion.g>
            )}
            {deadCode?.deceased?.slice(0, 5).map((corpse, i) => (
              <motion.g key={corpse.file || i} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 2 + i * 0.4 }}>
                <circle cx={52 + i * 24} cy={268} r={8} fill="rgba(255,68,68,0.04)" stroke="#ff4444" strokeWidth="0.8" strokeDasharray="2 1.5" />
                <line x1={47 + i * 24} y1={263} x2={57 + i * 24} y2={273} stroke="#ff4444" strokeWidth="0.8" />
                <line x1={57 + i * 24} y1={263} x2={47 + i * 24} y2={273} stroke="#ff4444" strokeWidth="0.8" />
                <text x={52 + i * 24} y={282} textAnchor="middle" fill="rgba(255,68,68,0.45)" fontSize="3.5" fontFamily="monospace">
                  {corpse.file?.split('/').pop()?.slice(0, 8)}
                </text>
              </motion.g>
            ))}

            {/* Anatomical labels */}
            {visibleParts.length > 5 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 2 }}>
                <text x="140" y="12" textAnchor="middle" fill="#0088aa" fontSize="7" fontFamily="monospace">SKULL — DOCS</text>
                <text x="140" y="75" textAnchor="middle" fill="#0088aa" fontSize="7" fontFamily="monospace">SPINE — CI</text>
                <text x="63" y="106" textAnchor="middle" fill="#0088aa" fontSize="5" fontFamily="monospace">RIBCAGE</text>
                <text x="217" y="106" textAnchor="middle" fill="#0088aa" fontSize="5" fontFamily="monospace">TESTS</text>
                <text x="140" y="208" textAnchor="middle" fill="#0088aa" fontSize="6" fontFamily="monospace">PELVIS — ONBOARD</text>
                <text x="53" y="175" textAnchor="middle" fill="#0088aa" fontSize="5" fontFamily="monospace">DEPS</text>
                <text x="227" y="175" textAnchor="middle" fill="#0088aa" fontSize="5" fontFamily="monospace">FLOW</text>
                <text x="103" y="298" textAnchor="middle" fill="#0088aa" fontSize="5" fontFamily="monospace">REVIEW</text>
                <text x="177" y="298" textAnchor="middle" fill="#0088aa" fontSize="5" fontFamily="monospace">ENV</text>
              </motion.g>
            )}
          </svg>

          {/* Bone hover tooltip */}
          <AnimatePresence>
            {hoveredPart && (() => {
              const part = SKELETON_PARTS.find(p => p.id === hoveredPart);
              const trackData = part ? tracks[part.trackKey] : null;
              if (!part || !trackData) return null;
              const scoreColor = trackData.score >= 70 ? '#4ade80' : trackData.score >= 40 ? '#fbbf24' : '#f87171';
              return (
                <motion.div
                  key={hoveredPart}
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,8,18,0.95)',
                    border: '1px solid rgba(0,229,255,0.15)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    minWidth: 160,
                    zIndex: 20,
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(0,229,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {part.label}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                    {part.anatomical || part.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${trackData.score}%`, background: scoreColor, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: scoreColor }}>{trackData.score}</span>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>

      {/* Phase + sweep indicator + MRI toggle */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <span className="text-[10px] font-mono text-cyan-400/60 tracking-wider">
          {phaseLabel}
        </span>
        <div className="flex items-center gap-3">
          {/* MRI Mode toggle */}
          <button
            onClick={() => setMriMode(m => !m)}
            title={mriMode ? 'Exit MRI mode' : 'Switch to MRI mode'}
            className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all tracking-wider ${mriMode
              ? 'border-white/30 text-white/70 bg-white/10'
              : 'border-cyan-500/10 text-cyan-400/40 hover:border-cyan-500/20 hover:text-cyan-800/50'
              }`}
          >
            {mriMode ? 'MRI ON' : 'MRI'}
          </button>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${sweepCount >= i && showScanBeam ? 'bg-cyan-400' :
                phase?.includes(String(i)) || phase === 'coroner' ? 'bg-cyan-400/60 animate-pulse' :
                  'bg-cyan-900/20'
                }`} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
