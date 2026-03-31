import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { soundEngine } from './SoundLayer';

// ─── context keywords that trigger fracture healing ────────────────────────
const FRACTURE_KEYWORDS = [
  { token: 'deadline_pressure', keywords: ['deadline', 'rushed', 'pressure', 'crunch', 'ship date', '3 days', 'two weeks', 'overnight'], label: 'CI instability explained by deadline pressure' },
  { token: 'team_turnover', keywords: ['left', 'quit', 'departed', 'resigned', 'fired', 'moved on', 'cto quit', 'founder left'], label: 'Documentation gaps explained by team transitions' },
  { token: 'legacy_inheritance', keywords: ['legacy', 'inherited', 'previous team', 'old code', 'before us', "wasn't us"], label: 'Technical debt is inherited, not created' },
  { token: 'experimental', keywords: ['experiment', 'prototype', 'poc', 'proof of concept', 'spike', 'mvp'], label: 'Dead code was exploratory work, not neglect' },
  { token: 'resource_constraints', keywords: ['understaffed', 'overworked', 'no time', 'short staffed', 'just two of us', 'solo', 'alone'], label: 'Coverage gaps due to resource constraints' },
  { token: 'existential_pressure', keywords: ['company dies', 'shut down', 'or else', 'everything rides', 'survive', 'make or break'], label: 'Architectural shortcuts justified under existential pressure' },
  { token: 'security_aware', keywords: ['security', 'vulnerability', 'cve', 'mitigation', 'accepted risk'], label: 'Team is aware of vulnerabilities with a mitigation plan' },
  { token: 'scope_creep', keywords: ['scope', 'requirements changed', 'feature creep', 'pivot', 'changed direction'], label: 'Architectural debt is the result of shifting requirements' },
];

// ─── Typing effect for the Certificate narrative ───────────────────────────
function TypedText({ text, speed = 28, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    if (!text) return;
    idx.current = 0;
    setDisplayed('');
    const iv = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(iv);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

// ─── Ghost developer silhouette that fades away ─────────────────────────────
function GhostFigure({ phase }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ top: '8%', right: '6%', zIndex: 0 }}
      initial={{ opacity: 0.18 }}
      animate={{
        opacity: phase === 'healing' ? [0.18, 0.08, 0] : phase === 'absolved' ? 0 : 0.18,
        scale: phase === 'healing' ? [1, 1.05, 0.9] : 1,
        y: phase === 'healing' ? [0, -8, -20] : 0,
      }}
      transition={{ duration: phase === 'healing' ? 2.5 : 0.8, ease: 'easeInOut' }}
    >
      <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
        {/* Ghost silhouette — developer hunched over keyboard */}
        <ellipse cx="40" cy="30" rx="18" ry="20" fill="rgba(0,229,255,0.15)" />
        <path d="M22 50 Q20 90 18 110 L62 110 Q60 90 58 50 Q50 45 40 45 Q30 45 22 50Z" fill="rgba(0,229,255,0.08)" />
        {/* Arms at keyboard */}
        <path d="M22 65 Q12 70 10 80" stroke="rgba(0,229,255,0.15)" strokeWidth="4" strokeLinecap="round" />
        <path d="M58 65 Q68 70 70 80" stroke="rgba(0,229,255,0.15)" strokeWidth="4" strokeLinecap="round" />
        {/* Ghost glow */}
        <ellipse cx="40" cy="65" rx="30" ry="45" fill="url(#ghostGlow)" />
        <defs>
          <radialGradient id="ghostGlow">
            <stop offset="0%" stopColor="rgba(0,229,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// ─── Sealing fracture line particle ───────────────────────────────────────
function FractureSeal({ i, total }) {
  const y = 15 + Math.random() * 70;
  const w = 50 + Math.random() * 70;
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: [0, 1, 0.8, 0] }}
      transition={{ duration: 1.0, delay: i * 0.15, ease: 'easeOut' }}
      className="absolute h-px pointer-events-none"
      style={{
        top: `${y}%`, left: `${5 + Math.random() * 65}%`,
        width: `${w}px`,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), rgba(16,185,129,0.7), transparent)',
        boxShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 24px rgba(16,185,129,0.6)',
        transformOrigin: 'left',
      }}
    />
  );
}

// ─── Animated DX score counter — HERO SIZE ─────────────────────────────────
function AnimatedScore({ from, to }) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    const step = (to - from) / 40;
    let cur = from;
    const iv = setInterval(() => {
      cur = Math.min(to, cur + step);
      setVal(Math.round(cur));
      if (Math.round(cur) >= to) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [from, to]);
  return <>{val}</>;
}

// ─── Certificate print view ────────────────────────────────────────────────
function CertificateView({ tokens, scoreBoost, dxBase, narrative, repoName }) {
  return (
    <div id="certificate-print" style={{
      fontFamily: 'Georgia, serif',
      background: 'linear-gradient(160deg, #0a0600 0%, #060414 100%)',
      color: '#fff',
      padding: '48px',
      borderRadius: '16px',
      border: '1.5px solid rgba(245,158,11,0.3)',
      maxWidth: '640px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.4em', color: 'rgba(245,158,11,0.6)', marginBottom: '12px', fontFamily: 'monospace' }}>
          DX-RAY TEMPORAL ABSOLUTION ENGINE
        </div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'rgba(255,236,180,0.95)', letterSpacing: '0.05em' }}>
          Certificate of Context
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(245,158,11,0.5)', marginTop: '8px', fontFamily: 'monospace' }}>
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)', margin: '16px 0 28px' }} />

      {/* Repo */}
      {repoName && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(245,158,11,0.4)', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: '4px' }}>REPOSITORY UNDER EXAMINATION</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>{repoName}</div>
        </div>
      )}

      {/* Narrative */}
      <div style={{
        fontSize: '18px', lineHeight: '1.7', color: 'rgba(255,236,180,0.9)',
        fontStyle: 'italic', textAlign: 'center', margin: '24px 0 32px', padding: '0 16px',
      }}>
        {narrative}
      </div>

      {/* Score */}
      {scoreBoost > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(16,185,129,0.5)', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: '8px' }}>DX SCORE REVISED</div>
          <div style={{ fontSize: '48px', fontWeight: 'black', color: 'rgba(52,211,153,0.9)', fontFamily: 'monospace' }}>
            {Math.min(100, dxBase + scoreBoost)}
            <span style={{ fontSize: '18px', color: 'rgba(16,185,129,0.5)', marginLeft: '8px' }}>+{scoreBoost}</span>
          </div>
        </div>
      )}

      {/* Context tokens */}
      {tokens.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', color: 'rgba(16,185,129,0.5)', letterSpacing: '0.2em', fontFamily: 'monospace', marginBottom: '12px', textAlign: 'center' }}>
            CONTEXT FACTORS ACCEPTED
          </div>
          {tokens.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(52,211,153,0.6)', marginTop: '6px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: 'rgba(52,211,153,0.8)', lineHeight: '1.5' }}>{t.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)', margin: '16px 0' }} />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(245,158,11,0.5)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
          Every scan deserves the full story.
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(100,80,40,0.5)', fontFamily: 'monospace', marginTop: '4px' }}>
          This one got it. · DX-Ray Scanner · temporal-absolution-engine
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function Confessional({ onConfess, onSkip, healing, corpusScore, repoName }) {
  const [confession, setConfession] = useState('');
  const [phase, setPhase] = useState('idle');    // idle → healing → absolved
  const [detectedTokens, setDetectedTokens] = useState([]);
  const [visibleTokens, setVisibleTokens] = useState([]);
  const [healProgress, setHealProgress] = useState(0);
  const [certificate, setCertificate] = useState('');
  const [certificateDone, setCertificateDone] = useState(false);
  const [scoreBoost, setScoreBoost] = useState(0);
  const [showCertPrint, setShowCertPrint] = useState(false);
  const controls = useAnimation();
  const textareaRef = useRef(null);

  const dxBase = corpusScore?.dxScore || 50;

  // Demo suggestion — the exact scenario from the brief
  const suggestions = [
    'We had 3 days, our CTO quit, and we were told to ship or the company dies',
    'We were rushed due to a hard deadline — sleep didn\'t exist that sprint',
    'The previous team left without documentation or handoff',
    'This was a prototype that became production overnight',
    'We were understaffed and overworked during this entire period',
  ];

  const buildCertificateNarrative = (tokens) => {
    if (tokens.length === 0) {
      return 'Confession noted. The act of providing context — even without specific keyword matches — changes the interpretation of this scan. Every codebase has a story. This one was told.';
    }
    if (tokens.some(t => t.token === 'existential_pressure') && tokens.some(t => t.token === 'team_turnover')) {
      return `Context received. The team operated under existential pressure while losing key personnel. The fractures in this scan are not the result of negligence — they are the marks of people who kept building when everything else was falling apart. The X-ray has reinterpreted its findings. The context changes everything.`;
    }
    if (tokens.some(t => t.token === 'existential_pressure') && tokens.some(t => t.token === 'deadline_pressure')) {
      return `Context received. The deadline was not arbitrary — survival was the metric. The CI instability, the missing tests, the shortcuts: these are not failures of engineering. They are the price of still being here. The X-ray has adjusted its interpretation accordingly.`;
    }
    const labels = tokens.map(t => t.label.split(' — ')[0].toLowerCase());
    return `Context received. ${tokens.length} factor${tokens.length > 1 ? 's' : ''} identified: ${labels.join('; ')}. The X-ray reinterprets its findings with this human context. Every scan deserves the full story. This one got it.`;
  };

  const handleSubmit = () => {
    if (!confession.trim()) return;
    setPhase('healing');

    const c = confession.toLowerCase();
    const found = FRACTURE_KEYWORDS.filter(fk => fk.keywords.some(kw => c.includes(kw)));
    setDetectedTokens(found);
    setScoreBoost(Math.min(18, found.length * 5 + (found.length === 0 ? 3 : 0)));

    // Sound: healing riser immediately
    soundEngine.init();
    soundEngine.healingRiser();

    // Animate fracture seals in sequence
    found.forEach((_, i) => {
      setTimeout(() => {
        setVisibleTokens(prev => [...prev, i]);
        setHealProgress(Math.round(((i + 1) / Math.max(found.length, 1)) * 80 + 10));
      }, 400 + i * 500);
    });

    // After all seals — send to server, complete progress
    const delay = Math.max(1200, 400 + found.length * 500 + 600);
    setTimeout(() => {
      setHealProgress(100);
      onConfess(confession.trim());
    }, delay);

    // Certificate appears after healing
    setTimeout(() => {
      setCertificate(buildCertificateNarrative(found));
      setPhase('absolved');
    }, delay + 800);
  };

  // When server healing response arrives
  useEffect(() => {
    if (healing && phase === 'absolved') {
      controls.start({ scale: [1, 1.02, 1], transition: { duration: 0.6 } });
    }
  }, [healing]);

  const handleDownloadCertificate = () => {
    setShowCertPrint(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowCertPrint(false), 1000);
    }, 300);
  };

  // ── PHASE: HEALING ─────────────────────────────────────────────────────
  if (phase === 'healing') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(0,8,4,0.97) 0%, rgba(0,14,10,0.95) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          boxShadow: '0 0 60px rgba(16,185,129,0.08), 0 0 120px rgba(16,185,129,0.04)',
        }}
      >
        {/* Ghost fading away */}
        <GhostFigure phase="healing" />

        {/* White light sweep — fractures sealing */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.2 }}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(16,185,129,0.18) 50%, rgba(255,255,255,0.12) 60%, transparent 100%)',
            width: '60%',
          }}
        />
        {/* Second sweep */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2.4, ease: 'easeInOut', delay: 1.2 }}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.08) 50%, transparent 100%)',
            width: '80%',
          }}
        />
        {/* Third sweep — finale */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, ease: 'easeIn', delay: 2.8 }}
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
            width: '100%',
          }}
        />

        {/* Fracture seal particles */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <FractureSeal key={i} i={i} total={12} />
          ))}
        </div>

        <div className="relative z-30 p-8 sm:p-12 text-center">
          {/* Pulsing heal orb */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-emerald-400/20"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1 + i * 0.5, opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
              />
            ))}
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"
              animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 40px rgba(16,185,129,0.3)', '0 0 0px rgba(16,185,129,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </motion.div>
            </motion.div>
          </div>

          <h3 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">The X-ray is healing.</h3>
          <p className="text-emerald-400/60 text-lg font-mono mb-8">Fractures sealing. Human context rewriting the record.</p>

          {/* HERO DX score climb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            <div className="text-[9px] font-mono text-emerald-500/50 tracking-widest uppercase mb-1">DX Score</div>
            <div className="text-7xl sm:text-8xl font-black"
              style={{ color: 'rgba(52,211,153,0.9)', textShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
              <AnimatedScore from={dxBase} to={Math.min(100, dxBase + Math.min(18, detectedTokens.length * 5 + 3))} />
            </div>
            <div className="text-emerald-400/40 text-sm font-mono mt-1">
              ↑ +{Math.min(18, detectedTokens.length * 5 + 3)} context adjustment
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="max-w-sm mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-emerald-500/50 tracking-widest uppercase">Healing Progress</span>
              <span className="text-[9px] font-mono text-emerald-400/70">{healProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${healProgress}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{
                  background: 'linear-gradient(90deg, #059669, #34d399)',
                  boxShadow: '0 0 16px rgba(16,185,129,0.5)',
                }}
              />
            </div>
          </div>

          {/* Fracture checklist */}
          <div className="max-w-md mx-auto space-y-2 text-left">
            {detectedTokens.map((token, i) => (
              <AnimatePresence key={i}>
                {visibleTokens.includes(i) && (
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                    <span className="text-xs text-emerald-300/70 leading-relaxed">{token.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
            {detectedTokens.length === 0 && (
              <p className="text-xs text-cyan-400/60 font-mono text-center py-2">
                Confession noted — context changes the interpretation.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── PHASE: ABSOLVED — Certificate + score + download ───────────────────
  if (phase === 'absolved') {
    return (
      <motion.div animate={controls}>
        {/* Print-only Certificate view */}
        {showCertPrint && (
          <div className="print-only fixed inset-0 bg-black z-[9999] p-8 hidden print:block">
            <CertificateView
              tokens={detectedTokens}
              scoreBoost={scoreBoost}
              dxBase={dxBase}
              narrative={certificate}
              repoName={repoName}
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(10,6,0,0.97) 0%, rgba(0,10,6,0.95) 50%, rgba(6,4,14,0.97) 100%)',
            border: '1px solid rgba(245,158,11,0.15)',
            boxShadow: '0 0 80px rgba(245,158,11,0.06), 0 0 40px rgba(16,185,129,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Ghost is gone */}
          <GhostFigure phase="absolved" />

          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />

          {/* Lingering fracture seals */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ delay: i * 0.2, duration: 3 }}
                className="absolute h-px"
                style={{
                  top: `${10 + i * 14}%`,
                  left: `${5 + Math.random() * 70}%`,
                  width: `${40 + Math.random() * 50}px`,
                  background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent)',
                  boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                }}
              />
            ))}
          </div>

          <div className="relative z-10 p-8 sm:p-12 text-center">
            {/* Seal icon */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <div className="text-[9px] font-mono tracking-[0.4em] uppercase mb-5"
                style={{ color: 'rgba(245,158,11,0.5)' }}>
                Certificate of Context — Issued
              </div>
            </motion.div>

            {/* HERO DX score final climb */}
            {scoreBoost > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 250 }}
                className="mb-8"
              >
                <div className="text-[9px] font-mono text-emerald-500/50 tracking-widest uppercase mb-2">DX Score — Context Adjusted</div>
                <div className="text-8xl sm:text-9xl font-black"
                  style={{
                    color: 'rgba(52,211,153,0.95)',
                    textShadow: '0 0 60px rgba(16,185,129,0.5), 0 0 120px rgba(16,185,129,0.2)',
                  }}>
                  <AnimatedScore from={dxBase} to={Math.min(100, dxBase + scoreBoost)} />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-emerald-400/50 text-sm font-mono mt-2"
                >
                  +{scoreBoost} points · {detectedTokens.length} context factor{detectedTokens.length !== 1 ? 's' : ''} accepted
                </motion.div>
              </motion.div>
            )}

            {/* Certificate narrative — typed */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="max-w-3xl mx-auto mb-10"
            >
              <p className="text-xl sm:text-2xl font-bold leading-tight tracking-tight"
                style={{ color: 'rgba(255,236,180,0.95)', fontStyle: 'italic' }}>
                {certificate ? (
                  <TypedText text={certificate} speed={22} onDone={() => setCertificateDone(true)} />
                ) : null}
              </p>
            </motion.div>

            {/* ─── Download Certificate Button ─── */}
            <AnimatePresence>
              {certificateDone && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center gap-4 mb-6"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(245,158,11,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDownloadCertificate}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: 'rgba(245,158,11,0.9)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Certificate of Context
                  </motion.button>
                  <p className="text-[9px] font-mono" style={{ color: 'rgba(245,158,11,0.3)' }}>
                    Printable · PDF-ready · The only forgiveness document your codebase will ever receive
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Closing lines */}
            <AnimatePresence>
              {certificateDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="pt-6 border-t max-w-xs mx-auto"
                  style={{ borderColor: 'rgba(245,158,11,0.1)' }}
                >
                  <p className="text-sm font-mono" style={{ color: 'rgba(245,158,11,0.45)' }}>
                    Every scan deserves the full story.
                  </p>
                  <p className="text-xs font-mono mt-1" style={{ color: 'rgba(100,80,40,0.5)' }}>
                    This one got it.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Healed fracture summary */}
        {detectedTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {detectedTokens.map((token, i) => (
              <div key={i}
                className="flex items-start gap-2 px-4 py-2.5 rounded-xl text-xs"
                style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.10)' }}
              >
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-emerald-300/60 leading-relaxed">{token.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Print-only styles */}
        <style>{`
          @media print {
            body > * { display: none !important; }
            #certificate-print { display: block !important; }
            .print-only { display: block !important; }
          }
        `}</style>
      </motion.div>
    );
  }

  // ── PHASE: IDLE — the confession form ─────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(8,5,0,0.95) 0%, rgba(14,10,4,0.9) 100%)',
        border: '1px solid rgba(245,158,11,0.12)',
        boxShadow: '0 0 50px rgba(245,158,11,0.04)',
      }}
    >
      {/* Ghost figure — present at idle, fades on healing */}
      <GhostFigure phase="idle" />

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 60%)' }} />

      <div className="relative z-10 p-8 sm:p-10 text-center">
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </motion.div>

        <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tight">
          Would you like to confess?
        </h3>
        <p className="text-amber-200/40 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Provide context. The X-ray will physically heal on screen. Fractures will seal.
          The score will climb. A certificate will generate. <br />
          <span className="text-amber-400/60 font-bold">This is the only tool that forgives a codebase.</span>
        </p>

        <div className="max-w-lg mx-auto space-y-4">
          <textarea
            ref={textareaRef}
            value={confession}
            onChange={(e) => setConfession(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
            placeholder="We had 3 days, our CTO quit, and we were told to ship or the company dies..."
            rows={4}
            className="w-full bg-black/50 rounded-2xl p-5 text-base text-cyan-100 placeholder:text-amber-900/30 focus:outline-none resize-none font-mono leading-relaxed transition-all"
            style={{
              border: confession.trim() ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(245,158,11,0.10)',
              boxShadow: confession.trim() ? '0 0 20px rgba(245,158,11,0.06)' : 'none',
            }}
          />

          {/* Quick-fill suggestions */}
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setConfession(s); textareaRef.current?.focus(); }}
                className="text-[9px] font-mono text-amber-700/40 border border-amber-900/15 rounded-lg px-3 py-1.5 hover:border-amber-500/25 hover:text-amber-500/60 transition-all bg-black/20"
              >
                {s.length > 45 ? s.slice(0, 44) + '…' : s}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-3 justify-center pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!confession.trim()}
              className="px-10 py-5 rounded-2xl text-xl font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-2xl active:scale-[0.97] uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                boxShadow: confession.trim() ? '0 0 40px rgba(245,158,11,0.3), 0 12px 32px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              Confess &amp; Heal
            </motion.button>
            <button
              onClick={() => {
                if (onSkip) onSkip();
                else setPhase('idle');
              }}
              className="px-10 py-5 bg-transparent border border-cyan-500/20 text-cyan-500/60 rounded-2xl text-xl font-black hover:border-cyan-500/40 hover:text-cyan-400 transition-all uppercase tracking-wider"
            >
              Skip
            </button>
          </div>

          <p className="text-[9px] text-amber-900/25 font-mono tracking-widest">
            ⌘↵ to submit · context changes everything
          </p>
        </div>
      </div>
    </motion.div>
  );
}
