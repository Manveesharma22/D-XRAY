class PrognosisSimulator {
    /**
     * @param {Object} scanResults - All previous scan data
     */
    simulate(scanResults) {
        const { corpusScore, trackFindings, biologicalShadow, repoInfo, contributors } = scanResults;
        const currentScore = corpusScore?.dxScore || 50;

        // ALL-TRACK DECAY: Every weak track contributes to the atrophy velocity
        const tf = trackFindings || {};
        const decayFactors = {
            ci: this._getDecay(tf.A, 0.05),
            test: this._getDecay(tf.B, 0.08),
            docs: this._getDecay(tf.C, 0.04),
            onboarding: this._getDecay(tf.D, 0.03),
            deps: this._getDecay(tf.E, 0.06),
            flow: this._getDecay(tf.F, 0.07),
            review: this._getDecay(tf.G, 0.04),
            env: this._getDecay(tf.H, 0.02),
            burnout: (biologicalShadow?.shadowScore || 0) / 100 * 0.15,
        };

        const totalDecayRate = Object.values(decayFactors).reduce((a, b) => a + b, 0) / 10;
        const hooks = this._getStoryHooks(currentScore, repoInfo, tf);
        const timeline = [];

        for (let days = 0; days <= 90; days += 2) {
            const t = days / 90;
            const healthDrop = (currentScore * 0.45) * (t + Math.pow(t, 2) * (0.6 + totalDecayRate));
            const fatigueMultiplier = 1 + (decayFactors.burnout * t * 6);
            const score = Math.max(5, Math.round(currentScore - (healthDrop * fatigueMultiplier)));
            const burnoutRisk = Math.min(100, Math.round((decayFactors.burnout * 100) + (days * 0.9)));

            const recoveryPotential = 0.9 - (t * 0.5);
            // Intervention is harder as time passes
            const interventionScore = Math.min(100, Math.round(currentScore + (100 - currentScore) * recoveryPotential * Math.sqrt(Math.max(0.1, t))));

            timeline.push({
                day: days,
                score,
                interventionScore: days === 0 ? currentScore : interventionScore,
                burnoutRisk,
                costToFix: this._calculateCost(score, days),
                signals: this._getSignals(days, score, tf),
                storyBeat: this._getStoryBeat(days, score, burnoutRisk, hooks),
                healingBeat: this._getHealingBeat(days, interventionScore)
            });
        }

        const terminalFrame = timeline[timeline.length - 1];
        const costBasis = timeline[0].costToFix || 1;

        return {
            timeline,
            currentScore,
            atRiskContributor: this._predictDeparture(contributors, biologicalShadow, terminalFrame.burnoutRisk),
            compoundingCostRatio: Math.round(terminalFrame.costToFix / costBasis) || 8,
            recoveryGap: terminalFrame.interventionScore - terminalFrame.score,
            interventionROI: ((terminalFrame.interventionScore - terminalFrame.score) / costBasis).toFixed(1)
        };
    }

    _getStoryHooks(score, repoInfo, tracks) {
        const lang = repoInfo?.language || 'code';
        const name = repoInfo?.name || 'repository';

        if (score > 70) return {
            intro: `The ${lang} baseline of ${name} is strong, but a silent decay has been admitted.`,
            drift: "Day 30: Small documentation gaps have turned into knowledge silos. The team is starting to guess.",
            crisis: "Day 67: The first core maintainer expresses systemic fatigue. The heartbeat is irregular.",
            terminal: "Day 90: The code is still 'working', but it has become a black box. No one dares refactor."
        };
        if (score > 40) return {
            intro: `Initial diagnosis for ${name}: Chronic technical debt with early signs of team atrophy.`,
            drift: tracks?.A?.score < 50 ? "Day 30: The CI pipeline is now a game of chance. One out of three builds fails." : "Day 30: Velocity is dropping. The team spends more time talking about code than writing it.",
            crisis: "Day 67: Knowledge loss has reached a tipping point. The original context is gone.",
            terminal: "Day 90: Total systemic paralysis. Every new feature introduces three new fractures."
        };
        return {
            intro: `CRITICAL ADMISSION: The ${lang} internal structure of ${name} is in active organ failure.`,
            drift: "Day 30: The 'hero' developers are working weekends just to keep the lights on.",
            crisis: "Day 67: A mass exodus of context. The repo is officially 'haunted'.",
            terminal: "Day 90: Terminal state. The cost to repair exceeds the cost to rewrite from zero."
        };
    }

    _getStoryBeat(day, score, burnout, hooks) {
        if (day === 0) return hooks.intro;
        if (day === 30) return hooks.drift;
        if (day === 67) return hooks.crisis;
        if (day === 90) return hooks.terminal;

        // Granular suspense fillers
        if (day === 10) return "The first silent fracture: A critical test was skipped to meet a phantom deadline.";
        if (day === 20) return "Structural atrophy detected. Complexity is beginning to outpace comprehension.";
        if (day === 40) return "The Silence: PR reviews are taking 3x longer. Trust is the first casualty.";
        if (day === 50) return "The Shadow: A core module has become 'untouchable'. No one knows why it works.";
        if (day === 75) return "Systemic fatigue. The repository is now a monument to its own context-loss.";
        if (day === 85) return "Terminal velocity reached. Every line added is a debt-bomb waiting to detonate.";

        // Basic catch-all for intermediate days
        if (day % 14 === 0) {
            const fillers = [
                `Dx Score at ${score}. The drift deepens.`,
                `Burnout at ${burnout}%. The team's resolve is fraying.`,
                `Compounding debt has assumed the role of Lead Architect.`,
                `A quiet week. The codebase enters a dormant, decaying state.`
            ];
            return fillers[Math.floor(day / 14) % fillers.length];
        }
        return null;
    }

    _getHealingBeat(day, score) {
        if (day === 0) return "Intervention initialized. Prescriptions are being distributed.";
        if (day === 30) return "Stabilization visible. The 'hero' culture is being replaced by process.";
        if (day === 90) return "Codebase reborn. Total technical absolution achieved.";
        return null;
    }

    _getSignals(day, score, tracks) {
        if (day === 20 && tracks?.E?.score < 50) return ["Dependency Drift", "Vulnerable paths detected (+15%)"];
        if (day === 40 && tracks?.F?.score < 50) return ["The Silence", "Collaboration frequency dropped 40%"];
        if (day === 67) return ["The Crisis", "Personnel risk threshold crossed"];
        if (day === 90) return ["Terminal", "Repo death-spiral confirmed"];
        return [];
    }

    _getDecay(track, base) {
        if (!track) return base;
        const severity = (100 - (track.score || 50)) / 100;
        return base + (severity * 0.1);
    }

    _calculateCost(score, days) {
        // Simple formula: base cost + compounding interest
        const base = Math.max(1, Math.round((100 - score) / 5));
        const inflation = 1 + (days / 30) * 0.5; // Costs roughly 50% more every month if ignored
        return Math.round(base * inflation);
    }

    _predictDeparture(contributors, shadow, riskLevel) {
        if (!contributors || contributors.length === 0) return null;

        // DETERMINISTIC PREDICTION: Based on riskLevel, not random.
        if (riskLevel > 55) {
            const top = contributors[0];
            // Departure day is inversely proportional to risk
            const departureDay = Math.max(60, 90 - Math.floor((riskLevel - 55) * 0.8));

            return {
                name: top.name || top.login,
                login: top.login,
                risk: riskLevel > 80 ? 'Critical' : 'Elevated',
                date: `Day ${departureDay}`,
                impact: "Sole owner of critical subsystems. Context loss high."
            };
        }
        return null;
    }
}

module.exports = PrognosisSimulator;
