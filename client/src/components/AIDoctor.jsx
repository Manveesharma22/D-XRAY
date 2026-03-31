import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TypewriterLine({ text, onComplete, speed = 18 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    setDone(false);
    timer.current = setInterval(() => {
      idx.current++;
      if (idx.current <= text.length) {
        setDisplayed(text.slice(0, idx.current));
      } else {
        clearInterval(timer.current);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer.current);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-[7px] h-[13px] bg-emerald-400 ml-0.5 align-middle animate-pulse" />}
    </span>
  );
}

export default function AIDoctor({ diagnosis, corpusScore }) {
  const [visibleSections, setVisibleSections] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [linesDone, setLinesDone] = useState(0);
  const bootLines = [
    '> INITIALIZING DX-RAY DIAGNOSTIC TERMINAL v2.0...',
    '> LOADING NEURAL PATHOLOGY ENGINE...',
    '> CROSS-REFERENCING 847 KNOWN CODE CONDITIONS...',
    '> READING SCAN DATA — DO NOT INTERRUPT...',
  ];
  const [bootIdx, setBootIdx] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  const sections = diagnosis?.sections || [];

  useEffect(() => {
    if (bootIdx < bootLines.length - 1) return;
    // Boot complete — start revealing sections
    const timer = setInterval(() => {
      setVisibleSections(prev => {
        if (prev < sections.length) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [bootDone, sections.length]);

  if (sections.length === 0) return null;

  const scoreColor = corpusScore?.dxScore >= 70 ? '#4ade80'
    : corpusScore?.dxScore >= 40 ? '#fbbf24' : '#f87171';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #020c04 0%, #000402 100%)',
        boxShadow: '0 0 60px rgba(0,251,255,0.03), inset 0 0 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* Section heading */}
      <div className="px-8 pt-8 pb-2 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
        <span className="text-[10px] font-mono text-emerald-500/40 tracking-[0.4em] uppercase font-bold">AI_Doc</span>
        <div className="flex-1 h-px bg-emerald-500/10" />
        <h3 className="text-2xl font-black text-white tracking-tighter uppercase font-technical">AI Doc</h3>
      </div>

      {/* Terminal chrome */}
      <div className="bg-black/80 border-b border-emerald-500/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {['#ff5f57', '#ffbd2e', '#28c840'].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.8 }} />
            ))}
          </div>
          <span className="text-[10px] font-technical text-emerald-500/40 tracking-[0.4em] uppercase font-bold">
            Terminal_Access_v3.2 // AI_Diagnostic_Core
          </span>
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
          />
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[9px] font-technical text-emerald-500/40 tracking-widest uppercase hover:text-emerald-400 transition-colors"
          >
            {expanded ? '[_Collapse_]' : '[_Expand_All_]'}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px', fontSize: 14, lineHeight: 1.7 }}>
        {/* Scan line overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,255,80,0.012) 0px, transparent 1px, transparent 3px)',
        }} />

        {/* Boot sequence */}
        <div style={{ marginBottom: 16, color: 'rgba(52,211,153,0.35)', position: 'relative', zIndex: 2 }}>
          {bootLines.slice(0, bootIdx + 1).map((line, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {i < bootIdx ? (
                <span style={{ color: 'rgba(52,211,153,0.25)' }}>{line} <span style={{ color: '#4ade80', opacity: 0.5 }}>OK</span></span>
              ) : (
                <TypewriterLine
                  text={line}
                  speed={22}
                  onComplete={() => {
                    if (i < bootLines.length - 1) {
                      setTimeout(() => setBootIdx(prev => prev + 1), 200);
                    } else {
                      setBootDone(true);
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {bootDone && (
          <>
            {/* Separator */}
            <div style={{ borderTop: '1px solid rgba(52,211,153,0.08)', marginBottom: 16 }} />

            {/* Patient header */}
            <div className="font-technical text-[11px] text-emerald-500/40 mb-2 tracking-wide">
              <span className="text-emerald-400 font-bold">&gt;</span>{' '}
              SUBJECT:_<span className="text-white font-bold">{diagnosis.patientName}</span>
              {' '}| AGE:_<span className="text-white">{diagnosis.age}yr</span>
              {' '}| FORKS:_<span className="text-white">{diagnosis.familyMembers}</span>
            </div>
            <div className="font-technical text-[11px] text-emerald-500/40 mb-6 tracking-wide">
              <span className="text-emerald-400 font-bold">&gt;</span>{' '}
              VERDICT:_
              <span className="text-lg font-bold holographic-bloom" style={{ color: scoreColor }}>
                {corpusScore?.dxScore}
              </span>
              {' '}/_100_GRADE:_
              <span className="uppercase font-bold tracking-widest" style={{ color: scoreColor }}>
                {corpusScore?.severity}
              </span>
            </div>

            {/* Diagnosis sections */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {sections.slice(0, expanded ? sections.length : visibleSections).map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ marginBottom: 12 }}
                >
                  {section.type === 'opening' && (
                    <div style={{ color: 'rgba(52,211,153,0.7)' }}>
                      <span style={{ color: '#4ade80' }}>&gt;</span>{' '}
                      {i === 0 && !expanded ? (
                        <TypewriterLine text={section.text} speed={16} onComplete={() => setLinesDone(p => p + 1)} />
                      ) : section.text}
                    </div>
                  )}
                  {section.type === 'diagnosis' && (
                    <div style={{
                      paddingLeft: 12,
                      borderLeft: '2px solid rgba(52,211,153,0.12)',
                      marginBottom: 8,
                    }}>
                      <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: '#4ade80', opacity: 0.7 }}>&gt;</span>{' '}
                        [{section.system?.toUpperCase()}]
                      </div>
                      <div style={{ color: 'rgba(200,255,220,0.6)', paddingLeft: 8 }}>
                        {section.text}
                      </div>
                      {section.prescription && (
                        <div style={{ color: 'rgba(74,222,128,0.45)', paddingLeft: 8, marginTop: 4, fontStyle: 'italic' }}>
                          Rx: {section.prescription}
                        </div>
                      )}
                    </div>
                  )}
                  {section.type === 'prognosis' && (
                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(52,211,153,0.08)',
                    }}>
                      <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: 6 }}>
                        <span>&gt;</span> PROGNOSIS
                      </div>
                      <div style={{ color: 'rgba(200,255,220,0.7)', paddingLeft: 8 }}>{section.text}</div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Active cursor */}
            {visibleSections < sections.length && !expanded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(52,211,153,0.3)', position: 'relative', zIndex: 2 }}>
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ width: 7, height: 13, background: '#4ade80' }}
                />
                <span style={{ fontSize: 12, letterSpacing: '0.1em' }}>READING SCAN DATA...</span>
              </div>
            )}

            {/* Terminal prompt when done */}
            {(expanded || visibleSections >= sections.length) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(52,211,153,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'rgba(52,211,153,0.35)',
                  fontSize: 13,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <span style={{ color: '#4ade80', opacity: 0.5 }}>$</span>
                <span>dxray --diagnosis-complete --prescription-generated</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.75, repeat: Infinity }}
                  style={{ display: 'inline-block', width: 7, height: 13, background: '#4ade80', marginLeft: 2 }}
                />
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
