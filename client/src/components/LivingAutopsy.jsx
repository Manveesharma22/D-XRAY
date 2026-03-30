import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TYPEWRITER: Letter-by-letter, with a blinking cursor at the end ─────────
function Typewriter({ text, delay = 0, speed = 38, onComplete, className, style }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        indexRef.current = 0;
        let t;
        const start = setTimeout(() => {
            const tick = () => {
                if (indexRef.current < text.length) {
                    setDisplayed(text.slice(0, indexRef.current + 1));
                    indexRef.current++;
                    t = setTimeout(tick, speed);
                } else {
                    setDone(true);
                    onComplete?.();
                }
            };
            tick();
        }, delay);
        return () => { clearTimeout(start); clearTimeout(t); };
    }, [text, delay, speed]);

    return (
        <span className={className} style={style}>
            {displayed}
            {!done && <span className="opacity-70 animate-pulse">|</span>}
        </span>
    );
}

// ─── FLOATING DUST ────────────────────────────────────────────────────────────
const DUST = Array.from({ length: 34 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    dur: 10 + Math.random() * 18,
    del: Math.random() * 8,
    op: 0.03 + Math.random() * 0.10,
}));

function DustParticles() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {DUST.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`, top: `${p.y}%`,
                        width: p.size, height: p.size,
                        background: `rgba(245,210,150,${p.op})`,
                    }}
                    animate={{
                        y: [0, -50, -15, -70, 0],
                        x: [0, 10, -6, 15, 0],
                        opacity: [p.op, p.op * 2.2, p.op * 0.2, p.op * 1.8, p.op],
                    }}
                    transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

// ─── GHOST EKG: draws a flatline with a single ghost spike ───────────────────
function GhostEKG() {
    return (
        <div style={{ width: '100%', height: 28, marginBottom: 24, opacity: 0.22 }}>
            <svg width="100%" height="28" viewBox="0 0 700 28" preserveAspectRatio="none">
                <motion.path
                    d="M0,14 L200,14 L210,4 L218,24 L227,8 L235,20 L242,14 L700,14"
                    fill="none" stroke="rgba(245,158,11,0.6)" strokeWidth="1.2"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, delay: 0.4, ease: 'easeInOut' }}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }}
                />
                <motion.path
                    d="M0,14 L430,14 L438,11 L443,17 L448,14 L700,14"
                    fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8, delay: 2.8, ease: 'easeInOut' }}
                />
            </svg>
        </div>
    );
}

// ─── FILM SPROCKET HOLES ──────────────────────────────────────────────────────
function FilmEdge({ side }) {
    return (
        <div
            className="absolute top-0 bottom-0 flex flex-col justify-around pointer-events-none"
            style={{ [side]: 0, width: 22, padding: '16px 0', opacity: 0.07 }}
        >
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                    width: 10, height: 13, borderRadius: 2, margin: '0 auto',
                    background: 'rgba(245,200,120,0.9)',
                    border: '1px solid rgba(245,200,120,0.5)',
                }} />
            ))}
        </div>
    );
}

// ─── THE SHARE / COPY BUTTON ──────────────────────────────────────────────────
function ShareButton({ repoName, dxScore }) {
    const [copied, setCopied] = useState(false);

    const handleShare = useCallback(async () => {
        const text = `"This wasn't a failure of engineering. This was a failure of circumstance. The code was ready. The world wasn't."\n\n— DX-Ray Living Autopsy for ${repoName} (DX Score: ${dxScore})\nhttps://dx-ray.dev`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // fallback: open share UI
            if (navigator.share) navigator.share({ text });
        }
    }, [repoName, dxScore]);

    return (
        <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
                background: copied
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(245,158,11,0.05)',
                border: copied
                    ? '1px solid rgba(16,185,129,0.25)'
                    : '1px solid rgba(245,158,11,0.12)',
                borderRadius: 10,
                padding: '8px 18px',
                color: copied ? 'rgba(110,231,183,0.7)' : 'rgba(245,180,60,0.5)',
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span style={{ fontSize: 12 }}>{copied ? '✓' : '↗'}</span>
            {copied ? 'Copied to clipboard' : 'Share this finding'}
        </motion.button>
    );
}

// ─── COMPLETION RING ──────────────────────────────────────────────────────────
function CompletionRing({ value }) {
    const r = 28, cx = 32, cy = 32, circumf = 2 * Math.PI * r;
    const dashLen = (value / 100) * circumf;
    return (
        <div style={{ position: 'relative', width: 64, height: 64 }}>
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(245,158,11,0.06)" strokeWidth="3" />
                <motion.circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke="rgba(245,180,60,0.35)" strokeWidth="3"
                    strokeLinecap="round"
                    style={{ strokeDasharray: circumf }}
                    initial={{ strokeDashoffset: circumf }}
                    animate={{ strokeDashoffset: circumf - dashLen }}
                    transition={{ duration: 2, delay: 0.3, ease: 'easeOut' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                color: 'rgba(245,180,60,0.45)',
            }}>
                {value}%
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
/*
  PHASE SEQUENCE:
  0 → mount (hidden)
  1 → overlay darkens, film grain starts (200ms)
  2 → header / EKG draws in (900ms)
  3 → patient name resolves out of blur (1800ms)
  4 → vital stats, divider (2800ms)
  5 → "CAUSE OF DEATH" label appears (3800ms)
  6 → cause text types in (4100ms)
  7 → the sentence begins typewriting (5600ms)
  8 → stats + share button fade in (9200ms)
*/
export default function LivingAutopsy({ data }) {
    const [phase, setPhase] = useState(0);
    const [sentenceOneDone, setSentenceOneDone] = useState(false);
    const [sentence2Done, setSentence2Done] = useState(false);

    useEffect(() => {
        if (!data?.triggered) return;
        const t = [
            setTimeout(() => setPhase(1), 200),
            setTimeout(() => setPhase(2), 900),
            setTimeout(() => setPhase(3), 1800),
            setTimeout(() => setPhase(4), 2800),
            setTimeout(() => setPhase(5), 3800),
            setTimeout(() => setPhase(6), 4200),
            setTimeout(() => setPhase(7), 5800),
            setTimeout(() => setPhase(8), 9400),
        ];
        return () => t.forEach(clearTimeout);
    }, [data?.triggered]);

    if (!data?.triggered) return null;

    const lastCommitDate = data.lastCommit
        ? new Date(data.lastCommit).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;
    const yearsSilent = data.lastCommit
        ? Math.floor((Date.now() - new Date(data.lastCommit).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 0;
    const monthsSilent = data.silentDays ? Math.floor(data.silentDays / 30) : 0;
    const silentLabel = yearsSilent >= 1
        ? `${yearsSilent} year${yearsSilent > 1 ? 's' : ''} of silence`
        : `${monthsSilent} month${monthsSilent !== 1 ? 's' : ''} of silence`;

    const SENTENCE_1 = "This wasn't a failure of engineering.";
    const SENTENCE_2 = "This was a failure of circumstance.";
    const SENTENCE_3 = "The code was ready. The world wasn't.";

    return (
        <motion.div
            id="living-autopsy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="relative w-full overflow-hidden glass-panel"
            style={{
                minHeight: 620,
                borderRadius: 24,
                boxShadow: phase >= 7
                    ? '0 0 100px rgba(0,251,255,0.07), 0 0 280px rgba(0,251,255,0.03), inset 0 0 100px rgba(0,0,0,0.7)'
                    : '0 0 40px rgba(0,0,0,0.8)',
                transition: 'background 2.5s ease, box-shadow 2.5s ease',
            }}
        >
            {/* Film scan-line texture */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(245,158,11,0.010) 0px, transparent 1px, transparent 4px)',
                    opacity: phase >= 1 ? 1 : 0,
                    transition: 'opacity 2.5s ease',
                }}
            />

            {/* Radial spotlight — grows behind "the sentence" */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    width: '120%', paddingBottom: '80%',
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.045) 0%, transparent 65%)',
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: phase >= 7 ? 1 : 0, scale: phase >= 7 ? 1 : 0.6 }}
                transition={{ duration: 3, ease: 'easeOut' }}
            />

            <DustParticles />
            <FilmEdge side="left" />
            <FilmEdge side="right" />

            {/* Slow horizontal scan line */}
            <AnimatePresence>
                {phase >= 2 && (
                    <motion.div
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{
                            height: 1.5,
                            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.12), rgba(255,220,100,0.06), rgba(245,158,11,0.12), transparent)',
                            boxShadow: '0 0 18px rgba(245,158,11,0.08)',
                        }}
                        initial={{ top: '6%', opacity: 0 }}
                        animate={{ top: '94%', opacity: [0, 0.55, 0.55, 0] }}
                        transition={{ duration: 7, delay: 0.3, ease: 'easeInOut' }}
                    />
                )}
            </AnimatePresence>

            {/* ── CONTENT ── */}
            <div className="relative z-10 max-w-2xl mx-auto px-8 py-14 text-center flex flex-col items-center">

                {/* HEADER — POST-MORTEM label + ghost EKG */}
                <AnimatePresence>
                    {phase >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2 }}
                            className="w-full mb-8"
                        >
                            <div className="font-technical font-bold tracking-[0.6em] uppercase text-amber-500/10 mb-4">
                                ──────  Post-Mortem_Diagnostic_Log  ──────
                            </div>
                            <GhostEKG />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PATIENT NAME */}
                <AnimatePresence>
                    {phase >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 1.6 }}
                            className="mb-2 w-full"
                        >
                            <div className="text-[10px] font-technical tracking-[0.4em] uppercase text-cyan-500/20 mb-1">
                                Patient_Subject
                            </div>
                            <div className="text-3xl font-bold font-technical tracking-tighter text-white group-hover:text-cyan-400 transition-colors holographic-bloom">
                                {data.repoName}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* VITAL STATS */}
                <AnimatePresence>
                    {phase >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="mb-10 w-full"
                        >
                            <div className="text-[10px] font-technical tracking-[0.2em] text-cyan-600/30 mb-5 leading-relaxed uppercase">
                                {lastCommitDate && <span>Last_Signal: {lastCommitDate}</span>}
                                {data.totalCommits ? <span>  ·  {data.totalCommits}_Commits</span> : null}
                                {data.peakContributors > 1 ? <span>  ·  {data.peakContributors}_Subjects</span> : null}
                                {data.silentDays > 30 ? <span>  ·  {silentLabel}</span> : null}
                            </div>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1.4, ease: 'easeOut' }}
                                style={{
                                    height: 1, width: 100, margin: '0 auto',
                                    background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.18), transparent)',
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── CAUSE OF DEATH ── */}
                <AnimatePresence>
                    {phase >= 5 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="mb-12 w-full"
                        >
                            <div style={{
                                fontSize: 9, fontFamily: 'monospace',
                                letterSpacing: '0.45em', textTransform: 'uppercase',
                                color: 'rgba(245,158,11,0.18)', marginBottom: 10,
                            }}>
                                Cause of Death
                            </div>

                            {phase >= 6 && (
                                <div className="text-xl font-bold font-technical tracking-tight text-amber-400 holographic-bloom">
                                    <Typewriter
                                        text="EXTERNAL_FORCES. NOT_SYSTEM_LOGIC."
                                        delay={0}
                                        speed={42}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══════════════════════════════════════════════════
                    THE SENTENCE
                    This is the reason people will screenshot DX-Ray.
                    It must land like a verdict carved into stone.
                    ══════════════════════════════════════════════════ */}
                <AnimatePresence>
                    {phase >= 7 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full mb-14"
                        >
                            {/* Glow halo */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)',
                                    transform: 'scale(1.5)',
                                }}
                            />

                            {/* Opening quote mark */}
                            <div style={{
                                fontSize: 48, lineHeight: 1, color: 'rgba(245,158,11,0.08)',
                                fontFamily: 'Georgia, serif', marginBottom: -8,
                                textAlign: 'left', paddingLeft: 8,
                            }}>
                                "
                            </div>

                            <p style={{
                                position: 'relative',
                                fontSize: 'clamp(18px, 2.6vw, 24px)',
                                fontFamily: "'Georgia', 'Times New Roman', serif",
                                fontStyle: 'italic',
                                fontWeight: 400,
                                lineHeight: 1.75,
                                letterSpacing: '0.012em',
                                color: 'rgba(255,242,210,0.0)',  // transparent placeholder
                                textShadow: 'none',
                                minHeight: 120,
                            }}>
                                {/* Line 1 */}
                                <span style={{
                                    display: 'block',
                                    color: 'rgba(255,242,210,0.78)',
                                    textShadow: '0 0 30px rgba(245,158,11,0.18)',
                                }}>
                                    <Typewriter
                                        text={SENTENCE_1}
                                        delay={100}
                                        speed={36}
                                        onComplete={() => setSentenceOneDone(true)}
                                    />
                                </span>

                                {/* Line 2 — starts after line 1 finishes */}
                                {sentenceOneDone && (
                                    <span style={{
                                        display: 'block',
                                        color: 'rgba(255,242,210,0.78)',
                                        textShadow: '0 0 30px rgba(245,158,11,0.18)',
                                        marginTop: 4,
                                    }}>
                                        <Typewriter
                                            text={SENTENCE_2}
                                            delay={200}
                                            speed={36}
                                            onComplete={() => setSentence2Done(true)}
                                        />
                                    </span>
                                )}

                                {/* Line 3 — the crescendo — slightly brighter */}
                                {sentence2Done && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        style={{
                                            display: 'block',
                                            marginTop: 16,
                                            color: 'rgba(255,248,220,0.94)',
                                            textShadow: '0 0 40px rgba(245,200,80,0.38), 0 0 80px rgba(245,158,11,0.15)',
                                        }}
                                    >
                                        <Typewriter
                                            text={SENTENCE_3}
                                            delay={100}
                                            speed={40}
                                        />
                                    </motion.span>
                                )}
                            </p>

                            {/* Closing quote mark */}
                            {sentence2Done && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.5, duration: 1 }}
                                    style={{
                                        fontSize: 48, lineHeight: 1, color: 'rgba(245,158,11,0.08)',
                                        fontFamily: 'Georgia, serif', marginTop: -8,
                                        textAlign: 'right', paddingRight: 8,
                                    }}
                                >
                                    "
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── FOOTER: stats + evidence + share ── */}
                <AnimatePresence>
                    {phase >= 8 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.8 }}
                            className="w-full"
                            style={{ borderTop: '1px solid rgba(245,158,11,0.05)', paddingTop: 28 }}
                        >
                            {/* Score ring row */}
                            {data.dxScore !== undefined && (
                                <div className="flex justify-center items-center gap-12 mb-7">
                                    {/* DX Score */}
                                    <div className="text-center">
                                        <div style={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.18)', marginBottom: 6 }}>
                                            DX Score
                                        </div>
                                        <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: 'rgba(245,180,60,0.38)', textShadow: '0 0 14px rgba(245,158,11,0.12)' }}>
                                            {data.dxScore}
                                        </div>
                                    </div>

                                    {/* Completion ring */}
                                    {data.completionProxy !== undefined && (
                                        <div className="text-center">
                                            <div style={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.18)', marginBottom: 6 }}>
                                                % Complete
                                            </div>
                                            <CompletionRing value={data.completionProxy} />
                                        </div>
                                    )}

                                    {/* Verdict */}
                                    <div className="text-center">
                                        <div style={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.18)', marginBottom: 6 }}>
                                            Verdict
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: 'rgba(245,180,60,0.32)', lineHeight: 1.7 }}>
                                            Code: Ready<br />World: Wasn't
                                        </div>
                                    </div>

                                    {/* Passion score */}
                                    {data.passionScore && (
                                        <div className="text-center">
                                            <div style={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.18)', marginBottom: 6 }}>
                                                Passion Index
                                            </div>
                                            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: 'rgba(245,200,80,0.38)', textShadow: '0 0 14px rgba(245,158,11,0.12)' }}>
                                                {data.passionScore}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Evidence tags */}
                            {data.passionSignals?.length > 0 && (
                                <div className="mb-7">
                                    <div style={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.11)', marginBottom: 10 }}>
                                        Evidence of ambition
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {data.passionSignals.map((s, i) => (
                                            <motion.span
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                                style={{
                                                    fontSize: 9, fontFamily: 'monospace',
                                                    padding: '4px 10px', borderRadius: 6,
                                                    color: 'rgba(245,180,60,0.28)',
                                                    background: 'rgba(245,158,11,0.03)',
                                                    border: '1px solid rgba(245,158,11,0.07)',
                                                }}
                                            >
                                                {s}
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share button */}
                            <div className="flex justify-center mb-8">
                                <ShareButton repoName={data.repoName} dxScore={data.dxScore} />
                            </div>

                            {/* End of report */}
                            <div style={{
                                fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.35em',
                                textTransform: 'uppercase', color: 'rgba(245,158,11,0.08)',
                            }}>
                                ── End of Report ──
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
