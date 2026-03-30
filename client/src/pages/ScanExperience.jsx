import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EKGMonitor from '../components/EKGMonitor';
import XRayVisualization from '../components/XRayVisualization';
import TrackStation from '../components/TrackStation';
import DebtInheritanceMap from '../components/DebtInheritanceMap';
import BlameMap from '../components/BlameMap';
import DeadCodeCoroner from '../components/DeadCodeCoroner';
import GhostNarrator from '../components/GhostNarrator';
import Confessional from '../components/Confessional';
import AIDoctor from '../components/AIDoctor';
import FractureReplay from '../components/FractureReplay';
import DischargeSummaryExport from '../components/DischargeSummaryExport';
import PrescriptionPad from '../components/PrescriptionPad';
import RageCommits from '../components/RageCommits';
import SoundLayer, { soundEngine } from '../components/SoundLayer';
// v2 components
import VitalSignsDashboard from '../components/VitalSignsDashboard';
import CollaborationPulse from '../components/CollaborationPulse';
import TraumaTimeline from '../components/TraumaTimeline';
import ImmuneSystem from '../components/ImmuneSystem';
import ArchaeologyLayer from '../components/ArchaeologyLayer';
import WhisperNetwork from '../components/WhisperNetwork';
import CloneDetectorDNA from '../components/CloneDetectorDNA';
import SleepStudy from '../components/SleepStudy';
import ScarTissue from '../components/ScarTissue';
import DefibrillatorPanel from '../components/DefibrillatorPanel';
import SecondOpinion from '../components/SecondOpinion';
import LivingAutopsy from '../components/LivingAutopsy';
import CodebaseObituary from '../components/CodebaseObituary';
import TimeBombAlert from '../components/TimeBombAlert';
import BusFactorObituary from '../components/BusFactorObituary';
import EmotionalTimeline from '../components/EmotionalTimeline';
import FirstDaySim from '../components/FirstDaySim';
import CompetitorBenchmark from '../components/CompetitorBenchmark';
import TheMirror from '../components/TheMirror';
import PrognosisSimulator from '../components/PrognosisSimulator';
import { config } from '../api-config';

const ACT_LABELS = {
  0: '',
  1: 'Act I — Intake',
  2: 'Act II — The X-Ray',
  3: 'Act III — The Heartbeat',
  4: 'Act IV — The Ghost',
  5: 'Act V — The Confessional',
};

const TRACK_NAMES = {
  A: { name: 'CI / Build', anatomical: 'The Spine', icon: 'S' },
  B: { name: 'Test Suite', anatomical: 'The Ribcage', icon: 'R' },
  C: { name: 'Documentation', anatomical: 'The Skull', icon: 'K' },
  D: { name: 'Onboarding', anatomical: 'The Nervous System', icon: 'N' },
  E: { name: 'Dependencies', anatomical: 'The Veins', icon: 'V' },
  F: { name: 'Developer Flow', anatomical: 'The Heartbeat', icon: 'H' },
  G: { name: 'Code Review', anatomical: 'The Circulation', icon: 'C' },
  H: { name: 'Environment', anatomical: 'The Skin', icon: 'Sk' }
};

function getAmbientClass(score) {
  if (score === null || score === undefined) return '';
  if (score >= 70) return 'ambient-healthy';
  if (score >= 40) return 'ambient-stressed';
  return 'ambient-critical';
}

export default function ScanExperience() {
  const wsRef = useRef(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentAct, setCurrentAct] = useState(0);
  const [scanData, setScanData] = useState({
    patient: null, tracks: {}, debtMap: null, deadCode: null,
    corpusScore: null, diagnosis: null, scanId: null, discharge: null,
    // v2
    collaboration: null, trauma: null, immune: null, archaeology: null,
    whispers: null, clones: null, sleepStudy: null, scarTissue: null, livingAutopsy: null, obituary: null,
    // new features
    timeBomb: null, busFactor: null, emotionalTimeline: null, firstDaySim: null, competitorBenchmark: null,
    mirror: null
  });
  const [ekgState, setEkgState] = useState({ bpm: 60, pattern: 'normal', reason: '' });
  const [xrayPhase, setXrayPhase] = useState('');
  const [showConfessional, setShowConfessional] = useState(false);
  const [confessionProcessed, setConfessionProcessed] = useState(null);
  const [activeTrackTab, setActiveTrackTab] = useState(null);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [lastTrackResult, setLastTrackResult] = useState(null);
  const [filmNegative, setFilmNegative] = useState(false);
  const [showDefibrillator, setShowDefibrillator] = useState(false);
  const [autopsyInterrupt, setAutopsyInterrupt] = useState(false);
  const [obituaryInterrupt, setObituaryInterrupt] = useState(false);
  const autopsyRef = useRef(null);
  const obituaryRef = useRef(null);

  // Ambient room: body background reacts to score
  useEffect(() => {
    const score = scanData.corpusScore?.dxScore;
    const body = document.body;
    body.classList.remove('ambient-healthy', 'ambient-stressed', 'ambient-critical');
    if (score !== null && score !== undefined) {
      body.classList.add(getAmbientClass(score));
    }
    return () => body.classList.remove('ambient-healthy', 'ambient-stressed', 'ambient-critical');
  }, [scanData.corpusScore]);

  // Defibrillator: trigger when flatline or O2 critical
  useEffect(() => {
    if (ekgState.pattern === 'flatline' ||
      (scanData.tracks?.B?.score !== undefined && scanData.tracks.B.score < 20)) {
      setTimeout(() => setShowDefibrillator(true), 2000);
    }
  }, [ekgState.pattern, scanData.tracks?.B?.score]);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'scan_started': setScanning(true); setScanComplete(false); setError(''); break;
      case 'act': setCurrentAct(data.act); break;
      case 'intake_complete': setScanData(prev => ({ ...prev, patient: data.patient })); break;
      case 'xray_beam': setXrayPhase(data.phase); break;
      case 'track_result':
        setScanData(prev => ({ ...prev, tracks: { ...prev.tracks, [data.track]: data.findings } }));
        setActiveTrackTab(data.track);
        setLastTrackResult(data.findings);
        break;
      case 'heartbeat': setEkgState({ bpm: data.bpm, pattern: data.pattern || 'normal', reason: data.reason }); break;
      case 'debt_map': setScanData(prev => ({ ...prev, debtMap: data })); break;
      case 'dead_code': setScanData(prev => ({ ...prev, deadCode: data })); break;
      case 'dx_score': setScanData(prev => ({ ...prev, corpusScore: data })); break;
      case 'diagnosis': setScanData(prev => ({ ...prev, diagnosis: data })); break;
      case 'confession_processed':
        setConfessionProcessed(data.healing);
        setEkgState(prev => ({ ...prev, bpm: Math.max(50, prev.bpm - 20), pattern: 'healing' }));
        setXrayPhase('healing'); // fractures animate out
        break;
      // v2 events
      case 'collaboration_pulse': setScanData(prev => ({ ...prev, collaboration: data })); break;
      case 'trauma_timeline': setScanData(prev => ({ ...prev, trauma: data })); break;
      case 'immune_system': setScanData(prev => ({ ...prev, immune: data })); break;
      case 'archaeology_layer': setScanData(prev => ({ ...prev, archaeology: data })); break;
      case 'whisper_network': setScanData(prev => ({ ...prev, whispers: data })); break;
      case 'clone_detection': setScanData(prev => ({ ...prev, clones: data })); break;
      case 'sleep_study': setScanData(prev => ({ ...prev, sleepStudy: data })); break;
      case 'scar_tissue': setScanData(prev => ({ ...prev, scarTissue: data })); break;
      case 'time_bomb': setScanData(prev => ({ ...prev, timeBomb: data })); break;
      case 'bus_factor': setScanData(prev => ({ ...prev, busFactor: data })); break;
      case 'emotional_timeline': setScanData(prev => ({ ...prev, emotionalTimeline: data })); break;
      case 'first_day_sim': setScanData(prev => ({ ...prev, firstDaySim: data })); break;
      case 'competitor_benchmark': setScanData(prev => ({ ...prev, competitorBenchmark: data })); break;
      case 'prognosis_data': setScanData(prev => ({ ...prev, prognosis: data })); break;
      case 'mirror_scan':
        setScanData(prev => {
          const updated = { ...prev, mirror: data };
          sessionStorage.setItem('dxray_scan', JSON.stringify(updated));
          return updated;
        });
        break;
      case 'living_autopsy':
        setScanData(prev => ({ ...prev, livingAutopsy: data }));
        // Cinematic interruption: briefly black out the screen
        setAutopsyInterrupt(true);
        setTimeout(() => {
          setAutopsyInterrupt(false);
          // Scroll to autopsy section after overlay fades
          setTimeout(() => autopsyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
        }, 3800);
        break;
      case 'codebase_obituary':
        setScanData(prev => ({ ...prev, obituary: data }));
        // Cinematic mourning interrupt
        setObituaryInterrupt(true);
        setTimeout(() => {
          setObituaryInterrupt(false);
          setTimeout(() => obituaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
        }, 4500);
        break;
      case 'scan_complete':
        const completeData = { scanId: data.scanId, discharge: data.discharge };
        setScanData(prev => {
          const updated = { ...prev, ...completeData };
          sessionStorage.setItem('dxray_scan', JSON.stringify(updated));
          return updated;
        });
        setShowConfessional(true);
        setScanning(false);
        setScanComplete(true);
        break;
      case 'scan_error': setError(data.message); setScanning(false); break;
    }
  }, []);

  const connectWS = useCallback(() => {
    const ws = new WebSocket(config.WS_URL);
    ws.onopen = () => console.log('WS connected');
    ws.onmessage = (event) => {
      try { handleMessage(JSON.parse(event.data)); } catch (e) { console.error('WS parse error:', e); }
    };
    ws.onerror = () => setError('Connection error. Is the server running?');
    ws.onclose = () => console.log('WS disconnected');
    wsRef.current = ws;
  }, [handleMessage]);

  const startScan = () => {
    if (!repoUrl.trim()) return;
    if (!repoUrl.includes('github.com')) { setError('Please enter a valid GitHub repository URL'); return; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setScanData({
      patient: null, tracks: {}, debtMap: null, deadCode: null, corpusScore: null,
      diagnosis: null, scanId: null, discharge: null,
      collaboration: null, trauma: null, immune: null, archaeology: null,
      whispers: null, clones: null, sleepStudy: null, scarTissue: null, livingAutopsy: null, obituary: null,
      timeBomb: null, busFactor: null, emotionalTimeline: null, firstDaySim: null, competitorBenchmark: null,
      prognosis: null
    });
    setCurrentAct(0); setXrayPhase(''); setShowConfessional(false); setConfessionProcessed(null);
    setActiveTrackTab(null); setShareUrl(''); setLastTrackResult(null); setScanComplete(false);
    setEkgState({ bpm: 60, pattern: 'normal', reason: '' });
    setShowDefibrillator(false);
    setScanning(true); setError('');
    connectWS();
    setTimeout(() => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'start_scan', repoUrl: repoUrl.trim() }));
      }
    }, 600);
  };

  const handleConfess = (confession) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'confess', scanId: scanData.scanId, confession }));
    }
  };

  const handleShare = async () => {
    if (!scanData.scanId || !scanData.patient) return;
    const [owner, repo] = scanData.patient.name?.split('/') || ['unknown', 'repo'];
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/scans/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scanData.scanId, owner, repo, data: scanData })
      });
      const result = await res.json();
      const fullUrl = `${window.location.origin}/scan/${result.slug}`;
      setShareUrl(fullUrl);
      navigator.clipboard?.writeText(fullUrl);
    } catch (e) { console.error('Share failed:', e); }
  };

  const toggleSound = () => { soundEngine.init(); setSoundEnabled(soundEngine.toggle()); };

  return (
    <div className={`min-h-screen relative transition-colors duration-3000 ${filmNegative ? 'film-negative' : ''}`}>
      <SoundLayer currentAct={currentAct} ekgPattern={ekgState.pattern} isConfessionReady={showConfessional} trackResult={lastTrackResult} confessionProcessed={confessionProcessed} />

      {/* ════════════════════════════════════
          LIVING AUTOPSY INTERRUPT OVERLAY
          Full-screen blackout — this is not a normal finding.
          ════════════════════════════════════ */}
      <AnimatePresence>
        {autopsyInterrupt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'radial-gradient(ellipse at 50% 40%, rgba(15,8,0,0.97) 0%, #000 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'all',
            }}
          >
            {/* Film grain overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(245,158,11,0.008) 0px, transparent 1px, transparent 4px)',
              pointerEvents: 'none',
            }} />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
              style={{ textAlign: 'center', maxWidth: 480, padding: '0 32px' }}
            >
              {/* Flat EKG line */}
              <div style={{ marginBottom: 32, opacity: 0.25 }}>
                <svg width="280" height="20" viewBox="0 0 280 20" style={{ margin: '0 auto', display: 'block' }}>
                  <motion.line
                    x1="0" y1="10" x2="280" y2="10"
                    stroke="rgba(245,158,11,0.8)" strokeWidth="1.2"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.6))' }}
                  />
                </svg>
              </div>

              <div style={{
                fontSize: 9, fontFamily: 'monospace',
                letterSpacing: '0.55em', textTransform: 'uppercase',
                color: 'rgba(245,158,11,0.25)', marginBottom: 20,
              }}>
                Protocol Initiated
              </div>

              <div style={{
                fontSize: 'clamp(22px, 4vw, 34px)',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'rgba(255,235,180,0.72)',
                lineHeight: 1.4,
                textShadow: '0 0 40px rgba(245,158,11,0.18)',
                letterSpacing: '0.02em',
              }}>
                Living Autopsy
              </div>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 1.5, ease: 'easeOut' }}
                style={{
                  height: 1, width: 120, margin: '24px auto',
                  background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.22), transparent)',
                }}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 1 }}
                style={{
                  fontSize: 11, fontFamily: 'monospace',
                  color: 'rgba(245,158,11,0.2)',
                  letterSpacing: '0.15em',
                  lineHeight: 1.7,
                }}
              >
                This repo died trying.
                <br />
                Not abandoned. Interrupted.
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════
          OBITUARY INTERRUPT OVERLAY
          Full-screen mourning blackout — this repo has passed.
          ════════════════════════════════════ */}
      <AnimatePresence>
        {obituaryInterrupt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'radial-gradient(ellipse at 50% 30%, rgba(18,5,12,0.98) 0%, rgba(2,0,4,1) 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'all',
            }}
          >
            {/* Thin mourning border */}
            <div style={{
              position: 'absolute', inset: 16, borderRadius: 16,
              border: '1px solid rgba(157,78,110,0.15)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 20, borderRadius: 14,
              border: '1px solid rgba(157,78,110,0.07)',
              pointerEvents: 'none',
            }} />

            {/* Grain */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(157,78,110,0.006) 0px, transparent 1px, transparent 3px)',
              pointerEvents: 'none',
            }} />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.5 }}
              style={{ textAlign: 'center', maxWidth: 500, padding: '0 40px' }}
            >
              {/* Candle flame SVG */}
              <motion.div
                style={{ marginBottom: 32 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="24" height="34" viewBox="0 0 28 36" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                  <motion.ellipse cx="14" cy="6" rx="4" ry="6" fill="rgba(249,168,212,0.45)"
                    animate={{ ry: [5, 7, 5], cy: [6, 5, 6] }} transition={{ duration: 2.5, repeat: Infinity }} />
                  <motion.ellipse cx="14" cy="7" rx="2" ry="4" fill="rgba(255,240,210,0.7)"
                    animate={{ ry: [3, 5, 3] }} transition={{ duration: 2, repeat: Infinity }} />
                  <line x1="14" y1="12" x2="14" y2="15" stroke="rgba(100,60,80,0.7)" strokeWidth="1.5" />
                  <rect x="8" y="14" width="12" height="20" rx="2" fill="rgba(30,10,20,0.95)" stroke="rgba(157,78,110,0.25)" strokeWidth="1" />
                  <rect x="6" y="32" width="16" height="4" rx="1" fill="rgba(20,5,12,0.95)" stroke="rgba(157,78,110,0.15)" strokeWidth="1" />
                </svg>
              </motion.div>

              <div style={{
                fontSize: 9, fontFamily: 'monospace',
                letterSpacing: '0.55em', textTransform: 'uppercase',
                color: 'rgba(157,78,110,0.4)', marginBottom: 20,
              }}>
                In Memoriam
              </div>

              <div style={{
                fontSize: 'clamp(20px, 4vw, 32px)',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontStyle: 'italic', fontWeight: 400,
                color: 'rgba(255,225,238,0.7)',
                lineHeight: 1.4,
                textShadow: '0 0 40px rgba(157,78,110,0.15)',
                letterSpacing: '0.02em',
              }}>
                This repository has passed.
              </div>

              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 1.4, duration: 1.5, ease: 'easeOut' }}
                style={{
                  height: 1, width: 120, margin: '24px auto',
                  background: 'linear-gradient(90deg, transparent, rgba(157,78,110,0.25), transparent)',
                }}
              />

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 1 }}
                style={{
                  fontSize: 11, fontFamily: 'monospace',
                  color: 'rgba(157,78,110,0.3)',
                  letterSpacing: '0.15em',
                  lineHeight: 1.8,
                }}
              >
                Its eulogy is being written.
                <br />
                Every line is real.
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {(scanning || scanComplete) && (
        <VitalSignsDashboard
          ekgState={ekgState}
          tracks={scanData.tracks}
          corpusScore={scanData.corpusScore}
          scanning={scanning}
        />
      )}

      {/* Defibrillator Panel */}
      <AnimatePresence>
        {showDefibrillator && (scanning || scanComplete) && (
          <DefibrillatorPanel
            diagnosis={scanData.diagnosis}
            onDismiss={() => setShowDefibrillator(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating controls */}
      {(scanning || scanComplete) && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {/* Film Negative toggle */}
          <button
            onClick={() => setFilmNegative(f => !f)}
            title="Toggle Film Negative Mode"
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${filmNegative ? 'bg-white border-white/40' : 'bg-black/80 border-cyan-500/20 hover:border-cyan-500/40'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={filmNegative ? '#000' : '#00e5ff'} strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <circle cx="12" cy="12" r="5" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </button>
          {/* Sound toggle */}
          <button onClick={toggleSound} className="w-10 h-10 rounded-full bg-black/80 border border-cyan-500/20 flex items-center justify-center hover:border-cyan-500/40 transition-all">
            {soundEnabled ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
            )}
          </button>
        </div>
      )}

      {/* ===== CINEMATIC LANDING ===== */}
      {currentAct === 0 && !scanning && !scanComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="flex flex-col items-center justify-center min-h-[88vh] px-6 relative overflow-hidden"
        >
          {/* Deep ambient glow underneath machine */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 50% 45%, rgba(0,229,255,0.04) 0%, transparent 65%)',
          }} />
          {/* Scan lines */}
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.012) 3px, rgba(0,229,255,0.012) 4px)',
          }} />

          <div className="relative text-center space-y-8 max-w-2xl w-full">

            {/* ── The X-ray Machine ── */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: 'easeOut' }}
              className="relative mx-auto"
              style={{ width: 240, height: 220 }}
            >
              <svg width="240" height="220" viewBox="0 0 240 220" fill="none" style={{ overflow: 'visible' }}>
                {/* Machine arm / gantry — top */}
                <rect x="20" y="8" width="200" height="22" rx="6" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.18)" strokeWidth="1" />
                {/* Center beam emitter */}
                <rect x="104" y="30" width="32" height="18" rx="4" fill="rgba(0,229,255,0.10)" stroke="rgba(0,229,255,0.25)" strokeWidth="1" />
                {/* Left support column */}
                <rect x="28" y="28" width="10" height="110" rx="3" fill="rgba(0,229,255,0.05)" stroke="rgba(0,229,255,0.12)" strokeWidth="1" />
                {/* Right support column */}
                <rect x="202" y="28" width="10" height="110" rx="3" fill="rgba(0,229,255,0.05)" stroke="rgba(0,229,255,0.12)" strokeWidth="1" />

                {/* X-ray film / table */}
                <rect x="36" y="140" width="168" height="52" rx="8" fill="rgba(0,10,20,0.98)" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" />
                {/* Film content — skeleton bones — BOOSTED OPACITY */}
                {/* Spine */}
                <rect x="118" y="150" width="4" height="32" rx="1" fill="rgba(0,229,255,0.7)" />
                {[0, 1, 2, 3, 4].map(i => (
                  <g key={i}>
                    <rect x="122" y={153 + i * 6} width="10" height="2" rx="1" fill="rgba(0,229,255,0.5)" />
                    <rect x="108" y={153 + i * 6} width="10" height="2" rx="1" fill="rgba(0,229,255,0.5)" />
                  </g>
                ))}
                {/* Ribcage outlines */}
                <ellipse cx="120" cy="160" rx="28" ry="16" stroke="rgba(0,229,255,0.35)" strokeWidth="1.2" fill="none" />
                {/* Fracture hairline mark */}
                <path d="M100 156 L97 162 L102 162" stroke="rgba(255,68,68,0.8)" strokeWidth="1" fill="none" />

                {/* Animated scan beam */}
                <motion.rect
                  x="36" y="48"
                  width="168" height="6"
                  rx="3"
                  fill="url(#scanBeam)"
                  initial={{ y: 48, opacity: 0.8 }}
                  animate={{ y: [48, 128, 48], opacity: [0, 0.9, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                />

                {/* Glow around emitter when beam active */}
                <motion.ellipse
                  cx="120" cy="48" rx="16" ry="4"
                  fill="rgba(0,229,255,0.15)"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                />

                {/* Status lights */}
                <motion.circle cx="52" cy="19" r="3" fill="rgba(16,185,129,0.8)"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <motion.circle cx="64" cy="19" r="3" fill="rgba(245,158,11,0.6)"
                  animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }} />
                <motion.circle cx="76" cy="19" r="3" fill="rgba(0,229,255,0.5)"
                  animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />

                {/* EKG mini-line on machine panel */}
                <polyline
                  points="158,19 163,19 165,13 167,24 169,19 172,19 174,14 176,22 178,19 188,19"
                  stroke="rgba(16,185,129,0.5)" strokeWidth="1" fill="none"
                />

                <defs>
                  <linearGradient id="scanBeam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(0,229,255,0)" />
                    <stop offset="40%" stopColor="rgba(0,229,255,0.3)" />
                    <stop offset="50%" stopColor="rgba(0,229,255,0.7)" />
                    <stop offset="60%" stopColor="rgba(0,229,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,229,255,0)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Outer glow rings */}
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-cyan-500/10"
                  style={{ inset: -i * 20 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
                />
              ))}
            </motion.div>

            {/* ── Pitch + headline ── */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
            >
              <p className="text-xs font-mono tracking-[0.25em] uppercase mb-4" style={{ color: 'rgba(0,229,255,0.35)' }}>
                The first tool that doesn&apos;t just scan your codebase
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                <span className="text-white">It understands the</span>{' '}
                <span className="text-xray">humans</span>{' '}
                <span className="text-white">who built it.</span>
              </h2>
              <p className="text-cyan-700/60 text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
                Paste a GitHub repo. Get a full X-ray — not just of your code, but your team, debt, history, and the humans who carried it.
              </p>
            </motion.div>

            {/* ── Input ── */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => { setRepoUrl(e.target.value); soundEngine.init(); }}
                  onKeyDown={(e) => e.key === 'Enter' && startScan()}
                  placeholder="https://github.com/facebook/react"
                  className="w-full bg-black/70 border border-cyan-900/30 rounded-2xl py-5 px-6 text-center text-lg font-mono text-cyan-100 placeholder:text-cyan-900/25 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  style={{ boxShadow: repoUrl.trim() ? '0 0 30px rgba(0,229,255,0.06)' : 'none' }}
                />
                {repoUrl.trim() && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  </motion.div>
                )}
              </div>
              {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
              <motion.button
                onClick={startScan}
                disabled={!repoUrl.trim()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl font-bold text-base tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-xl active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                  boxShadow: repoUrl.trim() ? '0 0 40px rgba(0,229,255,0.2), 0 8px 32px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                Power On · Begin Scan
              </motion.button>
              <p className="text-[10px] text-cyan-900/25 tracking-wider font-mono">
                No account. No config. Public repos only. 16 diagnostic modules.
              </p>
            </motion.div>

            {/* ── Famous repos ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="pt-2"
            >
              <div className="text-[9px] font-mono tracking-[0.3em] uppercase text-center mb-3" style={{ color: 'rgba(0,229,255,0.2)' }}>
                — demo with a famous repo —
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'facebook/react', url: 'https://github.com/facebook/react', note: '★ judges know it' },
                  { label: 'vercel/next.js', url: 'https://github.com/vercel/next.js', note: '★ real fractures' },
                  { label: 'torvalds/linux', url: 'https://github.com/torvalds/linux', note: 'legendary' },
                ].map(({ label, url, note }) => (
                  <button
                    key={label}
                    onClick={() => { setRepoUrl(url); soundEngine.init(); soundEngine.ambientHum(1.5); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono border bg-black/40 hover:bg-black/60 transition-all tracking-wide"
                    style={{
                      color: 'rgba(0,229,255,0.6)',
                      borderColor: 'rgba(0,229,255,0.12)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.12)'}
                  >
                    {label}
                    <span style={{ color: 'rgba(0,229,255,0.3)', fontSize: '8px' }}>{note}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── 8 track anatomy badges ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="flex flex-wrap justify-center gap-2 pt-2"
            >
              {Object.values(TRACK_NAMES).map((t, i) => (
                <span
                  key={i}
                  className="text-[8px] font-mono px-2 py-1 rounded border"
                  style={{ color: 'rgba(0,229,255,0.2)', borderColor: 'rgba(0,229,255,0.07)' }}
                >
                  {t.icon} {t.anatomical}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ===== COMPACT INPUT BAR ===== */}
      {(scanning || scanComplete) && (
        <div className="border-b border-cyan-900/10 bg-black/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <input type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startScan()} placeholder="https://github.com/owner/repo"
              className="flex-1 bg-black/60 border border-cyan-900/20 rounded-xl py-2 px-4 text-sm font-mono text-cyan-100 placeholder:text-cyan-900/30 focus:outline-none focus:border-cyan-500/30 transition-all" />

            <button
              onClick={() => document.getElementById('prognosis-anchor')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-black text-cyan-400 tracking-[0.2em] hover:bg-cyan-500/20 transition-all"
            >
              PROGNOSIS
            </button>

            <button
              onClick={() => {
                setScanData(prev => ({
                  ...prev,
                  prognosis: {
                    timeline: Array.from({ length: 46 }, (_, i) => {
                      const day = i * 2;
                      let storyBeat = null;
                      if (day === 0) storyBeat = "Admission: The codebase arrives with chronic internal hemorrhaging.";
                      if (day === 10) storyBeat = "The Silence: Communication channels are beginning to fray.";
                      if (day === 30) storyBeat = "The Drift: Major tectonic shifts in dependency alignment.";
                      if (day === 67) storyBeat = "The Crisis: Mass exodus of the 'Hero' architect context.";
                      if (day === 90) storyBeat = "Terminal State: The repository is now an archaeological site.";

                      return {
                        day,
                        score: Math.max(10, 85 - (i * 1.5)),
                        interventionScore: Math.min(95, 85 + (i * 0.3)),
                        signals: i === 15 ? ["The Drift", "Build time +8%"] : i === 30 ? ["The Threshold", "Test flakiness"] : [],
                        costToFix: Math.round(5 + (i * 1.2)),
                        burnoutRisk: Math.min(100, i * 3),
                        storyBeat,
                        healingBeat: day === 0 ? "Intervention: First aid applied." : (day === 90 ? "Recovery: Structural integrity restored." : null)
                      }
                    }),
                    currentScore: 85,
                    atRiskContributor: { login: 'nexus_subject', impact: 'Core architect' },
                    compoundingCostRatio: 9
                  }
                }));
                setTimeout(() => document.getElementById('prognosis-anchor')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[9px] font-black text-white/40 tracking-[0.2em] hover:text-white transition-all"
            >
              FORCE_SIM
            </button>

            <button onClick={startScan} disabled={!repoUrl.trim() || scanning}
              className="px-5 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/10">
              {scanning ? 'Scanning...' : 'New Scan'}
            </button>
          </div>
        </div>
      )}

      {/* ===== ACTIVE SCAN ===== */}
      {(scanning || scanComplete) && (
        <div className="relative">
          {(xrayPhase === 'sweep_1' || xrayPhase === 'sweep_2') && (
            <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden"><div className="scan-line w-full h-24 absolute" /></div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Act title */}
            <AnimatePresence mode="wait">
              <motion.div key={currentAct} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="text-center py-2">
                <span className="text-xs font-mono text-cyan-500/60 tracking-[0.3em] uppercase">{ACT_LABELS[currentAct]}</span>
              </motion.div>
            </AnimatePresence>

            {/* EKG */}
            <EKGMonitor bpm={ekgState.bpm} pattern={ekgState.pattern} reason={ekgState.reason} />

            {/* LIVE PROGNOSIS HERO */}
            <div id="prognosis-simulation" className="space-y-4">
              {scanData.prognosis ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-1 rounded-3xl border border-cyan-500/20 bg-cyan-500/5">
                  <div className="text-[10px] font-mono text-cyan-500/40 py-2 text-center tracking-[0.3em] uppercase">Simulation Layer Active</div>
                  <PrognosisSimulator data={scanData.prognosis} currentScore={scanData.corpusScore?.dxScore} />
                </motion.div>
              ) : (
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-1/3 h-full bg-cyan-500/20" />
                </div>
              )}
            </div>

            {/* X-Ray */}
            {currentAct >= 2 && (
              <XRayVisualization phase={xrayPhase} patient={scanData.patient} tracks={scanData.tracks} deadCode={scanData.deadCode} />
            )}

            {/* Patient File */}
            {scanData.patient && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6 xray-glow">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-500 tracking-[0.3em] uppercase">Patient File</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                  <div><div className="text-[11px] text-cyan-800/50 font-mono uppercase tracking-wider">Patient</div><div className="text-lg font-bold text-cyan-100 mt-1">{scanData.patient.name}</div></div>
                  <div><div className="text-[11px] text-cyan-800/50 font-mono uppercase tracking-wider">Date of Birth</div><div className="text-lg font-bold text-cyan-100 mt-1">{new Date(scanData.patient.dateOfBirth).toLocaleDateString()}</div></div>
                  <div><div className="text-[11px] text-cyan-800/50 font-mono uppercase tracking-wider">Admitted</div><div className="text-lg font-bold text-cyan-100 mt-1">{new Date(scanData.patient.admissionTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
                  <div><div className="text-[11px] text-cyan-800/50 font-mono uppercase tracking-wider">Language</div><div className="text-lg font-bold text-cyan-100 mt-1">{scanData.patient.language || 'Unknown'}</div></div>
                  <div><div className="text-[11px] text-cyan-800/50 font-mono uppercase tracking-wider">Family</div><div className="text-lg font-bold text-cyan-100 mt-1">{scanData.patient.familyMembers || 0} members</div></div>
                </div>
              </motion.div>
            )}

            {/* 8 Diagnostic Stations */}
            {Object.keys(scanData.tracks).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(TRACK_NAMES).map(([key, track]) => (
                  <TrackStation key={key} trackKey={key} track={track} findings={scanData.tracks[key]} isActive={activeTrackTab === key} onClick={() => setActiveTrackTab(key === activeTrackTab ? null : key)} />
                ))}
              </div>
            )}

            {/* Expanded Track Detail */}
            <AnimatePresence>
              {activeTrackTab && scanData.tracks[activeTrackTab] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="glass-panel rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-cyan-500 uppercase tracking-widest">{TRACK_NAMES[activeTrackTab]?.anatomical}</span>
                        <span className="text-2xl font-black text-white tracking-tight">{TRACK_NAMES[activeTrackTab]?.name}</span>
                      </div>
                      <span className={`text-5xl font-black ${scanData.tracks[activeTrackTab].score >= 70 ? 'text-emerald-400' : scanData.tracks[activeTrackTab].score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{scanData.tracks[activeTrackTab].score}</span>
                    </div>
                    {activeTrackTab === 'F' && scanData.tracks['F']?.rageCommits?.length > 0 && <div className="mb-4"><RageCommits rageCommits={scanData.tracks['F'].rageCommits} /></div>}
                    <div className="space-y-3">
                      {scanData.tracks[activeTrackTab].issues?.map((issue, i) => (
                        <div key={i} className={`p-5 rounded-2xl border ${issue.severity === 'critical' ? 'bg-red-500/5 border-red-500/10' : issue.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/10' : issue.severity === 'good' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-cyan-500/5 border-cyan-500/10'}`}>
                          <div className={`text-base font-black uppercase tracking-tight ${issue.severity === 'critical' ? 'text-red-300' : issue.severity === 'warning' ? 'text-amber-300' : issue.severity === 'good' ? 'text-emerald-300' : 'text-cyan-300'}`}>{issue.message}</div>
                          {issue.detail && <div className="text-sm text-cyan-100/40 mt-2 leading-relaxed font-medium">{issue.detail}</div>}
                        </div>
                      ))}
                      {(!scanData.tracks[activeTrackTab].issues || scanData.tracks[activeTrackTab].issues.length === 0) && <div className="text-base text-cyan-800/40 text-center py-6">No issues detected</div>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DX Score */}
            {scanData.corpusScore && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-3xl p-12 text-center xray-glow">
                <div className="text-xs font-mono text-cyan-600/50 tracking-[0.3em] uppercase mb-4">Total DX Score</div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className={`text-[120px] font-black leading-none ${scanData.corpusScore.dxScore >= 70 ? 'text-emerald-400' : scanData.corpusScore.dxScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{scanData.corpusScore.dxScore}</motion.div>
                <div className="text-xl text-cyan-600/60 mt-4 font-bold uppercase tracking-widest">{scanData.corpusScore.severity}</div>
                <div className="flex justify-center gap-8 mt-5 text-xs font-mono">
                  <span className="text-red-400">{scanData.corpusScore.criticalIssues} critical</span>
                  <span className="text-amber-400">{scanData.corpusScore.warningIssues} warnings</span>
                  <span className="text-emerald-400">{scanData.corpusScore.goodFindings} good</span>
                </div>
              </motion.div>
            )}

            {/* Prescription Pad */}
            {Object.keys(scanData.tracks).length >= 3 && <PrescriptionPad tracks={scanData.tracks} />}

            {/* Debt Inheritance Map */}
            {scanData.debtMap && <DebtInheritanceMap data={scanData.debtMap} />}

            {/* The Blame Map — Temporal Guilt Diffusion Engine */}
            {scanData.debtMap?.contributors?.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <BlameMap data={scanData.debtMap} />
              </motion.div>
            )}

            {/* Dead Code Coroner */}
            {scanData.deadCode && <DeadCodeCoroner data={scanData.deadCode} />}

            {/* Ghost — rises from X-ray table */}
            {currentAct >= 4 && scanData.diagnosis && (
              <motion.div initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.8, ease: 'easeOut' }}>
                <GhostNarrator diagnosis={scanData.diagnosis} />
              </motion.div>
            )}

            {/* Fracture Replay */}
            {scanData.debtMap?.debtTimeline && scanData.debtMap.debtTimeline.length > 0 && <FractureReplay timeline={scanData.debtMap.debtTimeline} tracks={scanData.tracks} />}

            {/* ===== V2 EXTENDED DIAGNOSTICS ===== */}
            {scanData.collaboration && <CollaborationPulse data={scanData.collaboration} />}
            {scanData.trauma && <TraumaTimeline data={scanData.trauma} />}
            {scanData.immune && <ImmuneSystem data={scanData.immune} />}
            {scanData.archaeology && <ArchaeologyLayer data={scanData.archaeology} />}
            {scanData.whispers && <WhisperNetwork data={scanData.whispers} />}
            {scanData.clones && <CloneDetectorDNA data={scanData.clones} />}
            {scanData.sleepStudy && <SleepStudy data={scanData.sleepStudy} />}

            {scanData.scarTissue && <ScarTissue data={scanData.scarTissue} />}

            {/* ===== NEW FEATURE PANELS ===== */}
            {scanData.timeBomb?.triggered && <TimeBombAlert data={scanData.timeBomb} />}
            {scanData.busFactor?.triggered && <BusFactorObituary data={scanData.busFactor} />}
            {scanData.emotionalTimeline?.events?.length > 0 && <EmotionalTimeline data={scanData.emotionalTimeline} />}
            {scanData.firstDaySim?.steps?.length > 0 && <FirstDaySim data={scanData.firstDaySim} />}
            {scanData.competitorBenchmark?.benchmarks?.length > 0 && <CompetitorBenchmark data={scanData.competitorBenchmark} />}

            {/* Second Opinion — appears after diagnosis */}
            {scanData.diagnosis && scanData.corpusScore && (
              <SecondOpinion diagnosis={scanData.diagnosis} corpusScore={scanData.corpusScore} />
            )}

            {/* Living Autopsy — if triggered */}
            <div ref={autopsyRef}>
              {scanData.livingAutopsy?.triggered && <LivingAutopsy data={scanData.livingAutopsy} />}
            </div>

            {/* Codebase Obituary — if detected */}
            <div ref={obituaryRef}>
              {scanData.obituary?.isAbandoned && <CodebaseObituary data={scanData.obituary} />}
            </div>

            {/* ╔══════════════════════════════════════╗
                ║ Act V — The Confessional             ║
                ║ Appears after scan completes.        ║
                ╚══════════════════════════════════════╝ */}
            {showConfessional && !confessionProcessed && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Confessional
                  onConfess={handleConfess}
                  healing={confessionProcessed}
                  corpusScore={scanData.corpusScore}
                  repoName={scanData.patient?.name}
                />
              </motion.div>
            )}

            {/* Show Results button */}
            {scanComplete && scanData.discharge && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center py-8">
                <button
                  onClick={() => window.open(`/discharge/${scanData.scanId}`, '_blank')}
                  className="group relative px-12 py-5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-2xl text-lg font-bold tracking-wider uppercase transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.97]"
                >
                  <span className="flex items-center gap-3">
                    View Full Results
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </span>
                </button>
                <p className="text-[10px] text-cyan-800/30 font-mono mt-3 tracking-wider">Opens in a new tab — full discharge summary with all 16 diagnostics</p>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
