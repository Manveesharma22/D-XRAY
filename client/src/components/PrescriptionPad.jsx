import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MEDICINES = {
  ci_flaky: {
    name: 'Flakinex', dose: '500mg', instruction: 'Run flakiness audit once, then quarantine flaky tests daily',
    sideEffect: 'May cause temporary test count anxiety', icon: '💊', color: 'red'
  },
  ci_slow: {
    name: 'Pipelinol', dose: 'IV Drip', instruction: 'Inject caching layer, parallelize build steps',
    sideEffect: 'Initial setup pain — worth it', icon: '💉', color: 'amber'
  },
  docs_dead: {
    name: 'Docusatin', dose: '1 tablet monthly', instruction: 'One doc sprint per month, assign ownership per module',
    sideEffect: 'Developers may resist', icon: '💊', color: 'amber'
  },
  burnout: {
    name: 'Restora', dose: '40% reduction', instruction: 'Reduce PR review load by 40%, enforce no-weekend deploys',
    sideEffect: 'Short-term velocity drop', icon: '🩹', color: 'red'
  },
  bus_factor: {
    name: 'Knowledgecillin', dose: '2 sessions/week', instruction: 'Pair programming sessions, mandatory handoff documentation',
    sideEffect: 'Uncomfortable conversations required', icon: '💉', color: 'red'
  },
  dep_rot: {
    name: 'Updatezol', dose: 'Weekly dose', instruction: 'Automated dependency PRs via Renovate or Dependabot',
    sideEffect: 'Occasional breaking changes', icon: '💊', color: 'red'
  },
  env_drift: {
    name: 'Envstatin', dose: 'One-time injection', instruction: 'Enforce .env.example, add setup validation script',
    sideEffect: 'One-time migration effort', icon: '🩹', color: 'cyan'
  },
  test_sparse: {
    name: 'Coveragenol', dose: 'Apply liberally', instruction: 'Add integration tests for critical paths, target 30% in 2 sprints',
    sideEffect: 'Feature velocity will temporarily slow', icon: '💊', color: 'amber'
  },
  dep_bloat: {
    name: 'Debtrim', dose: 'Surgical removal', instruction: 'Audit unused deps, consolidate overlapping libraries',
    sideEffect: 'May break something nobody knew existed', icon: '🔬', color: 'cyan'
  },
  review_bottleneck: {
    name: 'Distributeol', dose: 'Rotate schedule', instruction: 'Distribute review load, cap PRs per reviewer at 5/day',
    sideEffect: 'Some reviews will be slower initially', icon: '💊', color: 'amber'
  },
  onboarding_hard: {
    name: 'Onboardex', dose: 'Setup script + README', instruction: 'Create one-command setup, document tribal knowledge',
    sideEffect: 'Requires investment from senior engineers', icon: '💉', color: 'amber'
  },
  rage_commits: {
    name: 'Chillaxin', dose: 'Before midnight', instruction: 'Establish coding hour boundaries, normalize stepping away',
    sideEffect: 'May feel unproductive at first', icon: '🩹', color: 'cyan'
  }
};

function generatePrescriptions(tracks) {
  const prescriptions = [];
  const ci = tracks['A'];
  if (ci) {
    if (ci.issues?.some(i => i.severity === 'critical' && i.message?.toLowerCase().includes('flaky')))
      prescriptions.push({ ...MEDICINES.ci_flaky, condition: 'Flaky CI Pipeline', urgency: 'HIGH' });
    if (ci.details?.avgBuildTime > 10)
      prescriptions.push({ ...MEDICINES.ci_slow, condition: `Slow Builds (${ci.details.avgBuildTime}min avg)`, urgency: 'MEDIUM' });
  }
  const tests = tracks['B'];
  if (tests && tests.details?.testRatio < 30)
    prescriptions.push({ ...MEDICINES.test_sparse, condition: `Test Coverage Gap (${tests.details.testRatio}%)`, urgency: tests.details?.testRatio < 10 ? 'HIGH' : 'MEDIUM' });
  const docs = tracks['C'];
  if (docs && docs.score < 50)
    prescriptions.push({ ...MEDICINES.docs_dead, condition: 'Documentation Decay', urgency: 'MEDIUM' });
  const onboard = tracks['D'];
  if (onboard) {
    if (onboard.score < 60) prescriptions.push({ ...MEDICINES.onboarding_hard, condition: 'High Onboarding Friction', urgency: 'MEDIUM' });
    if (onboard.details?.busFactor > 60) prescriptions.push({ ...MEDICINES.bus_factor, condition: `Critical Bus Factor (${onboard.details.busFactor}%)`, urgency: 'HIGH' });
  }
  const deps = tracks['E'];
  if (deps) {
    if (deps.details?.vulnerabilityCount > 0) prescriptions.push({ ...MEDICINES.dep_rot, condition: `${deps.details.vulnerabilityCount} Known Vulnerabilities`, urgency: 'HIGH' });
    if (deps.details?.totalDependencies > 50) prescriptions.push({ ...MEDICINES.dep_bloat, condition: `Dependency Bloat (${deps.details.totalDependencies} pkgs)`, urgency: 'LOW' });
  }
  const flow = tracks['F'];
  if (flow?.burnoutSignals?.some(b => b.riskLevel === 'high'))
    prescriptions.push({ ...MEDICINES.burnout, condition: 'Developer Burnout Signals', urgency: 'HIGH' });
  const review = tracks['G'];
  if (review?.issues?.some(i => i.message?.toLowerCase().includes('bottleneck')))
    prescriptions.push({ ...MEDICINES.review_bottleneck, condition: 'Review Bottleneck', urgency: 'MEDIUM' });
  const env = tracks['H'];
  if (env && env.score < 60)
    prescriptions.push({ ...MEDICINES.env_drift, condition: 'Environment Drift', urgency: 'LOW' });
  return prescriptions;
}

const COLOR_MAP = {
  red: { border: 'border-red-500/15', bg: 'bg-red-500/[0.03]', badge: 'bg-red-500/15 text-red-400 border-red-500/20', iconBg: 'bg-red-500/10', accent: '#ff4444' },
  amber: { border: 'border-amber-500/15', bg: 'bg-amber-500/[0.03]', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/15', iconBg: 'bg-amber-500/10', accent: '#f59e0b' },
  cyan: { border: 'border-cyan-500/10', bg: 'bg-cyan-500/[0.02]', badge: 'bg-cyan-500/5 text-cyan-500/70 border-cyan-900/10', iconBg: 'bg-cyan-500/5', accent: '#00e5ff' }
};

export default function PrescriptionPad({ tracks }) {
  const [expandedRx, setExpandedRx] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const prescriptions = generatePrescriptions(tracks);
  if (prescriptions.length === 0) return null;

  const highUrgency = prescriptions.filter(p => p.urgency === 'HIGH');
  const mediumRx = prescriptions.filter(p => p.urgency === 'MEDIUM');
  const lowRx = prescriptions.filter(p => p.urgency === 'LOW');

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => setIsVisible(true)}
      className="relative"
      style={{ perspective: 1000 }}
    >
      {/* Tear-off perforation line at top */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="h-0.5 w-full mb-1"
        style={{
          background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(0,229,255,0.15) 6px, rgba(0,229,255,0.15) 8px)',
          originX: 0,
        }}
      />

      <div
        className="glass-panel rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(0,6,14,0.92) 0%, rgba(0,15,30,0.85) 100%)',
          border: '1px solid rgba(0,229,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.04)',
        }}
      >
        {/* Perforated top */}
        <div className="h-3 w-full" style={{
          background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(0,229,255,0.04) 8px, rgba(0,229,255,0.04) 10px)'
        }} />

        {/* Header */}
        <div className="px-8 pt-6 pb-5 border-b border-cyan-900/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
              style={{ fontFamily: "'Caveat', cursive", color: '#00e5ff', fontWeight: 700, fontSize: 52, letterSpacing: '-1px', lineHeight: 1 }}
            >
              Rx
            </motion.span>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Prescription Pad</h3>
              <p className="text-xs text-cyan-800/50 font-mono tracking-wider mt-0.5">
                {prescriptions.length} MEDICINE{prescriptions.length > 1 ? 'S' : ''} PRESCRIBED
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-cyan-800/30 font-mono">DATE</div>
            <div className="text-sm text-cyan-600/50 font-mono">{new Date().toLocaleDateString()}</div>
            <div className="text-[9px] text-cyan-800/20 font-mono mt-0.5">REF: DX-{Date.now().toString(36).slice(-6).toUpperCase()}</div>
          </div>
        </div>

        {/* Medicine cards */}
        <div className="px-6 py-6">
          {highUrgency.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-red-400/60 font-mono uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                URGENT — TAKE IMMEDIATELY
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highUrgency.map((rx, i) => (
                  <MedicineCard key={i} rx={rx} index={i} expanded={expandedRx === `high-${i}`} onToggle={() => setExpandedRx(expandedRx === `high-${i}` ? null : `high-${i}`)} />
                ))}
              </div>
            </div>
          )}
          {mediumRx.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-amber-400/50 font-mono uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                ONGOING TREATMENT
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mediumRx.map((rx, i) => (
                  <MedicineCard key={i} rx={rx} index={i} expanded={expandedRx === `med-${i}`} onToggle={() => setExpandedRx(expandedRx === `med-${i}` ? null : `med-${i}`)} />
                ))}
              </div>
            </div>
          )}
          {lowRx.length > 0 && (
            <div>
              <div className="text-xs text-cyan-800/30 font-mono uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-600/30" />
                PREVENTIVE CARE
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowRx.map((rx, i) => (
                  <MedicineCard key={i} rx={rx} index={i} expanded={expandedRx === `low-${i}`} onToggle={() => setExpandedRx(expandedRx === `low-${i}` ? null : `low-${i}`)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with doctor's signature */}
        <div className="px-8 py-5 border-t border-cyan-900/10 flex items-end justify-between">
          <div className="text-sm text-cyan-800/30 max-w-md">
            <span className="text-amber-400/40 font-bold">WARNING:</span> Do not ignore. Technical debt left untreated becomes organizational debt.
          </div>
          <div className="text-right">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: 'rgba(0,229,255,0.38)' }}
            >
              Dr. DX-Ray
            </motion.div>
            <div className="text-[10px] text-cyan-800/20 font-mono -mt-1">Board Certified in Code Pathology</div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              className="w-32 h-px bg-cyan-500/12 mt-1"
              style={{ originX: 0 }}
            />
          </div>
        </div>

        {/* Perforated bottom */}
        <div className="h-3 w-full" style={{
          background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(0,229,255,0.04) 8px, rgba(0,229,255,0.04) 10px)'
        }} />
      </div>

      {/* Shadow tear-off effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="h-1 w-full mt-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.06), transparent)',
        }}
      />
    </motion.div>
  );
}

function MedicineCard({ rx, index, expanded, onToggle }) {
  const c = COLOR_MAP[rx.color] || COLOR_MAP.cyan;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
      onClick={onToggle}
      className={`cursor-pointer rounded-xl border ${c.border} ${c.bg} transition-all overflow-hidden`}
      whileHover={{ scale: 1.015, borderColor: `${c.accent}30` }}
      whileTap={{ scale: 0.985 }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${c.iconBg} border ${c.border} flex items-center justify-center text-xl`}>
              {rx.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Caveat', cursive" }}>{rx.name}</div>
              <div className="text-xs font-mono text-cyan-800/50">{rx.dose}</div>
            </div>
          </div>
          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${c.badge}`}>
            {rx.urgency}
          </span>
        </div>
        <div className="mb-4">
          <div className="text-xs text-cyan-800/40 font-mono uppercase tracking-wider mb-2">Diagnosis</div>
          <div className="text-base text-cyan-200/90 leading-relaxed font-bold">{rx.condition}</div>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="text-xs text-cyan-800/40 font-mono uppercase tracking-wider mb-2">Directions</div>
          <div className="text-cyan-300 text-balance leading-tight" style={{ fontFamily: "'Caveat', cursive", fontSize: 21 }}>
            {rx.instruction}
          </div>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2">
                <div className="flex gap-2">
                  <span className="text-[9px] text-red-400/50 font-mono w-16 shrink-0 uppercase">Side Fx</span>
                  <span className="text-xs text-amber-400/60">{rx.sideEffect}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] text-cyan-800/40 font-mono w-16 shrink-0 uppercase">Refills</span>
                  <span className="text-xs text-cyan-300/60">Unlimited — lifestyle change</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-center mt-2">
          <span className="text-[8px] text-cyan-900/30 font-mono">{expanded ? 'click to collapse' : 'click for details'}</span>
        </div>
      </div>
    </motion.div>
  );
}
