import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBestFemaleVoice, createUtterance } from '../utils/voiceEngine';

export default function GhostNarrator({ diagnosis }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [shimmerDone, setShimmerDone] = useState(false);
  const timerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const synthRef = useRef(null);
  const charIndexRef = useRef(0);
  const currentLineRef = useRef(0);

  const allLines = useMemo(() => {
    if (!diagnosis?.sections) return [];
    const opening = diagnosis.sections.find(s => s.type === 'opening')?.text || '';
    const dx = diagnosis.sections.filter(s => s.type === 'diagnosis').map(d => `${d.system}: ${d.text}`);
    const prog = diagnosis.sections.find(s => s.type === 'prognosis')?.text || '';
    return [opening, ...dx, prog].filter(Boolean);
  }, [diagnosis?.sections]);

  const linesKey = useMemo(() => allLines.join('||'), [allLines]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSpeechSupported(true);
      synthRef.current = window.speechSynthesis;
    }
    // Shimmer entrance
    setTimeout(() => setShimmerDone(true), 2400);
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const speakText = useCallback((text) => {
    if (!speechSupported || !voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();

    const voice = getBestFemaleVoice(synthRef.current);
    const utterance = createUtterance(text, voice);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, [speechSupported, voiceEnabled]);

  useEffect(() => {
    if (allLines.length === 0) return;
    const line = allLines[currentLine] || '';
    if (!line || showAll) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    setIsTyping(true);
    setDisplayText('');
    charIndexRef.current = 0;

    timerRef.current = setInterval(() => {
      charIndexRef.current++;
      if (charIndexRef.current <= line.length) {
        setDisplayText(line.slice(0, charIndexRef.current));
      } else {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsTyping(false);
        if (voiceEnabled && speechSupported) setTimeout(() => speakText(line), 200);
        if (currentLineRef.current < allLines.length - 1) {
          const delay = voiceEnabled ? Math.max(3000, line.length * 55) : 1800;
          advanceTimerRef.current = setTimeout(() => {
            currentLineRef.current++;
            setCurrentLine(prev => prev + 1);
          }, delay);
        }
      }
    }, 22);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [currentLine, linesKey, showAll]);

  useEffect(() => {
    currentLineRef.current = 0;
    setCurrentLine(0);
    setDisplayText('');
    setShowAll(false);
  }, [linesKey]);

  const toggleVoice = () => {
    if (isSpeaking && synthRef.current) { synthRef.current.cancel(); setIsSpeaking(false); }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleShowAll = () => {
    setShowAll(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (synthRef.current) synthRef.current.cancel();
  };

  if (allLines.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="relative glass-panel rounded-3xl p-8 overflow-hidden"
    >
      {/* Shimmer rings — appear before text starts */}
      <AnimatePresence>
        {!shimmerDone && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-cyan-400/20"
                initial={{ width: 60, height: 60, opacity: 0.5 }}
                animate={{ width: 60 + i * 60, height: 60 + i * 60, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        {/* Ghost icon */}
        <div className="flex justify-center mb-6 relative">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center relative"
            style={{ filter: 'blur(0.5px)', opacity: 0.6 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01M15 9h.01" />
            </svg>
            {isSpeaking && [1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-cyan-400/20"
                initial={{ width: 64, height: 64, opacity: 0.3 }}
                animate={{ width: 64 + i * 30, height: 64 + i * 30, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </motion.div>

          {speechSupported && (
            <button
              onClick={toggleVoice}
              className="absolute -right-2 -bottom-2 w-7 h-7 rounded-full bg-black/60 border border-cyan-500/20 flex items-center justify-center hover:border-cyan-500/40 transition-all"
              title={voiceEnabled ? 'Mute ghost voice' : 'Enable ghost voice'}
            >
              {voiceEnabled ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="text-center mb-4">
          <span className="text-[9px] font-mono text-cyan-400/60 tracking-[0.3em] uppercase">The Patient Speaks</span>
          {isSpeaking && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 text-[9px] font-mono text-cyan-500/60">
              ● VOICE ACTIVE
            </motion.span>
          )}
        </div>

        {/* Text display */}
        {showAll ? (
          <div className="space-y-3 max-w-2xl mx-auto">
            {allLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-cyan-200/70 text-sm leading-relaxed text-center font-light italic"
              >
                &ldquo;{line}&rdquo;
              </motion.p>
            ))}
          </div>
        ) : (
          <div className="min-h-[80px] flex items-center justify-center px-4">
            <p className="text-cyan-200/80 text-base sm:text-lg leading-relaxed max-w-2xl text-center font-light italic">
              &ldquo;{displayText}&rdquo;
              {isTyping && <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 animate-pulse" />}
            </p>
          </div>
        )}

        {/* Sound wave when speaking */}
        {isSpeaking && (
          <div className="flex justify-center items-end gap-0.5 h-6 mt-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i} className="w-0.5 bg-cyan-400/40 rounded-full"
                animate={{ height: [2, 6 + (i % 7) * 3, 2] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}

        {/* Line dots + Skip button */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <div className="flex gap-2">
            {allLines.map((_, i) => (
              <button
                key={i}
                onClick={() => { currentLineRef.current = i; setCurrentLine(i); setDisplayText(''); if (synthRef.current) synthRef.current.cancel(); setShowAll(false); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentLine ? 'bg-cyan-400 scale-150' :
                  i < currentLine ? 'bg-cyan-400/30' : 'bg-cyan-900/20'
                  }`}
              />
            ))}
          </div>
          {!showAll && (
            <button
              onClick={handleShowAll}
              className="text-[9px] font-mono text-cyan-400/50 hover:text-cyan-600/50 transition-colors ml-2"
            >
              Skip →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
