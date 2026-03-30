import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeadCodeCoroner({ data }) {
  const [selectedCorpse, setSelectedCorpse] = useState(null);

  if (!data || !data.deceased || data.deceased.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-7 relative overflow-hidden"
    >
      {/* Crime scene tape header */}
      <div className="absolute top-0 left-0 right-0 h-1.5 coroner-tape" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Dead Code Coroner</h3>
            <p className="text-xs text-cyan-800/50 font-mono tracking-wider">
              {data.totalDeadFiles} deceased element{data.totalDeadFiles !== 1 ? 's' : ''} found &middot; {data.details?.deathRate || 0}% death rate
            </p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-lg font-black text-red-400">{data.totalDeadFiles}</span>
          <span className="text-[10px] text-red-400/50 font-mono ml-1.5 uppercase">corpses</span>
        </div>
      </div>

      <div className="space-y-3">
        {data.deceased.slice(0, 6).map((corpse, i) => {
          const isSelected = selectedCorpse === i;
          const caseNum = String(corpse.caseNumber || i + 1).padStart(4, '0');

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              onClick={() => setSelectedCorpse(isSelected ? null : i)}
              className="cursor-pointer rounded-xl border border-red-500/10 bg-red-500/[0.02] hover:bg-red-500/[0.05] transition-all overflow-hidden"
            >
              {/* Coroner report header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Chalk outline */}
                  <div className="w-12 h-12 rounded-xl border-2 border-dashed border-red-400/25 flex items-center justify-center relative">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="1.5" opacity="0.4">
                      <circle cx="12" cy="5" r="3" />
                      <path d="M12 8v6M9 21l3-7 3 7M8 14h8" />
                    </svg>
                    {/* Chalk dust */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400/10 rounded-full blur-sm" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-red-400/10 rounded-full blur-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-red-400/50 uppercase tracking-wider">
                        Case #{caseNum}
                      </span>
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        corpse.confidence === 'high' ? 'bg-red-500/20 text-red-400' :
                        corpse.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {corpse.confidence} confidence
                      </span>
                    </div>
                    <div className="text-base font-mono text-red-300/80 mt-1 font-bold truncate max-w-[300px]">
                      DECEASED: {corpse.file?.split('/').pop()}
                    </div>
                    <div className="text-[10px] text-red-400/40 font-mono mt-0.5 truncate max-w-[300px]">
                      {corpse.file}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {corpse.daysSinceLastActivity && (
                    <div className="text-lg font-black text-red-400/60">
                      {corpse.daysSinceLastActivity}d
                    </div>
                  )}
                  <div className="text-[8px] text-red-400/30 font-mono uppercase">
                    undiscovered
                  </div>
                </div>
              </div>

              {/* Expanded coroner report */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mb-4 p-5 rounded-xl bg-black/40 border border-red-500/10 space-y-4 font-mono">
                      {/* Formatted coroner report */}
                      <div className="text-[10px] text-red-400/40 uppercase tracking-[0.2em] border-b border-red-500/10 pb-2 mb-3">
                        CORONER'S REPORT
                      </div>

                      <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-xs">
                        <span className="text-red-400/40 uppercase">Deceased</span>
                        <span className="text-red-200/70 font-bold">{corpse.file}</span>

                        <span className="text-red-400/40 uppercase">Cause</span>
                        <span className="text-red-200/70">{corpse.causeOfDeath}</span>

                        {corpse.lastKnownActivity && corpse.lastKnownActivity !== 'Unknown' && (
                          <>
                            <span className="text-red-400/40 uppercase">Last Seen</span>
                            <span className="text-red-200/70">
                              {new Date(corpse.lastKnownActivity).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </>
                        )}

                        {corpse.lastAuthor && corpse.lastAuthor !== 'Unknown' && (
                          <>
                            <span className="text-red-400/40 uppercase">Last Seen By</span>
                            <span className="text-cyan-300/60">@{corpse.lastAuthor}</span>
                          </>
                        )}

                        {corpse.daysSinceLastActivity && (
                          <>
                            <span className="text-red-400/40 uppercase">Undiscovered</span>
                            <span className="text-red-200/70">{corpse.daysSinceLastActivity} days</span>
                          </>
                        )}
                      </div>

                      {/* Dependents left behind */}
                      {corpse.dependents?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-500/10">
                          <div className="text-[9px] text-red-400/40 uppercase tracking-wider mb-2">
                            Dependents Left Behind
                          </div>
                          {corpse.dependents.map((dep, j) => (
                            <div key={j} className="text-[10px] text-red-300/50 font-mono flex items-center gap-2 mb-1">
                              <span className="text-red-400/30">&rarr;</span>
                              {dep}
                            </div>
                          ))}
                          <div className="text-[9px] text-red-400/30 mt-1 italic">
                            {corpse.dependents.length} file{corpse.dependents.length !== 1 ? 's' : ''} still importing a corpse
                          </div>
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

      {/* Crime scene tape footer */}
      <div className="mt-4 h-1.5 coroner-tape rounded-b" />
    </motion.div>
  );
}
