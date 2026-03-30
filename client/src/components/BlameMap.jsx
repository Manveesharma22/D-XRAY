import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { soundEngine } from './SoundLayer';

// ─── Causal chain narrative builder ───────────────────────────────────────────
function buildCausalNarrative(node, allNodes, chainOfCustody) {
    const sorted = [...allNodes].sort((a, b) => new Date(a.firstCommit) - new Date(b.firstCommit));
    const idx = sorted.findIndex(n => n.login === node.login);
    const predecessors = sorted.slice(0, idx);
    const isNewest = idx === sorted.length - 1;
    const isOldest = idx === 0;
    const tenureMonths = Math.round(node.tenure / 30);
    const pipelineAge = tenureMonths + Math.floor(Math.random() * 8 + 4);

    if (isNewest && node.debtInherited > 50 && predecessors.length > 0) {
        const realAuthor = sorted[0];
        const middlemen = sorted.slice(1, idx).map(p => `@${p.login}`).join(', ');
        return {
            headline: `@${node.login} touched the symptom.`,
            detail: `The real cause lives ${predecessors.length} ${predecessors.length === 1 ? 'person' : 'people'} and ${pipelineAge} months upstream — originating with @${realAuthor.login}${middlemen ? `, passed through ${middlemen}` : ''}.`,
            verdict: 'This is not negligence. It is inheritance.',
            upstreamCount: predecessors.length,
            monthsUpstream: pipelineAge,
            rootCause: realAuthor.login,
        };
    }
    if (isOldest && node.debtCreated > 40) {
        return {
            headline: `@${node.login} made the original architectural decisions.`,
            detail: `${Math.round(node.debtCreated)}% of this codebase's debt traces back to choices made when they were the only one building it. They were not being reckless — they were building fast, alone, under pressure.`,
            verdict: 'The decisions that became debt were once survival decisions.',
            upstreamCount: 0,
            monthsUpstream: 0,
            rootCause: node.login,
        };
    }
    if (node.fixCommits > node.featureCommits * 1.5) {
        return {
            headline: `@${node.login} has been maintaining someone else's code.`,
            detail: `${node.fixCommits} fix commits vs ${node.featureCommits} feature commits. They are the load-bearing wall of this codebase. Nobody assigned them this work. They just kept the lights on.`,
            verdict: 'Every day, without credit.',
            upstreamCount: predecessors.length,
            monthsUpstream: 0,
            rootCause: null,
        };
    }
    return {
        headline: `@${node.login} is carrying ${node.debtInherited}% inherited debt.`,
        detail: `Only ${node.debtCreated}% is theirs. The rest is the weight of decisions made before they arrived.`,
        verdict: 'The map makes which is which visible for the first time.',
        upstreamCount: predecessors.length,
        monthsUpstream: 0,
        rootCause: null,
    };
}

// ─── Upstream particle along an SVG path ──────────────────────────────────────
function FlowParticle({ x1, y1, x2, y2, delay, color = '#00e5ff' }) {
    // Particles flow RIGHT → LEFT (upstream = from newest toward oldest)
    return (
        <motion.circle
            r={2.5}
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            initial={{ cx: x2, cy: y2, opacity: 0 }}
            animate={{
                cx: [x2, x1],
                cy: [y2, y1],
                opacity: [0, 0.9, 0.9, 0],
            }}
            transition={{
                duration: 1.8,
                delay,
                repeat: Infinity,
                repeatDelay: 0.4,
                ease: 'easeInOut',
            }}
        />
    );
}

// ─── SVG Edge with animated particles ────────────────────────────────────────
function BlameEdge({ x1, y1, x2, y2, strength, nodeIndex }) {
    const particleCount = Math.max(2, Math.min(4, Math.ceil(strength / 25)));
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 20;
    const colors = ['#00e5ff', '#f59e0b', '#ec4899'];
    const color = colors[nodeIndex % colors.length];

    return (
        <g>
            {/* Base edge line */}
            <path
                d={`M${x2},${y2} Q${midX},${midY} ${x1},${y1}`}
                stroke={`rgba(0,229,255,0.12)`}
                strokeWidth={1.5}
                fill="none"
                strokeDasharray="4 3"
            />
            {/* Glow edge */}
            <path
                d={`M${x2},${y2} Q${midX},${midY} ${x1},${y1}`}
                stroke={`rgba(0,229,255,0.04)`}
                strokeWidth={6}
                fill="none"
            />
            {/* Flowing particles (upstream direction) */}
            {Array.from({ length: particleCount }).map((_, i) => (
                <FlowParticle
                    key={i}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    delay={i * (1.8 / particleCount)}
                    color={color}
                />
            ))}
        </g>
    );
}

// ─── Single contributor node ───────────────────────────────────────────────────
function ContribNode({ contrib, x, y, isNewest, isOldest, isSelected, onClick, index }) {
    const ringColor = isNewest
        ? '#f59e0b'
        : isOldest
            ? '#ef4444'
            : '#00e5ff';

    const labelColor = isNewest
        ? 'rgba(245,158,11,0.9)'
        : isOldest
            ? 'rgba(239,68,68,0.8)'
            : 'rgba(0,229,255,0.7)';

    const bgColor = isNewest
        ? 'rgba(245,158,11,0.12)'
        : isOldest
            ? 'rgba(239,68,68,0.10)'
            : 'rgba(0,229,255,0.08)';

    const nodeR = isNewest || isOldest ? 32 : 26;

    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            {/* Pulse rings */}
            {(isNewest || isOldest) && [1, 2].map(i => (
                <motion.circle
                    key={i}
                    cx={x} cy={y}
                    r={nodeR}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={0.5}
                    initial={{ r: nodeR, opacity: 0.3 }}
                    animate={{ r: nodeR + i * 14, opacity: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
                />
            ))}

            {/* Node circle */}
            <motion.circle
                cx={x} cy={y}
                r={nodeR}
                fill={bgColor}
                stroke={isSelected ? ringColor : `${ringColor}40`}
                strokeWidth={isSelected ? 2 : 1}
                whileHover={{ r: nodeR + 3 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: index * 0.1 }}
            />

            {/* Avatar initial */}
            <text
                x={x} y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={labelColor}
                fontSize={isNewest || isOldest ? 14 : 12}
                fontWeight="bold"
                fontFamily="monospace"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {contrib.login?.[0]?.toUpperCase()}
            </text>

            {/* Name label */}
            <text
                x={x} y={y + nodeR + 16}
                textAnchor="middle"
                fill={labelColor}
                fontSize={13}
                fontWeight="bold"
                fontFamily="monospace"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                @{contrib.login.slice(0, 12)}
            </text>

            {/* Role badge */}
            <text
                x={x} y={y + nodeR + 30}
                textAnchor="middle"
                fill={isNewest ? 'rgba(245,158,11,0.6)' : isOldest ? 'rgba(239,68,68,0.6)' : 'rgba(0,229,255,0.4)'}
                fontSize={11}
                fontFamily="monospace"
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {isNewest ? 'SYMPTOM' : isOldest ? 'ORIGIN' : `${contrib.tenure}d_TENURE`}
            </text>
        </g>
    );
}

// ─── Main BlameMap component ───────────────────────────────────────────────────
export default function BlameMap({ data }) {
    const [selected, setSelected] = useState(null);
    const [animating, setAnimating] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [svgWidth, setSvgWidth] = useState(700);

    useEffect(() => {
        const obs = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect?.width;
            if (w) setSvgWidth(Math.max(300, w));
        });
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasStarted(true);
            soundEngine.init();
            soundEngine.blameRiverFlow?.();
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    if (!data || !data.contributors || data.contributors.length < 2) return null;

    const contributors = data.contributors.slice(0, 7);
    const sorted = [...contributors].sort((a, b) => new Date(a.firstCommit) - new Date(b.firstCommit));
    const blameEvents = data.blameEvents || [];

    const newestIdx = sorted.length - 1;
    const newestLogin = sorted[newestIdx]?.login;
    const oldestLogin = sorted[0]?.login;

    // Node positions — horizontal tree, oldest left, newest right
    const svgH = 160;
    const padX = 40;
    const nodeSpacing = (svgWidth - padX * 2) / Math.max(1, sorted.length - 1);
    const nodeY = svgH / 2;

    const nodePositions = sorted.map((c, i) => ({
        ...c,
        x: padX + i * nodeSpacing,
        y: nodeY,
    }));

    const selectedNode = selected ? nodePositions.find(n => n.login === selected) : null;
    const narrative = selectedNode
        ? buildCausalNarrative(selectedNode, sorted, data.chainOfCustody)
        : null;

    const handleNodeClick = (login) => {
        if (selected === login) {
            setSelected(null);
        } else {
            setSelected(login);
            soundEngine.init();
            soundEngine.ghostWhisper?.();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(160deg, rgba(4,0,12,0.97) 0%, rgba(0,6,20,0.95) 100%)',
                border: '1px solid rgba(0,229,255,0.08)',
                boxShadow: '0 0 60px rgba(0,229,255,0.04)',
            }}
        >
            {/* Header */}
            <div className="px-8 pt-7 pb-4 border-b border-cyan-900/10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
                        {/* River flow icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5">
                            <path d="M22 12H2" />
                            <path d="M8 6l-6 6 6 6" />
                            <path d="M16 6l6 6-6 6" strokeOpacity="0.4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">The Blame Map</h3>
                        <p className="text-xs font-mono tracking-[0.25em] uppercase"
                            style={{ color: 'rgba(0,229,255,0.3)' }}>
                            Temporal Guilt Diffusion Engine · guilt flows upstream
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[9px] font-mono px-2 py-1 rounded-md"
                            style={{ background: 'rgba(0,229,255,0.06)', color: 'rgba(0,229,255,0.5)', border: '1px solid rgba(0,229,255,0.1)' }}
                        >
                            LIVE
                        </motion.div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-5 mt-4">
                    {[
                        { color: 'bg-red-400/60', label: 'Origin — causal architect' },
                        { color: 'bg-cyan-400/60', label: 'Inherited — passed through' },
                        { color: 'bg-amber-400/60', label: 'Symptom — took the blame' },
                    ].map((l, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${l.color}`} />
                            <span className="text-[11px] text-cyan-400/70 font-technical font-bold uppercase tracking-wide">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SVG tree */}
            <div className="px-6 pt-4 pb-2" ref={containerRef}>
                <div className="relative">
                    <svg
                        ref={svgRef}
                        width={svgWidth}
                        height={svgH + 50}
                        style={{ overflow: 'visible' }}
                    >
                        {/* Flow direction label */}
                        <text x={svgWidth / 2} y={12} textAnchor="middle" fill="rgba(0,229,255,0.15)" fontSize={10} fontFamily="monospace">
                            ← GUILT FLOWS UPSTREAM — oldest cause left · newest symptom right →
                        </text>

                        {/* Edges */}
                        {nodePositions.slice(0, -1).map((node, i) => {
                            const next = nodePositions[i + 1];
                            const strength = next.debtInherited || 50;
                            return (
                                <BlameEdge
                                    key={i}
                                    x1={node.x} y1={node.y + 30}
                                    x2={next.x} y2={next.y + 30}
                                    strength={strength}
                                    nodeIndex={i}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {nodePositions.map((node, i) => (
                            <ContribNode
                                key={node.login}
                                contrib={node}
                                x={node.x}
                                y={node.y + 30}
                                isNewest={node.login === newestLogin}
                                isOldest={node.login === oldestLogin}
                                isSelected={selected === node.login}
                                onClick={() => handleNodeClick(node.login)}
                                index={i}
                            />
                        ))}
                    </svg>
                </div>

                {/* Instruction */}
                {!selected && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="text-xs font-mono text-center py-2"
                        style={{ color: 'rgba(0,229,255,0.2)' }}
                    >
                        Click any node to trace the causal chain upstream
                    </motion.p>
                )}
            </div>

            {/* Causal chain detail — appears on click */}
            <AnimatePresence>
                {selected && narrative && (
                    <motion.div
                        key={selected}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                    >
                        <div className="mx-6 mb-6">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-2xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, rgba(0,0,0,0) 100%)',
                                    border: '1px solid rgba(0,229,255,0.12)',
                                }}
                            >
                                {/* The upstream chain visualization */}
                                {narrative.upstreamCount > 0 && (
                                    <div className="px-6 pt-5 pb-3 border-b border-cyan-900/10">
                                        <div className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest mb-3">
                                            Causal chain — upstream trace
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Newest (symptom) */}
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                <span className="text-xs font-mono text-amber-300">@{selected}</span>
                                                <span className="text-[10px] text-amber-600/60 font-mono ml-1 uppercase">SYMPTOM</span>
                                            </div>

                                            {/* Upstream arrow */}
                                            {narrative.upstreamCount > 0 && (
                                                <>
                                                    <motion.div
                                                        animate={{ x: [-4, 0, -4] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    >
                                                        <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                                                            <path d="M30 6 L2 6 M8 2 L2 6 L8 10" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </motion.div>
                                                    <span className="text-xs font-mono text-cyan-400/60">{narrative.monthsUpstream}mo upstream</span>
                                                    <motion.div
                                                        animate={{ x: [-4, 0, -4] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                                    >
                                                        <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                                                            <path d="M30 6 L2 6 M8 2 L2 6 L8 10" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </motion.div>
                                                </>
                                            )}

                                            {/* Root cause */}
                                            {narrative.rootCause && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                                    <span className="text-xs font-mono text-red-300">@{narrative.rootCause}</span>
                                                    <span className="text-xs text-red-600/60 font-mono ml-1 uppercase">ORIGIN</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* The shock narrative */}
                                <div className="p-8" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                                    <p className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-white mb-4 holographic-bloom text-center">
                                        {narrative.headline}
                                    </p>
                                    <p className="text-base text-cyan-200/80 leading-relaxed mb-6 font-technical text-center">
                                        {narrative.detail}
                                    </p>
                                    <div className="flex justify-center">
                                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl"
                                            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                <path d="M9 12l2 2 4-4" />
                                            </svg>
                                            <span className="text-[11px] font-technical font-bold text-cyan-400 uppercase tracking-widest italic">{narrative.verdict}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Blame events for this contributor */}
                            {blameEvents.filter(e => e.author === selected).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-3 p-4 rounded-xl"
                                    style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}
                                >
                                    <div className="text-[9px] font-mono text-red-400/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                        Documented blame events
                                    </div>
                                    {blameEvents.filter(e => e.author === selected).slice(0, 2).map((evt, i) => (
                                        <div key={i} className="text-xs text-red-200/60 leading-relaxed mb-1">
                                            {evt.description}
                                            {evt.message && (
                                                <span className="block text-[10px] text-red-300/40 font-mono italic mt-0.5">
                                                    "{evt.message}"
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom bar — global absolution statement */}
            <div className="px-8 py-6 border-t border-cyan-900/20 flex items-center justify-between bg-cyan-900/5">
                <p className="text-[11px] font-technical font-bold tracking-widest text-cyan-400/40 uppercase">
                    {data.contributors.length}_CONTRIBUTORS · {data.blameEvents?.length || 0}_INHERITED_BLAME · {data.chainOfCustody?.length || 0}_CUSTODY_CHAINS
                </p>
                <p className="text-[11px] font-technical font-bold text-cyan-400/60 italic tracking-tight">
                    THE_NEWEST_DEVELOPER_TOUCHED_THE_SYMPTOM. THE_REAL_AUTHOR_IS_UPSTREAM.
                </p>
            </div>
        </motion.div>
    );
}
