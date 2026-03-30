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
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #020c04 0%, #000a02 100%)',
        border: '1px solid rgba(52,211,153,0.12)',
        boxShadow: '0 0 40px rgba(52,211,153,0.05), inset 0 0 60px rgba(0,0,0,0.4)',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      }}
    >
      {/* Terminal chrome */}
      <div style={{
        background: 'rgba(0,20,6,0.9)',
        borderBottom: '1px solid rgba(52,211,153,0.1)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: 'rgba(52,211,153,0.4)', letterSpacing: '0.2em' }}>
            AI DOCTOR — DX-RAY DIAGNOSTIC TERMINAL
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }}
          />
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 9, color: 'rgba(52,211,153,0.4)', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {expanded ? '[ COLLAPSE ]' : '[ EXPAND ALL ]'}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px', fontSize: 12, lineHeight: 1.7 }}>
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
            <div style={{ color: 'rgba(52,211,153,0.5)', marginBottom: 4, position: 'relative', zIndex: 2 }}>
              <span style={{ color: '#4ade80', opacity: 0.7 }}>&gt;</span>{' '}
              Patient: <span style={{ color: '#86efac' }}>{diagnosis.patientName}</span>
              {' '}| Age: <span style={{ color: '#86efac' }}>{diagnosis.age}yr</span>
              {' '}| Forks: <span style={{ color: '#86efac' }}>{diagnosis.familyMembers}</span>
            </div>
            <div style={{ color: 'rgba(52,211,153,0.5)', marginBottom: 16, position: 'relative', zIndex: 2 }}>
              <span style={{ color: '#4ade80', opacity: 0.7 }}>&gt;</span>{' '}
              DX Score:{' '}
              <span style={{ color: scoreColor, fontWeight: 700, fontSize: 14 }}>
                {corpusScore?.dxScore}
              </span>
              {' '}/ 100 — Classification:{' '}
              <span style={{ color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                <span style={{ fontSize: 10, letterSpacing: '0.1em' }}>READING SCAN DATA...</span>
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
                  fontSize: 11,
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
