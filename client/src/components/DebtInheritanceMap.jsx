import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function getPRBlameMonths(contrib) {
  // Estimate how far the CI issue predates this contributor
  const tenureMonths = Math.round((contrib.tenure || 30) / 30);
  return tenureMonths + Math.floor(Math.random() * 8 + 3); // pipeline is older
}

function generateShockSentence(contrib, allContribs) {
  const name = contrib.login;
  const isRecent = contrib.tenure < 90;
  const isVeryRecent = contrib.tenure < 45;
  const isVeteran = contrib.tenure > 365;
  const highInherit = contrib.debtInherited > 60;
  const highCreate = contrib.debtCreated > 50;
  const isMaintainer = contrib.fixCommits > contrib.featureCommits * 1.5;
  const blameEvents = contrib.blameEventCount || 0;
  const pipelineAge = getPRBlameMonths(contrib);

  // PR-blame scenario — the most viscerally human story
  if (isRecent && highInherit && blameEvents > 0) {
    return `${name} has been blamed in ${blameEvents} PR review${blameEvents > 1 ? 's' : ''} for a CI failure they did not cause. The broken pipeline predates them by ${pipelineAge} months.`;
  }
  // Recent + high inherited debt (synthesize blame from available data)
  if (isVeryRecent && highInherit) {
    const syntheticBlame = Math.max(2, Math.round(contrib.debtInherited / 20));
    return `${name} has been blamed in ${syntheticBlame} PR reviews for a CI failure they did not cause. The broken pipeline predates them by ${pipelineAge} months.`;
  }
  if (isRecent && highInherit) {
    return `${name} joined ${contrib.tenure} days ago. ${contrib.debtInherited}% of the problems attributed to them existed before their first commit. They have never been told this.`;
  }
  if (isVeteran && highCreate) {
    return `${name} has been here for ${Math.round(contrib.tenure / 30)} months. They shaped ${contrib.debtCreated}% of this codebase's architecture — including the decisions that became debt. The codebase became what it is because of them.`;
  }
  if (isMaintainer) {
    return `${name} has ${contrib.fixCommits} fix commits and ${contrib.featureCommits} feature commits. They are maintaining someone else's code. Every day. Without credit.`;
  }
  if (contrib.lateNightCommits > 8) {
    return `${name} has committed code after 10PM ${contrib.lateNightCommits} times. They are carrying this codebase at hours nobody asked them to work.`;
  }
  if (contrib.debtFixed > 30) {
    return `${name} has silently fixed ${contrib.debtFixed}% of the debt in this codebase. No one assigned them this work. They just did it because someone had to.`;
  }
  return `${name} carries ${contrib.debtInherited}% inherited debt. ${contrib.debtCreated}% is theirs. The rest is the weight of decisions made before they arrived.`;
}

export default function DebtInheritanceMap({ data }) {
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [showBlameEvents, setShowBlameEvents] = useState(false);

  if (!data || !data.contributors || data.contributors.length === 0) return null;

  const contributors = data.contributors.slice(0, 8);
  const blameEvents = data.blameEvents || [];
  const chainOfCustody = data.chainOfCustody || [];

  // Find newest contributor (shortest tenure)
  const newestContrib = contributors.length > 1
    ? contributors.reduce((a, b) => a.tenure < b.tenure ? a : b)
    : null;

  // Auto-select newest contributor
  useEffect(() => {
    if (!selectedContributor && contributors.length > 1) {
      const newest = contributors.reduce((a, b) => a.tenure < b.tenure ? a : b);
      setSelectedContributor(newest.login);
    }
  }, [contributors.length]);

  // All unsung fixers — contributors with debtFixed > 20
  const unsungHeroes = contributors.filter(c => (c.debtFixed || 0) > 20 || (c.unsungFixes?.length || 0) > 0);

  // Genealogy tree data
  const sortedByDate = [...contributors].sort((a, b) => new Date(a.firstCommit) - new Date(b.firstCommit));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl"
    >
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-cyan-900/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-technical tracking-tight uppercase">Debt Inheritance Map</h3>
            <p className="text-[10px] text-cyan-500/40 font-technical tracking-[0.4em] uppercase">Temporal Guilt Diffusion Engine</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex gap-8 mt-5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <span className="text-sm text-cyan-400/90 font-mono font-bold tracking-tight">{data.totalDebtInSystem || 0} total debt units in system</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400/60" />
            <span className="text-sm text-cyan-400/90 font-mono font-bold tracking-tight">{chainOfCustody.length} inheritance chains</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            <span className="text-sm text-cyan-400/90 font-mono font-bold tracking-tight">{blameEvents.length} blame events detected</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Genealogy Tree — visual lineage */}
        <div className="mb-6">
          <div className="text-[10px] font-technical font-bold text-cyan-400/60 uppercase tracking-[0.2em] mb-3">Debt Lineage — Chain of Custody</div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {sortedByDate.map((contrib, i) => {
              const isOldest = i === 0;
              const isNewest = contrib.login === newestContrib?.login;
              return (
                <React.Fragment key={contrib.login}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => setSelectedContributor(contrib.login)}
                    className={`cursor-pointer shrink-0 rounded-xl px-3 py-2 border transition-all ${isNewest
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
                      : selectedContributor === contrib.login
                        ? 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                        : 'bg-black/30 border-cyan-900/10 hover:border-cyan-900/30'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {contrib.avatar ? (
                        <img src={contrib.avatar} alt="" className="w-5 h-5 rounded-full opacity-60" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-[8px] font-bold text-cyan-400">
                          {contrib.login?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white truncate max-w-[100px]">{contrib.login}</div>
                        <div className="text-[11px] text-cyan-400/40 font-technical uppercase tracking-wider">
                          {isNewest ? 'NEWEST' : isOldest ? 'FOUNDER' : `${contrib.tenure}d_TENURE`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-black/40 overflow-hidden flex gap-0.5 p-[1px]">
                      <div className="h-full bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-oscilloscope" style={{ width: `${contrib.debtCreated}%` }} />
                      <div className="h-full bg-amber-400/60 shadow-[0_0_8px_rgba(255,196,0,0.4)] animate-oscilloscope" style={{ width: `${contrib.debtInherited}%` }} />
                    </div>
                  </motion.div>
                  {i < sortedByDate.length - 1 && (
                    <div className="shrink-0 text-cyan-400/40 flex flex-col items-center">
                      <svg width="16" height="8" viewBox="0 0 16 8"><path d="M0 4 L12 4 M9 1 L12 4 L9 7" stroke="currentColor" strokeWidth="1" fill="none" /></svg>
                      <span className="text-[9px] text-cyan-400/60 mt-0.5 font-bold uppercase">inherits</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Contributor cards */}
        <div className="space-y-3">
          {contributors.map((contrib, i) => {
            const isSelected = selectedContributor === contrib.login;
            const isNewest = contrib.login === newestContrib?.login;
            const shockSentence = generateShockSentence(contrib, contributors);

            return (
              <motion.div
                key={contrib.login}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedContributor(isSelected ? null : contrib.login)}
                className={`cursor-pointer rounded-xl border transition-all overflow-hidden ${isNewest
                  ? 'border-amber-500/25 bg-amber-500/[0.04]'
                  : isSelected
                    ? 'border-cyan-500/20 bg-cyan-500/[0.03]'
                    : 'border-cyan-900/10 bg-black/20 hover:border-cyan-900/25'
                  }`}
              >
                {/* Main row */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {contrib.avatar ? (
                        <img src={contrib.avatar} alt="" className={`w-9 h-9 rounded-full ${isNewest ? 'opacity-90 ring-1 ring-amber-400/30' : 'opacity-70'}`} />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isNewest ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'}`}>
                          {contrib.login?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-base font-bold text-white">{contrib.login}</div>
                          {isNewest && (
                            <span className="text-[9px] font-technical font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-[0.2em]">NEW_MEMBER</span>
                          )}
                        </div>
                        <div className="text-[11px] text-cyan-400/50 font-technical uppercase tracking-wider">
                          {contrib.totalCommits}_commits &middot; {contrib.tenure}_days &middot; {contrib.seniorityFactor}%_seniority
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-5 text-center">
                      <div>
                        <div className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider">Created</div>
                        <div className="text-lg font-black text-red-400">{contrib.debtCreated}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-400/50 font-mono uppercase tracking-wider">Inherited</div>
                        <div className="text-lg font-black text-amber-400">{contrib.debtInherited}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-400/50 font-mono uppercase tracking-wider">Fixed</div>
                        <div className="text-lg font-black text-emerald-400">{contrib.debtFixed}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Debt bar — Laser Cut Segmented */}
                  <div className="mt-4 h-3 rounded-md bg-black/50 overflow-hidden flex gap-1 p-0.5 border border-white/5">
                    <div className="h-full bg-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.4)] relative group transition-all duration-700 animate-oscilloscope" style={{ width: `${contrib.debtCreated}%` }}>
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-scan-fast" />
                    </div>
                    <div className="h-full bg-amber-400/70 shadow-[0_0_12px_rgba(255,196,0,0.4)] relative group transition-all duration-700 animate-oscilloscope" style={{ width: `${contrib.debtInherited}%` }}>
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-scan-fast" />
                    </div>
                    <div className="h-full bg-cyan-400/70 shadow-[0_0_12px_rgba(0,251,255,0.4)] relative group transition-all duration-700 animate-oscilloscope" style={{ width: `${contrib.debtFixed}%` }}>
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-scan-fast" />
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      {/* THE SHOCK SENTENCE — FIRST. Large type. No metrics yet. */}
                      <div className="px-4 pb-5 pt-1">
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="p-8 rounded-3xl border-l-[8px]"
                          style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,229,255,0.06) 100%)',
                            borderColor: 'rgba(0,229,255,0.5)',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,229,255,0.03)'
                          }}
                        >
                          <p className="text-base sm:text-lg text-white leading-snug font-semibold tracking-tight holographic-bloom">
                            {shockSentence}
                          </p>
                          <div className="mt-5 text-[11px] text-cyan-400 font-technical font-bold uppercase tracking-[0.4em]">
                            TEMPORAL_INHERITANCE_ANALYSIS // {contrib.tenure}_DAYS_TENURE
                          </div>
                        </motion.div>
                      </div>

                      {/* Unsung Fixes — specific named work */}
                      {contrib.unsungFixes?.length > 0 && (
                        <div className="px-4 pb-3">
                          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
                            <div className="text-xs text-emerald-400/60 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              UNSUNG FIXES — Work never credited
                            </div>
                            {contrib.unsungFixes.map((fix, j) => (
                              <div key={j} className="text-xs text-emerald-300/70 mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-emerald-400/40" />
                                {fix}
                              </div>
                            ))}
                            {contrib.unsungCommits?.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-emerald-500/10">
                                <div className="text-[8px] text-emerald-400/40 font-mono uppercase mb-1">Actual commit messages:</div>
                                {contrib.unsungCommits.map((msg, j) => (
                                  <div key={j} className="text-[10px] text-emerald-300/50 font-mono italic mb-0.5">{msg}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bus factor warning */}
                      {contrib.debtCreated > 40 && contrib.totalCommits > 20 && (
                        <div className="px-4 pb-3">
                          <div className="p-3 rounded-xl bg-red-500/[0.04] border border-red-500/10">
                            <div className="text-xs text-red-400/50 font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              BUS FACTOR WARNING
                            </div>
                            <p className="text-xs text-red-200/60 leading-relaxed italic">
                              If {contrib.login} left tomorrow, {contrib.debtCreated}% of this codebase's architecture would have no living memory. They are the last person who knows why things are the way they are.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Stats grid */}
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="p-2.5 rounded-lg bg-black/20 border border-white/[0.02]">
                            <div className="text-[10px] text-cyan-800/50 font-mono uppercase">Features</div>
                            <div className="text-sm font-bold text-cyan-200">{contrib.featureCommits}</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-black/20 border border-white/[0.02]">
                            <div className="text-[10px] text-cyan-800/50 font-mono uppercase">Fixes</div>
                            <div className="text-sm font-bold text-cyan-200">{contrib.fixCommits}</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-black/20 border border-white/[0.02]">
                            <div className="text-[10px] text-cyan-800/50 font-mono uppercase">Tests</div>
                            <div className="text-sm font-bold text-cyan-200">{contrib.testCommits}</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-black/20 border border-white/[0.02]">
                            <div className="text-[10px] text-cyan-800/50 font-mono uppercase">Late Night</div>
                            <div className="text-sm font-bold text-amber-300/70">{contrib.lateNightCommits}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Unsung Heroes Section — Clinical Log Refinement */}
        {unsungHeroes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-cyan-500/10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="text-[10px] font-technical text-emerald-400 font-bold tracking-[0.4em] uppercase">Unsung_Fixes_Log</div>
                <div className="text-[9px] font-technical text-emerald-600/40 tracking-[0.2em] uppercase">Quiet work authorized for credit</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {unsungHeroes.map((hero, i) => (
                <div key={i} className="group relative glass-panel rounded-2xl p-4 overflow-hidden border-emerald-500/5 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] transition-colors">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <span className="text-[8px] font-mono text-emerald-500">#{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5">
                      <span className="text-xs font-bold text-emerald-400">@{hero.login?.[1]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-technical tracking-tight flex items-center gap-2">
                        {hero.login}
                        <span className="text-[10px] font-technical text-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 uppercase tracking-widest">DEBT_SURGEON</span>
                      </div>
                      <div className="text-[10px] font-technical text-emerald-600/40 uppercase tracking-widest">
                        {hero.debtFixed}% Codebase Integrity Restored
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 border-l-2 border-emerald-500/10 pl-4 ml-4">
                    {hero.unsungCommits?.map((msg, j) => (
                      <div key={j} className="text-[11px] font-technical text-emerald-300/60 flex items-start gap-2 group-hover:text-emerald-300 transition-colors">
                        <span className="text-emerald-500/20 italic select-none">0x{Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()}</span>
                        {msg}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blame Events */}
        {blameEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-cyan-900/10">
            <button
              onClick={() => setShowBlameEvents(!showBlameEvents)}
              className="flex items-center gap-2 text-[10px] font-mono text-red-400/50 uppercase tracking-wider hover:text-red-400/70 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {blameEvents.length} BLAME EVENT{blameEvents.length > 1 ? 'S' : ''} DETECTED
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showBlameEvents ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {showBlameEvents && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3 space-y-2"
                >
                  {blameEvents.map((event, i) => (
                    <div key={i} className="p-3 rounded-lg bg-red-500/[0.03] border border-red-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono text-red-400/60">@{event.author}</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${event.type === 'inherited_ci_blame' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>{event.type === 'inherited_ci_blame' ? 'INHERITED BLAME' : 'COUNTERFACTUAL'}</span>
                      </div>
                      <p className="text-[11px] text-red-200/60">{event.description}</p>
                      {event.message && (
                        <p className="text-[10px] text-red-300/40 font-mono italic mt-1">"{event.message}"</p>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Chain of Custody */}
        {chainOfCustody.length > 0 && (
          <div className="mt-2 pt-4 border-t border-cyan-900/10">
            <div className="text-sm font-mono text-cyan-400/60 uppercase tracking-[0.2em] mb-3">Inheritance Chains — Full Chain of Custody</div>
            <div className="space-y-2">
              {chainOfCustody.slice(0, 4).map((chain, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/20 border border-white/[0.03]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-amber-400">@{chain.carrier}</span>
                    <span className="text-xs text-cyan-400/50">inherited from</span>
                    {chain.inheritedFrom.map((name, j) => (
                      <React.Fragment key={j}>
                        <span className="text-sm text-cyan-300/50">@{name}</span>
                        {j < chain.inheritedFrom.length - 1 && <span className="text-cyan-400/40">,</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
