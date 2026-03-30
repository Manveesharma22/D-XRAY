import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRACK_BASE = {
  A: { color: '#60a5fa', glow: 'rgba(96,165,250,0.15)', borderCrit: 'border-red-500/30', bg: 'bg-blue-500/[0.03]' },
  B: { color: '#a78bfa', glow: 'rgba(167,139,250,0.15)', borderCrit: 'border-violet-500/30', bg: 'bg-violet-500/[0.03]' },
  C: { color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', borderCrit: 'border-amber-500/30', bg: 'bg-amber-500/[0.03]' },
  D: { color: '#34d399', glow: 'rgba(52,211,153,0.15)', borderCrit: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.03]' },
  E: { color: '#f87171', glow: 'rgba(248,113,113,0.15)', borderCrit: 'border-red-500/30', bg: 'bg-red-500/[0.03]' },
  F: { color: '#f472b6', glow: 'rgba(244,114,182,0.15)', borderCrit: 'border-pink-500/30', bg: 'bg-pink-500/[0.03]' },
  G: { color: '#00e5ff', glow: 'rgba(0,229,255,0.12)', borderCrit: 'border-cyan-500/30', bg: 'bg-cyan-500/[0.02]' },
  H: { color: '#fb923c', glow: 'rgba(251,146,60,0.15)', borderCrit: 'border-orange-500/30', bg: 'bg-orange-500/[0.03]' },
};

// Generate 2-3 plain-English findings from raw findings data
function buildFindings(findings, trackKey) {
  if (!findings) return [];
  const out = [];

  // Pull severity‐sorted issues first
  const issues = (findings.issues || []).slice().sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  for (const issue of issues.slice(0, 3)) {
    out.push({ severity: issue.severity || 'info', text: issue.message });
  }

  // Supplement from details if fewer than 2
  const d = findings.details || {};
  if (out.length < 2) {
    if (trackKey === 'A' && d.avgBuildTime) {
      out.push({ severity: d.avgBuildTime > 10 ? 'warning' : 'info', text: `Builds average ${d.avgBuildTime} min` });
    }
    if (trackKey === 'B' && d.testRatio !== undefined) {
      out.push({ severity: d.testRatio < 30 ? 'critical' : d.testRatio < 60 ? 'warning' : 'info', text: `Test ratio: ${d.testRatio}% of files have tests` });
    }
    if (trackKey === 'C' && d.readmeAge !== undefined) {
      out.push({ severity: d.readmeAge > 180 ? 'critical' : 'info', text: `README last updated ${d.readmeAge} days ago` });
    }
    if (trackKey === 'E' && d.vulnerabilityCount !== undefined) {
      out.push({ severity: d.vulnerabilityCount > 0 ? 'critical' : 'info', text: `${d.vulnerabilityCount} known vulnerabilities in dependency chain` });
    }
    if (trackKey === 'D' && d.busFactor !== undefined) {
      out.push({ severity: d.busFactor > 60 ? 'critical' : 'warning', text: `Bus factor: ${d.busFactor}% knowledge concentration` });
    }
    if (trackKey === 'F' && d.avgPRLifetime !== undefined) {
      out.push({ severity: d.avgPRLifetime > 7 ? 'warning' : 'info', text: `PRs stay open for an average of ${d.avgPRLifetime} days` });
    }
    if (trackKey === 'G' && d.abandonedPRs !== undefined) {
      out.push({ severity: d.abandonedPRs > 5 ? 'critical' : 'warning', text: `${d.abandonedPRs} PRs abandoned with no merge or close` });
    }
    if (trackKey === 'H' && d.missingEnvCount !== undefined) {
      out.push({ severity: d.missingEnvCount > 0 ? 'warning' : 'info', text: `${d.missingEnvCount} env vars undocumented` });
    }
  }

  return out.slice(0, 3);
}

const SEVERITY_DOT = {
  critical: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-cyan-700/40',
};
const SEVERITY_TEXT = {
  critical: 'text-red-300/80',
  warning: 'text-amber-300/80',
  info: 'text-cyan-300/50',
};

export default function TrackStation({ trackKey, track, findings, isActive, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const base = TRACK_BASE[trackKey] || TRACK_BASE.A;
  const score = findings?.score;
  const hasCritical = findings?.issues?.some(i => i.severity === 'critical');
  const hasWarning = findings?.issues?.some(i => i.severity === 'warning');

  const healthColor = score === undefined ? 'rgba(100,180,180,0.25)'
    : score >= 70 ? 'rgba(52,211,153,0.8)'
      : score >= 40 ? 'rgba(245,158,11,0.8)'
        : 'rgba(248,113,113,0.8)';

  const borderColor = hasCritical ? 'rgba(248,113,113,0.25)'
    : hasWarning ? 'rgba(245,158,11,0.18)'
      : isActive ? `${base.color}40`
        : 'rgba(0,229,255,0.05)';

  const plainFindings = buildFindings(findings, trackKey);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        background: isActive ? base.glow : 'rgba(0,0,0,0.25)',
        border: `1px solid ${borderColor}`,
        boxShadow: hasCritical ? '0 0 20px rgba(248,113,113,0.08)' : isActive ? `0 0 20px ${base.glow}` : 'none',
      }}
      onClick={() => { onClick?.(); setExpanded(e => !e); }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
    >
      {/* Main card */}
      <div className="p-4">
        {/* Top: anatomical label + critical indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] font-mono uppercase tracking-[0.2em]" style={{ color: `${base.color}60` }}>
            {track?.anatomical || '—'}
          </span>
          <div className="flex items-center gap-1.5">
            {hasCritical && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
            {hasWarning && !hasCritical && <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />}
          </div>
        </div>

        {/* Track name */}
        <div className="flex items-end justify-between gap-2 mb-3">
          <div>
            <div className="text-[10px] font-mono text-cyan-800/40 uppercase mb-0.5">{track?.icon || trackKey}</div>
            <div className="text-sm font-bold text-white leading-tight">{track?.name || 'Track'}</div>
          </div>
          <div className="text-3xl font-black" style={{ color: healthColor, lineHeight: 1 }}>
            {score !== undefined ? score : <span className="text-xl text-cyan-900/30">···</span>}
          </div>
        </div>

        {/* Animated health bar */}
        <div className="h-1.5 rounded-full bg-black/30 overflow-hidden mb-3">
          {score !== undefined ? (
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ background: healthColor, boxShadow: `0 0 8px ${healthColor}` }}
            />
          ) : (
            <motion.div
              className="h-full w-1/3 rounded-full bg-cyan-800/20"
              animate={{ x: ['0%', '200%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* 2–3 plain-English findings */}
        {plainFindings.length > 0 && (
          <div className="space-y-1.5">
            {plainFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${SEVERITY_DOT[f.severity] || SEVERITY_DOT.info}`} />
                <p className={`text-[10px] leading-relaxed ${SEVERITY_TEXT[f.severity] || SEVERITY_TEXT.info}`}>{f.text}</p>
              </div>
            ))}
          </div>
        )}

        {score === undefined && (
          <p className="text-[9px] text-cyan-900/30 font-mono">Scanning...</p>
        )}

        {/* Expand hint */}
        {plainFindings.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1 text-[8px] font-mono text-cyan-900/25">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d={expanded ? 'M2 8 L6 4 L10 8' : 'M2 4 L6 8 L10 4'} stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {expanded ? 'collapse' : 'expand all findings'}
          </div>
        )}
      </div>

      {/* Expanded: full findings list */}
      <AnimatePresence>
        {expanded && findings?.issues?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-2">
              <div className="text-[8px] font-mono text-cyan-800/30 uppercase tracking-wider mb-2">All Findings</div>
              {findings.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`text-[10px] p-2.5 rounded-lg leading-relaxed ${issue.severity === 'critical'
                      ? 'bg-red-500/5 border border-red-500/10 text-red-300/70'
                      : issue.severity === 'warning'
                        ? 'bg-amber-500/5 border border-amber-500/10 text-amber-300/70'
                        : 'bg-cyan-900/10 border border-cyan-900/10 text-cyan-300/50'
                    }`}
                >
                  <span className="text-[8px] font-mono uppercase mr-2 opacity-60">{issue.severity}</span>
                  {issue.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
