import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Generate fracture events from track findings
function generateFractureEvents(tracks) {
  const events = [];

  // CI fractures
  const ci = tracks['A'];
  if (ci?.issues?.some(i => i.severity === 'critical')) {
    events.push({
      type: 'ci_break',
      icon: '⚡',
      label: 'CI pipeline broke',
      detail: ci.issues.find(i => i.severity === 'critical')?.message,
      severity: 'critical',
      offset: 0.3 // where on timeline (0-1)
    });
  }
  if (ci?.details?.avgBuildTime > 15) {
    events.push({
      type: 'ci_slow',
      icon: '🐌',
      label: `Build times doubled — ${ci.details.avgBuildTime}min`,
      detail: 'No caching layer detected',
      severity: 'warning',
      offset: 0.5
    });
  }

  // Test fractures
  const tests = tracks['B'];
  if (tests?.details?.testRatio < 20) {
    events.push({
      type: 'test_break',
      icon: '💔',
      label: 'Test suite stress fracture',
      detail: `Only ${tests.details.testRatio}% coverage — tests stopped being trusted`,
      severity: 'critical',
      offset: 0.4
    });
  }

  // Doc fractures
  const docs = tracks['C'];
  if (docs?.score < 40) {
    events.push({
      type: 'doc_death',
      icon: '💀',
      label: 'Documentation maintenance stopped',
      detail: 'README hasn\'t kept pace with code changes',
      severity: 'warning',
      offset: 0.6
    });
  }

  // Dependency fractures
  const deps = tracks['E'];
  if (deps?.details?.vulnerabilityCount > 0) {
    events.push({
      type: 'vuln_found',
      icon: '🔓',
      label: `${deps.details.vulnerabilityCount} vulnerabilities exposed`,
      detail: 'Dependency rot reaching critical levels',
      severity: 'critical',
      offset: 0.7
    });
  }

  // Burnout fractures
  const flow = tracks['F'];
  if (flow?.burnoutSignals?.some(b => b.riskLevel === 'high')) {
    events.push({
      type: 'burnout',
      icon: '🔥',
      label: 'Developer burnout detected',
      detail: flow.burnoutSignals.find(b => b.riskLevel === 'high')?.signals?.join(', '),
      severity: 'critical',
      offset: 0.8
    });
  }

  // Rage commits
  if (flow?.rageCommits?.length > 0) {
    const worst = flow.rageCommits[0];
    events.push({
      type: 'rage',
      icon: '😤',
      label: `Someone was having a bad night`,
      detail: `"${worst.message}" at ${worst.hour}:00`,
      severity: 'warning',
      offset: 0.55
    });
  }

  // Review fractures
  const review = tracks['G'];
  if (review?.details?.abandonedPRs > 3) {
    events.push({
      type: 'pr_abandoned',
      icon: '🚪',
      label: `${review.details.abandonedPRs} PRs abandoned — work wasted`,
      detail: 'Code review circulation blocked',
      severity: 'warning',
      offset: 0.45
    });
  }

  // Environment fractures
  const env = tracks['H'];
  if (env?.issues?.some(i => i.severity === 'critical')) {
    events.push({
      type: 'env_breach',
      icon: '🚨',
      label: 'Environment security breach',
      detail: env.issues.find(i => i.severity === 'critical')?.message,
      severity: 'critical',
      offset: 0.2
    });
  }

  return events.sort((a, b) => a.offset - b.offset);
}

// Generate health states along the timeline
function generateHealthTimeline(timeline, tracks) {
  if (!timeline || timeline.length === 0) return [];

  return timeline.map((entry, i) => {
    const ratio = i / (timeline.length - 1);
    const commits = entry.count || 0;
    const fixes = entry.fixes || 0;

    // Simple health scoring per period
    let health = 70;
    if (fixes > commits * 0.3) health -= 20; // lots of fixes = problems
    if (commits > 50) health -= 10; // high activity = stress
    if (commits < 3) health -= 15; // low activity = stagnation

    // Map to color zones
    let zone;
    if (health >= 60) zone = 'healthy';
    else if (health >= 40) zone = 'friction';
    else zone = 'crisis';

    return {
      ...entry,
      ratio,
      health: Math.max(0, Math.min(100, health)),
      zone
    };
  });
}

export default function FractureReplay({ timeline, tracks }) {
  const [scrubPosition, setScrubPosition] = useState(1); // 0 = start, 1 = now
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const trackRef = useRef(null);

  const events = useMemo(() => generateFractureEvents(tracks), [tracks]);
  const healthTimeline = useMemo(() => generateHealthTimeline(timeline, tracks), [timeline, tracks]);

  if (!timeline || timeline.length === 0) return null;

  const maxCommits = Math.max(...timeline.map(t => t.count || 0), 1);

  // Determine what's visible at current scrub position
  const visibleEvents = events.filter(e => e.offset <= scrubPosition);
  const currentEvent = events.find(e =>
    Math.abs(e.offset - scrubPosition) < 0.05
  );

  // Current date label
  const currentIndex = Math.round(scrubPosition * (timeline.length - 1));
  const currentPeriod = timeline[currentIndex];
  const currentHealth = healthTimeline[currentIndex];

  const handleScrub = useCallback((e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setScrubPosition(ratio);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScrub(e);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) handleScrub(e);
  }, [isDragging, handleScrub]);

  const handleMouseUp = () => setIsDragging(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-6 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Fracture Replay</h3>
            <p className="text-xs text-cyan-800/50 font-mono tracking-wider">Drag to travel through time</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white font-mono">
            {currentPeriod?.date?.slice(0, 7) || 'Now'}
          </div>
          <div className={`text-[10px] font-mono ${
            currentHealth?.zone === 'healthy' ? 'text-emerald-400' :
            currentHealth?.zone === 'friction' ? 'text-amber-400' : 'text-red-400'
          }`}>
            {currentHealth?.zone === 'healthy' ? 'FLOW STATE' :
             currentHealth?.zone === 'friction' ? 'FRICTION' : 'CRISIS'}
          </div>
        </div>
      </div>

      {/* Health ribbon */}
      <div className="flex gap-px h-3 rounded-lg overflow-hidden mb-3">
        {healthTimeline.map((h, i) => (
          <div
            key={i}
            className={`flex-1 transition-all ${
              h.zone === 'healthy' ? 'bg-emerald-500/40' :
              h.zone === 'friction' ? 'bg-amber-500/40' : 'bg-red-500/40'
            } ${i <= currentIndex ? 'opacity-100' : 'opacity-20'}`}
          />
        ))}
      </div>

      {/* Main timeline track */}
      <div
        ref={trackRef}
        className="relative h-20 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => { setIsDragging(true); handleScrub(e.touches[0]); }}
        onTouchMove={(e) => handleScrub(e.touches[0])}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Background bars */}
        <div className="absolute inset-0 flex items-end gap-px">
          {timeline.map((entry, i) => {
            const height = (entry.count / maxCommits) * 100;
            const isVisible = i <= currentIndex;
            return (
              <div
                key={i}
                className="flex-1 flex items-end"
              >
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isVisible ? 'bg-cyan-500/25' : 'bg-cyan-500/[0.05]'
                  }`}
                  style={{ height: `${height}%`, minHeight: 2 }}
                />
              </div>
            );
          })}
        </div>

        {/* Event markers */}
        {events.map((event, i) => (
          <div
            key={i}
            className="absolute top-0 -translate-x-1/2 z-10"
            style={{ left: `${event.offset * 100}%` }}
            onMouseEnter={() => setHoveredEvent(i)}
            onMouseLeave={() => setHoveredEvent(null)}
          >
            <motion.div
              initial={{ scale: 0, y: -10 }}
              animate={{
                scale: event.offset <= scrubPosition ? 1 : 0.5,
                opacity: event.offset <= scrubPosition ? 1 : 0.3,
                y: 0
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border cursor-pointer ${
                event.severity === 'critical'
                  ? 'bg-red-500/20 border-red-500/30'
                  : 'bg-amber-500/20 border-amber-500/30'
              }`}
            >
              {event.icon}
            </motion.div>

            {/* Event tooltip */}
            <AnimatePresence>
              {hoveredEvent === i && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 w-56 bg-black/95 border border-cyan-500/20 rounded-xl p-3 shadow-2xl"
                >
                  <div className={`text-xs font-bold mb-1 ${
                    event.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {event.label}
                  </div>
                  {event.detail && (
                    <div className="text-[10px] text-cyan-300/60 leading-relaxed">
                      {event.detail}
                    </div>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Scrubber handle */}
        <div
          className="absolute top-0 bottom-0 z-20"
          style={{ left: `${scrubPosition * 100}%` }}
        >
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/60 -translate-x-1/2" />
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-white/30 border-2 border-cyan-400" />
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-px mt-1">
        {timeline.map((entry, i) => {
          const showLabel = i % Math.max(1, Math.floor(timeline.length / 6)) === 0 || i === timeline.length - 1;
          return (
            <div key={i} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[8px] font-mono text-cyan-800/30">
                  {entry.date?.slice(5)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Visible fractures list */}
      <AnimatePresence>
        {visibleEvents.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-cyan-900/10 overflow-hidden"
          >
            <div className="text-[9px] font-mono text-cyan-800/40 uppercase tracking-wider mb-2">
              {visibleEvents.length} fracture{visibleEvents.length !== 1 ? 's' : ''} visible at this point
            </div>
            <div className="space-y-1.5">
              {visibleEvents.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                    event.severity === 'critical'
                      ? 'bg-red-500/5 border border-red-500/10'
                      : 'bg-amber-500/5 border border-amber-500/10'
                  }`}
                >
                  <span>{event.icon}</span>
                  <span className={event.severity === 'critical' ? 'text-red-300/80' : 'text-amber-300/80'}>
                    {event.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-emerald-500/40" />
          <span className="text-[9px] font-mono text-cyan-800/40">Flow State</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-amber-500/40" />
          <span className="text-[9px] font-mono text-cyan-800/40">Friction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-red-500/40" />
          <span className="text-[9px] font-mono text-cyan-800/40">Crisis</span>
        </div>
      </div>
    </motion.div>
  );
}
