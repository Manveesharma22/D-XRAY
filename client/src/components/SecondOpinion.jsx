import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dr. Cautious — conservative, slightly optimistic second opinion
function generateSecondOpinion(diagnosis, corpusScore) {
    if (!diagnosis || !corpusScore) return null;

    const score = corpusScore.dxScore;
    const sections = diagnosis.sections || [];

    // Find the most borderline section (score closest to a threshold)
    const worstSection = sections.reduce((worst, s) => {
        if (!worst) return s;
        return (s.score || 50) < (worst.score || 50) ? s : worst;
    }, null);

    const doctorName = 'Dr. Harrington';
    const doctorTitle = 'Senior Code Pathologist, Conservative Practice';

    let disagreement = '';
    let alternativeReading = '';
    let adjustedScore = score;

    if (score < 30) {
        adjustedScore = score + 12;
        disagreement = `I would score this codebase at ${adjustedScore}, not ${score}.`;
        alternativeReading = `My colleague is not wrong — but the score penalizes architecture that was clearly designed for speed-to-market, not longevity. The intent matters. This code did what it was asked to do under the constraints it faced. That deserves some credit.`;
    } else if (score < 50) {
        adjustedScore = score + 8;
        disagreement = `Where my colleague sees ${score}, I see ${adjustedScore}.`;
        alternativeReading = `The findings are accurate, but the framing concerns me. A codebase this active — with this many contributors — is a living system. Living systems are messy. That's not pathology. That's life.`;
    } else {
        adjustedScore = score - 5;
        disagreement = `I am slightly more cautious than my colleague's ${score}.`;
        alternativeReading = `I notice some patterns that concern me that the first reading may have underweighted. Specifically, the technical debt in the older modules may be more significant than the surface scores suggest. I would not want us to leave here feeling too confident.`;
    }

    const worstFindingTitle = worstSection?.title || 'the primary finding';

    return {
        doctorName,
        doctorTitle,
        adjustedScore,
        originalScore: score,
        disagreement,
        alternativeReading,
        worstFindingTitle,
        caveat: `We disagree about ${worstFindingTitle}. I think the situation is ${adjustedScore > score ? 'more recoverable' : 'more serious'} than the first reading suggests. You will have to decide which of us to trust.`
    };
}

export default function SecondOpinion({ diagnosis, corpusScore }) {
    const [shown, setShown] = useState(false);
    const [opinion] = useState(() => generateSecondOpinion(diagnosis, corpusScore));

    if (!diagnosis) return null;

    return (
        <div>
            {!shown && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4"
                >
                    <button
                        onClick={() => setShown(true)}
                        className="px-8 py-3 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all border border-amber-500/20 text-amber-400/60 hover:border-amber-500/30 hover:text-amber-400/80 hover:bg-amber-500/5"
                    >
                        Get a Second Opinion
                    </button>
                    <p className="text-[9px] font-mono text-cyan-900/20 mt-2">Diagnostic tools have uncertainty. A second reading may change the picture.</p>
                </motion.div>
            )}

            <AnimatePresence>
                {shown && opinion && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="glass-panel rounded-2xl p-6 border border-amber-500/10"
                        style={{ background: 'rgba(30, 20, 0, 0.5)' }}
                    >
                        {/* Second doctor header */}
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.08)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-amber-200/80">{opinion.doctorName}</div>
                                    <div className="text-[9px] font-mono text-amber-400/30">{opinion.doctorTitle}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-mono text-amber-400/30 uppercase mb-1">Second Score</div>
                                <div className="text-3xl font-black text-amber-400">{opinion.adjustedScore}</div>
                            </div>
                        </div>

                        {/* Score comparison */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-amber-500/5 mb-4">
                            <div className="text-center">
                                <div className="text-[9px] font-mono text-cyan-800/30">First Opinion</div>
                                <div className="text-2xl font-black text-cyan-400">{opinion.originalScore}</div>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <div className="flex-1 h-px bg-amber-500/10" />
                                <span className="text-amber-400/40 text-xs">vs</span>
                                <div className="flex-1 h-px bg-amber-500/10" />
                            </div>
                            <div className="text-center">
                                <div className="text-[9px] font-mono text-amber-400/30">Second Opinion</div>
                                <div className="text-2xl font-black text-amber-400">{opinion.adjustedScore}</div>
                            </div>
                        </div>

                        {/* Disagreement */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-amber-200/70">{opinion.disagreement}</p>
                            <p className="text-sm text-amber-200/50 leading-relaxed">{opinion.alternativeReading}</p>
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-xs text-amber-300/60 italic">{opinion.caveat}</p>
                            </div>
                        </div>

                        <div className="text-[9px] font-mono text-amber-900/20 text-center mt-4 pt-3 border-t border-amber-900/10">
                            Two doctors looked at the same data and disagreed. Diagnostic uncertainty is not a bug — it is the nature of diagnosis.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
