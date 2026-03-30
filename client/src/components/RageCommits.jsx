import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNight(dateStr) {
  if (!dateStr) return 'an unknown night';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function hourLabel(h) {
  if (h === 0) return 'midnight';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function severityGrade(ev) {
  if (ev.severity === 'extreme') return { label: 'EXTREME', bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', flame: '🔥🔥🔥' };
  if (ev.severity === 'high') return { label: 'HIGH', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', flame: '🔥🔥' };
  if (ev.severity === 'desperate') return { label: 'DESPERATE', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', flame: '😔' };
  return { label: 'MODERATE', bg: 'bg-amber-500/8', border: 'border-amber-500/15', text: 'text-amber-400', flame: '🔥' };
}

// Group rage commits by calendar date so we can tell their story per night
function groupByNight(rageCommits) {
  const nights = {};
  rageCommits.forEach(r => {
    const day = r.date ? new Date(r.date).toISOString().slice(0, 10) : 'unknown';
    if (!nights[day]) nights[day] = { date: r.date, day, commits: [] };
    nights[day].commits.push(r);
  });
  return Object.values(nights).sort((a, b) => {
    const av = rageCommits.filter(r => r.date?.startsWith(a.day)).reduce((s, r) => s + (r.severity === 'extreme' ? 3 : r.severity === 'high' ? 2 : 1), 0);
    const bv = rageCommits.filter(r => r.date?.startsWith(b.day)).reduce((s, r) => s + (r.severity === 'extreme' ? 3 : r.severity === 'high' ? 2 : 1), 0);
    return bv - av; // worst night first
  });
}

// Build the human-readable "story" headline for a night
function nightHeadline(night) {
  const { commits } = night;
  const authors = [...new Set(commits.map(c => c.author))];
  const lateNight = commits.filter(c => c.isLateNight);
  const burst = commits.filter(c => c.burstCommits > 3);
  const worst = commits.find(c => c.severity === 'extreme') || commits.find(c => c.severity === 'high') || commits[0];
  const dateLabel = formatNight(night.date);

  let who = authors.length === 1 ? authors[0] : `${authors[0]} and ${authors.length - 1} other${authors.length > 2 ? 's' : ''}`;

  if (lateNight.length > 0 && burst.length > 0) {
    return `${who} was having a very bad night on ${dateLabel}.`;
  } else if (lateNight.length > 0) {
    return `Someone was having a very bad night on ${dateLabel}.`;
  } else if (burst.length > 0) {
    return `${who} made ${commits.length} commits in a fury on ${dateLabel}.`;
  }
  return `Frustration surfaced on ${dateLabel}.`;
}

// ─── Animated flame counter ─────────────────────────────────────────────────
function FlameCounter({ count }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayed(Math.round(progress * count));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [count]);
  return <>{displayed}</>;
}

// ─── Single commit card ──────────────────────────────────────────────────────
function CommitCard({ r, i }) {
  const grade = severityGrade(r);
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * i, duration: 0.35 }}
      className={`relative rounded-xl border px-4 py-3 ${grade.bg} ${grade.border}`}
    >
      {/* Severity badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${grade.bg} ${grade.text} border ${grade.border}`}>
            {grade.label}
          </span>
          <span className="text-[9px] font-mono text-cyan-700/50">{r.author}</span>
        </div>
        <span className="text-[10px] text-cyan-400/60 font-mono">
          {r.isLateNight ? `${hourLabel(r.hour)} 🌙` : hourLabel(r.hour)}
        </span>
      </div>

      {/* The commit message — the star of the show */}
      <p className="text-xs font-mono text-white/80 leading-relaxed">
        &ldquo;{r.message}&rdquo;
      </p>

      {/* Burst indicator */}
      {r.burstCommits > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[8px] text-amber-500/50 font-mono">
            +{r.burstCommits} rapid-fire commits in the same hour
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Night block ─────────────────────────────────────────────────────────────
function NightBlock({ night, index, isOpen, onToggle }) {
  const { commits } = night;
  const worst = commits.find(c => c.severity === 'extreme') || commits.find(c => c.severity === 'high') || commits[0];
  const grade = severityGrade(worst);
  const headline = nightHeadline(night);
  const bursts = commits.filter(c => c.burstCommits > 2).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      className={`rounded-2xl border overflow-hidden ${grade.border} ${grade.bg}`}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3 group"
      >
        {/* Flame emoji cluster */}
        <span className="text-xl mt-0.5 leading-none select-none" aria-hidden>
          {grade.flame}
        </span>

        <div className="flex-1 min-w-0">
          {/* The story headline */}
          <p className="text-sm font-bold text-white leading-snug">{headline}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            <span className="text-[9px] font-mono text-cyan-700/50">
              {commits.length} rage commit{commits.length > 1 ? 's' : ''}
            </span>
            {bursts > 0 && (
              <span className="text-[9px] font-mono text-orange-400/60">
                {bursts} burst{bursts > 1 ? 's' : ''} detected
              </span>
            )}
            {commits.filter(c => c.isLateNight).length > 0 && (
              <span className="text-[9px] font-mono text-purple-400/50">
                🌙 late-night session
              </span>
            )}
          </div>
        </div>

        {/* Toggle chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-cyan-700/40 text-xs mt-1 shrink-0"
        >
          ▾
        </motion.span>
      </button>

      {/* Expandable commit list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2.5 border-t border-white/5 pt-3">
              {commits.map((r, i) => (
                <CommitCard key={i} r={r} i={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RageCommits({ rageCommits }) {
  const [openIndex, setOpenIndex] = useState(0); // worst night open by default
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (!rageCommits || rageCommits.length === 0) return null;

  const nights = groupByNight(rageCommits);
  const totalNights = nights.length;
  const worstNight = nights[0];
  const worstGrade = severityGrade(
    worstNight.commits.find(c => c.severity === 'extreme') ||
    worstNight.commits.find(c => c.severity === 'high') ||
    worstNight.commits[0]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-panel rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(20,6,6,0.98) 0%, rgba(10,4,18,0.98) 100%)',
        boxShadow: '0 0 60px rgba(239,68,68,0.03), inset 0 0 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Animated flame icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              🔥
            </motion.span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white font-technical tracking-tighter uppercase leading-none">Human_Signal_Detector</h3>
              <span className="text-[8px] font-technical font-bold uppercase tracking-[0.4em] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                Active_Trace
              </span>
            </div>
            <p className="text-[9px] text-cyan-400/70 font-technical tracking-[0.5em] uppercase font-bold mt-1.5">
              Sentiment_Velocity_Projection // Forensic_Log
            </p>
          </div>

          {/* Big stat */}
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold font-technical text-white tracking-tighter holographic-bloom">
              {revealed ? <FlameCounter count={rageCommits.length} /> : '--'}
            </div>
            <div className="text-[8px] text-red-500/40 font-technical uppercase tracking-[0.3em] font-bold">
              SIGNAL_COUNT
            </div>
          </div>
        </div>

        {/* Empathy line — sets the tone */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-xs text-cyan-600/50 font-mono italic leading-relaxed"
        >
          Every engineer has made these commits. This isn't judgment — it's recognition.
          The flame is a badge, not a scarlet letter.
        </motion.p>
      </div>

      {/* ── Night blocks ────────────────────────────────────────────────── */}
      <div className="p-5 space-y-3">
        {nights.map((night, i) => (
          <NightBlock
            key={night.day}
            night={night}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>

      {/* ── Footer stat bar ─────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <div>
          <div className="text-lg font-black text-orange-400/80">
            {totalNights}
          </div>
          <div className="text-[8px] text-cyan-400/60 font-mono uppercase tracking-wider">
            bad night{totalNights > 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-lg font-black text-red-400/70">
            {rageCommits.filter(r => r.isLateNight).length}
          </div>
          <div className="text-[8px] text-cyan-400/60 font-mono uppercase tracking-wider">
            after midnight
          </div>
        </div>
        <div>
          <div className="text-lg font-black text-purple-400/70">
            {rageCommits.filter(r => r.burstCommits > 2).length}
          </div>
          <div className="text-[8px] text-cyan-400/60 font-mono uppercase tracking-wider">
            burst sessions
          </div>
        </div>
      </div>
    </motion.div>
  );
}
