import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AIDoctor from '../components/AIDoctor';
import PrescriptionPad from '../components/PrescriptionPad';


import DischargeSummaryExport from '../components/DischargeSummaryExport';
// v2 components
import TraumaTimeline from '../components/TraumaTimeline';
import WhisperNetwork from '../components/WhisperNetwork';
import ScarTissue from '../components/ScarTissue';
import Confessional from '../components/Confessional';
import SecondOpinion from '../components/SecondOpinion';
import LivingAutopsy from '../components/LivingAutopsy';
import CodebaseObituary from '../components/CodebaseObituary';
import RageCommits from '../components/RageCommits';
import TimeBombAlert from '../components/TimeBombAlert';
import BusFactorObituary from '../components/BusFactorObituary';
import EmotionalTimeline from '../components/EmotionalTimeline';
import FirstDaySim from '../components/FirstDaySim';
import CompetitorBenchmark from '../components/CompetitorBenchmark';
import TheMirror from '../components/TheMirror';
import BiologicalShadow from '../components/BiologicalShadow';
import SoundLayer from '../components/SoundLayer';
import LastCommit from '../components/LastCommit';
import PrognosisSimulator from '../components/PrognosisSimulator';
import { config } from '../api-config';

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

export default function DischargeSummary() {
  const navigate = useNavigate();
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confessionProcessed, setConfessionProcessed] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [mirrorSpoken, setMirrorSpoken] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showMourning, setShowMourning] = useState(false);

  const forceMirror = () => {
    setScanData(prev => ({
      ...prev,
      mirror: {
        user: { login: 'nexus_subject', name: 'OVERRIDE PROTOCOL', avatar: 'https://github.com/github.png' },
        heartbeat: { hourDistribution: new Array(24).fill(2), peakHour: 14, type: 'Pragmatist', perceivedVsReal: 'SYSTEM DIAGNOSTIC: This is a forced reflection for UI verification.' },
        shadow: { gravity: 'High', description: 'Diagnostic test of the influence layer.' },
        fingerprint: { words: ['Diagnostic', 'Synthetic', 'Force'], description: 'System-generated stylistic mark.' },
        debtSignature: { role: 'The Protocol', description: 'Automated debt reconciliation active.' },
        burnout: { risk: 'Stable', description: 'System integrity holding.' }
      }
    }));
  };

  useEffect(() => {
    // Use localStorage so data persists when opened in a new tab
    const stored = localStorage.getItem('dxray_scan');
    if (stored) {
      try {
        setScanData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse scan data');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (scanData?.mirror && !mirrorSpoken) {
      const timer = setTimeout(() => {
        setIsRotating(true);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("We also scanned the person who submitted this repo.");
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('female')) || voices[0];
          if (preferred) utterance.voice = preferred;
          utterance.rate = 0.85; utterance.pitch = 1.05;
          window.speechSynthesis.speak(utterance);
        }
        setMirrorSpoken(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scanData?.mirror, mirrorSpoken]);

  const handleConfess = (confession) => {
    const c = confession.toLowerCase();
    const tokens = [];
    const fractures = [];
    const fractureMap = {
      deadline_pressure: { keywords: ['deadline', 'rushed', 'pressure', 'crunch'], heal: 'CI instability explained by deadline pressure' },
      team_turnover: { keywords: ['left', 'quit', 'departed', 'resigned'], heal: 'Documentation gaps explained by team transitions' },
      legacy_inheritance: { keywords: ['legacy', 'inherited', 'previous', 'old code'], heal: 'Technical debt is inherited, not created' },
      resource_constraints: { keywords: ['understaffed', 'overworked', 'no time'], heal: 'Coverage gaps due to resource constraints' },
      security_aware: { keywords: ['security', 'vulnerability', 'cve', 'mitigation'], heal: 'Team is aware of vulnerabilities' },
    };
    for (const [token, cfg] of Object.entries(fractureMap)) {
      if (cfg.keywords.some(kw => c.includes(kw))) {
        tokens.push(token);
        fractures.push(cfg.heal);
      }
    }
    const narrative = tokens.length > 0
      ? `Context received. ${tokens.length} factor(s) identified that reframe the scan findings. The X-ray adjusts its interpretation. Every scan deserves the full story. This one got it.`
      : 'Confession noted. The act of providing context changes the interpretation of this scan. Every codebase has a story. This one was told.';

    setConfessionProcessed({
      fractures,
      scoreBoost: Math.min(15, tokens.length * 5),
      contextTokens: tokens,
      certificate: { narrative, timestamp: new Date().toISOString() }
    });
  };

  const handleShare = async () => {
    if (!scanData) return;
    const [owner, repo] = scanData.patient?.name?.split('/') || ['unknown', 'repo'];
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/scans/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scanData.scanId, owner, repo, data: scanData })
      });
      const result = await res.json();
      const fullUrl = `${window.location.origin}/scan/${result.slug}`;
      setShareUrl(fullUrl);
      navigator.clipboard?.writeText(fullUrl);
    } catch (e) { console.error('Share failed:', e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass-panel rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Scan Data Found</h2>
          <p className="text-cyan-600/60 text-sm mb-6">Run a scan first to see results here.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl text-sm font-bold transition-all">
            Start New Scan
          </button>
        </div>
      </div>
    );
  }

  const { patient, tracks, debtMap, deadCode, corpusScore, diagnosis, discharge,
    collaboration, trauma, immune, archaeology, whispers, clones, sleepStudy, scarTissue, livingAutopsy, obituary,
    timeBomb, busFactor, emotionalTimeline, firstDaySim, competitorBenchmark, biologicalShadow, mirror, prognosis } = scanData;

  const rageCommits = tracks?.F?.rageCommits;
  const severityColor = corpusScore?.dxScore >= 70 ? 'text-emerald-400' : corpusScore?.dxScore >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-mono relative overflow-x-hidden selection:bg-cyan-500/30">
      <AnimatePresence>
        {showMourning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050505] overflow-hidden"
          >
            <SoundLayer mode="mourning" />
            <LastCommit
              mourningData={scanData?.mourning}
              onClose={() => setShowMourning(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SoundLayer isMirrorActive={isRotating} />

      {/* Sticky Header */}
      <header className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div
            onClick={forceMirror}
            className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-black tracking-tighter text-xl shadow-[0_0_20px_rgba(0,229,255,0.1)] cursor-pointer hover:border-cyan-400/40 transition-all flex-shrink-0"
            title="D-XRAY Clinical Instance"
          >
            DX
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-600/40 tracking-[0.2em] uppercase leading-none mb-1">Instance Secure</div>
            <div className="text-xs font-bold text-white/70 leading-none">Discharge Summary</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (!scanData?.mourning) {
                setScanData(prev => ({
                  ...prev,
                  mourning: {
                    triggered: true,
                    deceasedName: "Eternal Dev",
                    lastCommit: { message: "Initial commit of the heart.", date: new Date().toISOString(), sha: "abc1234" },
                    quote: "The code lives on."
                  }
                }));
              }
              setShowMourning(true);
            }}
            className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest border transition-all flex items-center gap-2 ${scanData?.mourning ? 'border-orange-500/50 text-orange-400 bg-orange-500/5' : 'border-white/10 text-white/30 hover:border-white/50'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${scanData?.mourning ? 'bg-orange-500 animate-pulse' : 'bg-white/20'}`} />
            MOURNING_MODE
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('biological-shadow-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            SHADOW_SCAN
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <button onClick={() => navigate('/')} className="text-[10px] font-mono text-cyan-700 hover:text-cyan-400 transition-colors uppercase tracking-widest hidden sm:block">New Scan</button>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </header>

      <motion.div
        animate={{
          rotateY: isRotating ? -15 : 0,
          scale: isRotating ? 0.92 : 1,
          filter: isRotating ? 'blur(4px) grayscale(0.5)' : 'blur(0px) grayscale(0)',
          opacity: isRotating ? 0.4 : 1
        }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
      >
        {/* Results header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="text-[10px] font-mono text-cyan-600/40 tracking-[0.3em] uppercase mb-2">Discharge Summary</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">{patient?.name || 'Unknown Patient'}</h2>
          <p className="text-cyan-800/50 text-xs font-mono mt-1">
            Admitted {patient?.admissionTime ? new Date(patient.admissionTime).toLocaleString() : 'Unknown'} &middot; Attending: DX-Ray Scanner v2.1
          </p>
        </motion.div>

        {/* DX Score — hero */}
        {corpusScore && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-3xl p-10 text-center xray-glow mb-8">
            <div className="text-xs font-mono text-cyan-600/50 tracking-[0.3em] uppercase mb-3">Final DX Score</div>
            <div className={`text-[120px] font-black leading-none ${severityColor}`}>{corpusScore.dxScore}</div>
            <div className="text-lg text-cyan-600/60 mt-2 font-medium">{corpusScore.severity}</div>
            <div className="flex justify-center gap-8 mt-4 text-sm font-mono">
              <span className="text-red-400">{corpusScore.criticalIssues} critical</span>
              <span className="text-amber-400">{corpusScore.warningIssues} warnings</span>
              <span className="text-emerald-400">{corpusScore.goodFindings} good</span>
            </div>
          </motion.div>
        )}

        {/* Codebase Obituary */}
        {obituary?.isAbandoned && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <CodebaseObituary data={obituary} />
          </motion.div>
        )}

        {/* Living Autopsy */}
        {livingAutopsy?.triggered && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <LivingAutopsy data={livingAutopsy} />
          </motion.div>
        )}

        {/* 8 Track Scores */}
        {corpusScore?.trackScores && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Diagnostic Findings</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {corpusScore.trackScores.map(t => {
                const tn = TRACK_NAMES[t.track];
                return (
                  <div key={t.track} className="p-4 rounded-xl bg-black/20 border border-cyan-900/10 text-center">
                    <div className="text-[8px] text-cyan-800/40 font-mono uppercase">{tn?.anatomical}</div>
                    <div className="text-xs font-bold text-cyan-200 mt-0.5">{tn?.name || t.name}</div>
                    <div className={`text-3xl font-black mt-2 ${t.score >= 70 ? 'text-emerald-400' : t.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{t.score}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Track detail findings */}
        {tracks && Object.keys(tracks).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Detailed Findings</h3>
            <div className="space-y-4">
              {Object.entries(tracks).map(([key, findings]) => {
                const tn = TRACK_NAMES[key];
                if (!findings.issues || findings.issues.length === 0) return null;
                return (
                  <div key={key} className="p-4 rounded-xl bg-black/20 border border-cyan-900/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-2xl font-black ${findings.score >= 70 ? 'text-emerald-400' : findings.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{findings.score}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{tn?.name}</div>
                        <div className="text-[9px] text-cyan-800/40 font-mono">{tn?.anatomical}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {findings.issues.slice(0, 3).map((issue, i) => (
                        <div key={i} className={`text-xs p-2 rounded-lg ${issue.severity === 'critical' ? 'bg-red-500/5 text-red-300/80' : issue.severity === 'warning' ? 'bg-amber-500/5 text-amber-300/80' : 'bg-cyan-500/5 text-cyan-300/80'}`}>
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* AI Doctor Diagnosis */}
        {diagnosis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <AIDoctor diagnosis={diagnosis} corpusScore={corpusScore} />
          </motion.div>
        )}

        {/* The Simulation — Forward Prognosis */}
        {prognosis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mt-8">
            <PrognosisSimulator data={prognosis} currentScore={corpusScore?.dxScore} />
          </motion.div>
        )}

        {/* Prescription */}
        {tracks && Object.keys(tracks).length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6">
            <PrescriptionPad tracks={tracks} />
          </motion.div>
        )}

        {/* V2 Extended Diagnostics */}
        {trauma && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6"><TraumaTimeline data={trauma} /></motion.div>}
        {whispers && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6"><WhisperNetwork data={whispers} /></motion.div>}
        {scarTissue && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6"><ScarTissue data={scarTissue} /></motion.div>}

        <div id="biological-shadow-section" className="mt-8">
          {biologicalShadow ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <BiologicalShadow data={biologicalShadow} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 border-white/5 text-center">
              <div className="text-emerald-500/40 text-[10px] font-mono uppercase tracking-widest mb-2">Biological Pulse: Stable</div>
              <p className="text-slate-500 text-xs">No significant circadian violations or exhaustion signatures detected in recent cycles.</p>
            </motion.div>
          )}
        </div>

        {/* Memorial Entry */}
        {scanData?.mourning && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass-panel p-8 border-orange-500/10 hover:border-orange-500/30 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="1"><path d="M12 2v20M5 12h14" strokeDasharray="4 4" /></svg>
            </div>
            <div className="relative z-10">
              <div className="text-orange-400/60 text-xs font-mono uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Eternal Echo Detected
              </div>
              <h3 className="text-xl text-white/90 font-light mb-4">A memorial has been identified in this codebase.</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-lg leading-relaxed">
                We found traces of a departed contributor. Their final act of creation still exists within these lines.
              </p>
              <button
                onClick={() => setShowMourning(true)}
                className="px-6 py-2 border border-orange-500/40 text-orange-400 text-sm rounded-full hover:bg-orange-500/10 transition-all flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M5 12h14" /></svg>
                Keep the Lights On
              </button>
            </div>
          </motion.div>
        )}

        {/* Rage Commits */}
        {rageCommits && rageCommits.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
            <RageCommits rageCommits={rageCommits} />
          </motion.div>
        )}

        {/* Second Opinion */}
        {diagnosis && corpusScore && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <SecondOpinion diagnosis={diagnosis} corpusScore={corpusScore} />
          </motion.div>
        )}

        {/* New Feature Panels */}
        {timeBomb?.triggered && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <TimeBombAlert data={timeBomb} />
          </motion.div>
        )}
        {busFactor?.triggered && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <BusFactorObituary data={busFactor} />
          </motion.div>
        )}
        {emotionalTimeline?.events?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <EmotionalTimeline data={emotionalTimeline} />
          </motion.div>
        )}
        {firstDaySim?.steps?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <FirstDaySim data={firstDaySim} />
          </motion.div>
        )}
        {competitorBenchmark?.benchmarks?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <CompetitorBenchmark data={competitorBenchmark} />
          </motion.div>
        )}

        {/* Confessional */}
        {!confessionProcessed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-6">
            <Confessional
              onConfess={handleConfess}
              corpusScore={corpusScore}
              repoName={patient?.name}
            />
          </motion.div>
        )}

        {confessionProcessed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-6">
            <div className="glass-panel rounded-2xl p-5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400/50 uppercase tracking-widest">Confession received</span>
              </div>
              {confessionProcessed.fractures?.slice(0, 2).map((f, i) => (
                <div key={i} className="text-xs text-emerald-300/60 mb-1 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400/40" />
                  {f}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share + Export + Print */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl p-6 text-center">
            <div className="text-[10px] font-mono text-cyan-500 tracking-[0.3em] uppercase mb-3">Share This Scan</div>
            {shareUrl ? (
              <div className="space-y-2">
                <input type="text" readOnly value={shareUrl} className="bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 w-full text-center" />
                <p className="text-[9px] text-emerald-400/60 font-mono">✓ Copied to clipboard</p>
              </div>
            ) : (
              <div className="space-y-2">
                {patient?.name && (
                  <div className="bg-black/30 border border-cyan-900/20 rounded-lg px-3 py-2 text-[9px] font-mono text-cyan-700/50 truncate">
                    /scan/{patient.name.replace('/', '-').toLowerCase()}
                  </div>
                )}
                <button onClick={handleShare} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-sm font-bold transition-all">
                  Generate Shareable Link
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 text-center">
            <div className="text-[10px] font-mono text-cyan-500 tracking-[0.3em] uppercase mb-3">Save as PDF</div>
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-black/40 border border-cyan-900/20 hover:border-cyan-700/30 text-cyan-400/70 hover:text-cyan-300 rounded-xl text-sm font-bold transition-all"
            >
              Print / Download PDF
            </button>
            <p className="text-[9px] text-cyan-900/30 font-mono mt-2">Use &ldquo;Save as PDF&rdquo; in the print dialog</p>
          </div>

          <DischargeSummaryExport discharge={discharge} tracks={tracks} corpusScore={corpusScore} confession={confessionProcessed} />
        </motion.div>

        {/* Back to scan */}
        <div className="text-center py-6">
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-transparent border border-cyan-900/20 text-cyan-600/50 rounded-xl text-sm font-bold hover:border-cyan-800/30 hover:text-cyan-500/60 transition-all">
            Scan Another Repository
          </button>
        </div>

        {/* Certificate of Context */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9 }}
          className="mt-8 mb-12"
        >
          <div
            className="rounded-3xl px-8 py-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(10,6,0,0.95) 0%, rgba(6,4,14,0.95) 100%)',
              border: '1px solid rgba(245,158,11,0.12)',
              boxShadow: '0 0 80px rgba(245,158,11,0.04), inset 0 1px 0 rgba(255,255,255,0.03)'
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-6"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>

              <div className="text-[9px] font-mono tracking-[0.4em] uppercase mb-6" style={{ color: 'rgba(245,158,11,0.5)' }}>
                Certificate of Context
              </div>

              <p className="text-2xl sm:text-3xl font-medium leading-relaxed max-w-2xl mx-auto"
                style={{ color: 'rgba(255,236,180,0.9)', fontStyle: 'italic' }}>
                {confessionProcessed?.certificate?.narrative
                  || diagnosis?.headline
                  || 'Every codebase has a story. This one was scanned, not judged.'}
              </p>

              <div className="mt-10 pt-6 border-t max-w-xs mx-auto" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
                <p className="text-sm font-mono" style={{ color: 'rgba(245,158,11,0.4)' }}>Every scan deserves the full story.</p>
                <p className="text-xs font-mono mt-1" style={{ color: 'rgba(100,80,40,0.5)' }}>This one got it.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* THE MIRROR */}
      {mirror && <TheMirror data={mirror} />}
    </div>
  );
}
