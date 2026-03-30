import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CodebaseObituary
 * The full obituary surface for an abandoned repository.
 * Dark. Cinematic. All data sourced from real GitHub signals.
 */

function TypewriterParagraph({ text, delay = 0, speed = 18 }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, indexRef.current + 1));
                indexRef.current++;
                if (indexRef.current >= text.length) {
                    clearInterval(interval);
                    setDone(true);
                }
            }, speed);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay, speed]);

    return (
        <span>
            {displayed}
            {!done && <span className="obit-cursor">|</span>}
        </span>
    );
}

function FlowerIcon({ filled = false }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#f9a8d4' : 'none'} stroke={filled ? '#f9a8d4' : '#9d4e6e'} strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <ellipse cx="12" cy="6" rx="2" ry="3" />
            <ellipse cx="12" cy="18" rx="2" ry="3" />
            <ellipse cx="6" cy="12" rx="3" ry="2" />
            <ellipse cx="18" cy="12" rx="3" ry="2" />
            <ellipse cx="7.8" cy="7.8" rx="2" ry="3" transform="rotate(-45 7.8 7.8)" />
            <ellipse cx="16.2" cy="16.2" rx="2" ry="3" transform="rotate(-45 16.2 16.2)" />
            <ellipse cx="16.2" cy="7.8" rx="2" ry="3" transform="rotate(45 16.2 7.8)" />
            <ellipse cx="7.8" cy="16.2" rx="2" ry="3" transform="rotate(45 7.8 16.2)" />
        </svg>
    );
}

function MemorialWall({ repoSlug, obituary }) {
    const [flowers, setFlowers] = useState([]);
    const [count, setCount] = useState(0);
    const [handle, setHandle] = useState('');
    const [leaving, setLeaving] = useState(false);
    const [leftFlower, setLeftFlower] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!repoSlug) return;
        fetch(`http://localhost:3001/api/memorial/${repoSlug}`)
            .then(r => r.json())
            .then(data => {
                setFlowers(data.flowers || []);
                setCount(data.count || 0);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, [repoSlug]);

    const leaveFlower = async () => {
        if (!repoSlug || leaving) return;
        setLeaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/memorial/${repoSlug}/flower`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle: handle.replace('@', '').trim() || 'anonymous' })
            });
            const data = await res.json();
            setFlowers(data.flowers || []);
            setCount(data.count || 0);
            setLeftFlower(true);
            setShowInput(false);
        } catch (e) { console.error('Flower failed:', e); }
        setLeaving(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
                borderTop: '1px solid rgba(157, 78, 110, 0.2)',
                paddingTop: 32,
                marginTop: 40,
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.5)', marginBottom: 12 }}>
                    Memorial Wall
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,220,235,0.4)', fontStyle: 'italic', marginBottom: 20 }}>
                    {count > 0
                        ? `${count} ${count === 1 ? 'person has' : 'people have'} left a flower here.`
                        : 'No flowers yet. Be the first to acknowledge it existed.'}
                </div>

                {/* Flower row */}
                {flowers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 }}
                    >
                        {flowers.slice(-30).map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                                title={`@${f.handle}`}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                            >
                                <FlowerIcon filled />
                                <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(249,168,212,0.4)', maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    @{f.handle}
                                </span>
                            </motion.div>
                        ))}
                        {count > 30 && (
                            <div style={{ fontSize: 10, color: 'rgba(157,78,110,0.4)', fontFamily: 'monospace', alignSelf: 'center' }}>+{count - 30} more</div>
                        )}
                    </motion.div>
                )}

                {/* Leave a flower */}
                <AnimatePresence>
                    {!leftFlower && !showInput && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInput(true)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '10px 28px',
                                background: 'transparent',
                                border: '1px solid rgba(157,78,110,0.35)',
                                borderRadius: 40,
                                color: 'rgba(249,168,212,0.8)',
                                fontSize: 13,
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                letterSpacing: '0.05em',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(157,78,110,0.1)'; e.currentTarget.style.borderColor = 'rgba(157,78,110,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(157,78,110,0.35)'; }}
                        >
                            <FlowerIcon />
                            Leave a flower
                        </motion.button>
                    )}

                    {!leftFlower && showInput && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}
                        >
                            <input
                                type="text"
                                value={handle}
                                onChange={e => setHandle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && leaveFlower()}
                                placeholder="@your-github-handle (optional)"
                                style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(157,78,110,0.3)',
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                    color: 'rgba(255,220,235,0.8)',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                    minWidth: 220,
                                }}
                            />
                            <button
                                onClick={leaveFlower}
                                disabled={leaving}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 20px',
                                    background: 'rgba(157,78,110,0.15)',
                                    border: '1px solid rgba(157,78,110,0.4)',
                                    borderRadius: 8,
                                    color: 'rgba(249,168,212,0.9)',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    cursor: leaving ? 'not-allowed' : 'pointer',
                                    opacity: leaving ? 0.5 : 1,
                                }}
                            >
                                <FlowerIcon filled />
                                {leaving ? 'Leaving...' : 'Leave'}
                            </button>
                            <button
                                onClick={() => setShowInput(false)}
                                style={{ background: 'none', border: 'none', color: 'rgba(157,78,110,0.4)', cursor: 'pointer', fontSize: 11 }}
                            >
                                cancel
                            </button>
                        </motion.div>
                    )}

                    {leftFlower && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ color: 'rgba(249,168,212,0.7)', fontSize: 13, fontFamily: 'monospace', fontStyle: 'italic' }}
                        >
                            🌸 Your flower was left. It will stay here.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function CodebaseObituary({ data }) {
    const [paragraphsVisible, setParagraphsVisible] = useState([]);
    const [repoSlug, setRepoSlug] = useState('');

    if (!data || !data.isAbandoned) return null;

    useEffect(() => {
        // Reveal paragraphs one at a time with staggered delays
        const timers = [];
        data.paragraphs?.forEach((_, i) => {
            timers.push(setTimeout(() => {
                setParagraphsVisible(prev => [...prev, i]);
            }, 800 + i * 2800));
        });
        // Build repo slug for memorial wall
        if (data.fullName) {
            setRepoSlug(data.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        }
        return () => timers.forEach(clearTimeout);
    }, [data]);

    const daysSince = data.daysSinceDeath || 0;
    const yearsGone = Math.floor(daysSince / 365);
    const monthsGone = Math.floor((daysSince % 365) / 30);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(30,10,18,0.98) 0%, rgba(5,0,8,0.99) 100%)',
                border: '2px solid rgba(80,20,40,0.6)',
                boxShadow: '0 0 0 1px rgba(157,78,110,0.08), 0 0 60px rgba(80,20,40,0.3), inset 0 0 80px rgba(0,0,0,0.5)',
                marginTop: 32,
                marginBottom: 32,
            }}
        >
            {/* Mourning border — animated shimmer */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none', zIndex: 0,
                background: 'linear-gradient(135deg, rgba(157,78,110,0.04) 0%, transparent 50%, rgba(157,78,110,0.03) 100%)',
            }} />

            {/* Mourning corner ornaments */}
            {[
                { top: 12, left: 12 },
                { top: 12, right: 12 },
                { bottom: 12, left: 12 },
                { bottom: 12, right: 12 },
            ].map((pos, i) => (
                <div key={i} style={{ position: 'absolute', ...pos, width: 20, height: 20, pointerEvents: 'none', zIndex: 1 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path d="M0 8 L0 0 L8 0" stroke="rgba(157,78,110,0.3)" strokeWidth="1" fill="none" />
                    </svg>
                </div>
            ))}

            <div style={{ position: 'relative', zIndex: 2, padding: '60px 48px 48px' }}>

                {/* Spotlight header */}
                <div style={{ textAlign: 'center', marginBottom: 52 }}>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                    >
                        {/* Candle / memorial icon */}
                        <div style={{ marginBottom: 24 }}>
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ display: 'inline-block' }}
                            >
                                <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                                    {/* Flame */}
                                    <motion.ellipse
                                        cx="14" cy="6" rx="4" ry="6"
                                        fill="rgba(249,168,212,0.5)"
                                        animate={{ ry: [5, 7, 5], cy: [6, 5, 6] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    <motion.ellipse
                                        cx="14" cy="7" rx="2" ry="4"
                                        fill="rgba(255,240,200,0.8)"
                                        animate={{ ry: [3, 5, 3] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    {/* Wick */}
                                    <line x1="14" y1="12" x2="14" y2="15" stroke="rgba(100,60,80,0.8)" strokeWidth="1.5" />
                                    {/* Candle body */}
                                    <rect x="8" y="14" width="12" height="20" rx="2" fill="rgba(40,15,25,0.9)" stroke="rgba(157,78,110,0.3)" strokeWidth="1" />
                                    <rect x="6" y="32" width="16" height="4" rx="1" fill="rgba(30,10,18,0.9)" stroke="rgba(157,78,110,0.2)" strokeWidth="1" />
                                </svg>
                            </motion.div>
                        </div>

                        <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.55em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.45)', marginBottom: 16 }}>
                            In Memoriam
                        </div>

                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1.5 }}
                            style={{
                                fontSize: 'clamp(28px, 5vw, 44px)',
                                fontFamily: "'Georgia', 'Times New Roman', serif",
                                fontStyle: 'italic',
                                fontWeight: 400,
                                color: 'rgba(255,235,245,0.85)',
                                letterSpacing: '0.02em',
                                lineHeight: 1.2,
                                textShadow: '0 0 40px rgba(157,78,110,0.2)',
                                marginBottom: 12,
                            }}
                        >
                            {data.repoName}
                        </motion.h2>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.9, duration: 1.4, ease: 'easeOut' }}
                            style={{
                                height: 1, width: 160, margin: '16px auto',
                                background: 'linear-gradient(90deg, transparent, rgba(157,78,110,0.3), transparent)',
                            }}
                        />

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                            style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 4 }}>Age</div>
                                <div style={{ fontSize: 14, color: 'rgba(255,220,235,0.6)', fontFamily: 'monospace' }}>{data.ageString}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 4 }}>Passed</div>
                                <div style={{ fontSize: 14, color: 'rgba(255,220,235,0.6)', fontFamily: 'monospace' }}>{data.deadDateString}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 4 }}>Silent For</div>
                                <div style={{ fontSize: 14, color: 'rgba(255,220,235,0.6)', fontFamily: 'monospace' }}>
                                    {yearsGone > 0 ? `${yearsGone}y ` : ''}{monthsGone > 0 ? `${monthsGone}mo ` : ''}{daysSince % 30}d
                                </div>
                            </div>
                            {data.language && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 4 }}>Language</div>
                                    <div style={{ fontSize: 14, color: 'rgba(255,220,235,0.6)', fontFamily: 'monospace' }}>{data.language}</div>
                                </div>
                            )}
                            {data.archived && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 4 }}>Status</div>
                                    <div style={{ fontSize: 11, color: 'rgba(249,168,212,0.5)', fontFamily: 'monospace', border: '1px solid rgba(157,78,110,0.2)', borderRadius: 4, padding: '2px 8px' }}>Archived</div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Eulogy paragraphs — typewriter reveal */}
                <div style={{ maxWidth: 680, margin: '0 auto', marginBottom: 48 }}>
                    {data.paragraphs?.map((para, i) => (
                        <AnimatePresence key={i}>
                            {paragraphsVisible.includes(i) && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        fontFamily: "'Georgia', 'Times New Roman', serif",
                                        fontSize: 'clamp(15px, 2vw, 17px)',
                                        lineHeight: 1.85,
                                        color: i === (data.paragraphs.length - 1)
                                            ? 'rgba(255,200,220,0.55)'  // closing line — softer
                                            : 'rgba(255,225,238,0.72)',
                                        fontStyle: i === (data.paragraphs.length - 1) ? 'italic' : 'normal',
                                        marginBottom: 28,
                                        paddingBottom: i < data.paragraphs.length - 1 ? 0 : 0,
                                    }}
                                >
                                    <TypewriterParagraph text={para} delay={0} speed={12} />
                                </motion.p>
                            )}
                        </AnimatePresence>
                    ))}
                </div>

                {/* Stats strip — real data */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    style={{
                        borderTop: '1px solid rgba(157,78,110,0.12)',
                        borderBottom: '1px solid rgba(157,78,110,0.12)',
                        padding: '20px 0',
                        marginBottom: 40,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 40,
                        flexWrap: 'wrap',
                    }}
                >
                    {[
                        { label: 'Contributors', value: data.contributorCount || 0, suffix: '' },
                        { label: 'Open Issues', value: (data.openIssues || 0).toLocaleString(), suffix: '' },
                        { label: 'Stars', value: (data.stars || 0).toLocaleString(), suffix: '' },
                        { label: 'Forks', value: (data.forks || 0).toLocaleString(), suffix: '' },
                    ].map(({ label, value, suffix }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,200,220,0.6)', fontFamily: 'monospace' }}>{value}{suffix}</div>
                            <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(157,78,110,0.4)', textTransform: 'uppercase', letterSpacing: '0.35em', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Cause of death */}
                {data.causeString && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                        style={{ textAlign: 'center', marginBottom: 40 }}
                    >
                        <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 8 }}>
                            Cause of Death
                        </div>
                        <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,180,200,0.45)', fontStyle: 'italic' }}>
                            {data.causeString}
                        </div>
                    </motion.div>
                )}

                {/* Survival events */}
                {data.survivalEvents?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        style={{ textAlign: 'center', marginBottom: 40 }}
                    >
                        <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 10 }}>
                            It Survived
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {data.survivalEvents.map((ev, i) => (
                                <span key={i} style={{
                                    fontSize: 11, fontFamily: 'monospace',
                                    color: 'rgba(255,180,200,0.4)',
                                    border: '1px solid rgba(157,78,110,0.18)',
                                    borderRadius: 4,
                                    padding: '3px 10px',
                                }}>
                                    {ev}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* The loyal one badge */}
                {data.loyalOne && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 2 }}
                        style={{
                            textAlign: 'center',
                            marginBottom: 40,
                            padding: '16px 24px',
                            background: 'rgba(157,78,110,0.05)',
                            border: '1px solid rgba(157,78,110,0.12)',
                            borderRadius: 12,
                        }}
                    >
                        <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 8 }}>
                            The Loyal One
                        </div>
                        <div style={{ fontSize: 15, color: 'rgba(255,200,220,0.65)', fontFamily: 'monospace' }}>
                            @{data.loyalOne.login}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(157,78,110,0.4)', fontFamily: 'monospace', marginTop: 4 }}>
                            Committed across ~{data.loyalOne.weeks} separate weeks. Even after the momentum was gone.
                        </div>
                    </motion.div>
                )}

                {/* Last commit */}
                {data.lastCommitMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                        style={{ textAlign: 'center', marginBottom: 48 }}
                    >
                        <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(157,78,110,0.35)', marginBottom: 8 }}>
                            Final Words
                        </div>
                        <div style={{
                            fontSize: 13, fontFamily: 'monospace',
                            color: 'rgba(255,200,220,0.5)',
                            fontStyle: 'italic',
                            padding: '12px 24px',
                            border: '1px solid rgba(157,78,110,0.12)',
                            borderRadius: 8,
                            display: 'inline-block',
                            background: 'rgba(0,0,0,0.2)',
                        }}>
                            "{data.lastCommitMessage}"
                        </div>
                        {data.lastCommitAuthor && (
                            <div style={{ fontSize: 10, color: 'rgba(157,78,110,0.3)', fontFamily: 'monospace', marginTop: 6 }}>
                                — @{data.lastCommitAuthor}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Memorial Wall */}
                <MemorialWall repoSlug={repoSlug} obituary={data} />

            </div>
        </motion.div>
    );
}
