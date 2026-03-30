class PrognosisSimulator {
    /**
     * @param {Object} scanResults - All previous scan data
     */
    simulate(scanResults) {
        const { corpusScore, trackFindings, biologicalShadow, repoInfo, contributors } = scanResults;
        const currentScore = corpusScore?.dxScore || 50;

        const decayFactors = {
            ci: this._getDecay(trackFindings.A, 0.05),
            test: this._getDecay(trackFindings.B, 0.08),
            burnout: (biologicalShadow?.shadowScore || 0) / 100 * 0.15,
        };

        const hooks = this._getStoryHooks(currentScore);
        const timeline = [];

        for (let days = 0; days <= 90; days += 2) {
            const t = days / 90;
            const healthDrop = (currentScore * 0.45) * (t + Math.pow(t, 2) * 0.6);
            const fatigueMultiplier = 1 + (decayFactors.burnout * t * 6);
            const score = Math.max(5, Math.round(currentScore - (healthDrop * fatigueMultiplier)));
            const burnoutRisk = Math.min(100, Math.round((decayFactors.burnout * 100) + (days * 0.9)));

            const recoveryPotential = 0.9 - (t * 0.5);
            const interventionScore = Math.min(100, Math.round(currentScore + (100 - currentScore) * recoveryPotential * Math.sqrt(t || 1)));

            timeline.push({
                day: days,
                score,
                interventionScore: days === 0 ? currentScore : interventionScore,
                burnoutRisk,
                costToFix: this._calculateCost(score, days),
                signals: this._getSignals(days, score),
                storyBeat: this._getStoryBeat(days, score, burnoutRisk, hooks),
                healingBeat: this._getHealingBeat(days, interventionScore)
            });
        }

        return {
            timeline,
            currentScore,
            atRiskContributor: this._predictDeparture(contributors, biologicalShadow, timeline[timeline.length - 1].burnoutRisk),
            compoundingCostRatio: Math.round(timeline[timeline.length - 1].costToFix / timeline[0].costToFix) || 8
        };
    }

    _getStoryHooks(score) {
        if (score > 70) return {
            intro: "The baseline is strong, but a silent decay has been admitted.",
            drift: "Day 30: Small documentation gaps have turned into knowledge silos. The team is starting to guess.",
            crisis: "Day 67: The first core maintainer expresses systemic fatigue. The heartbeat is irregular.",
            terminal: "Day 90: The code is still 'working', but it has become a black box. No one dares refactor."
        };
        if (score > 40) return {
            intro: "Initial diagnosis: Chronic technical debt with early signs of team atrophy.",
            drift: "Day 30: The CI pipeline is now a game of chance. One out of three builds fails for no reason.",
            crisis: "Day 67: Knowledge loss has reached a tipping point. The original context is gone.",
            terminal: "Day 90: Total systemic paralysis. Every new feature introduces three new fractures."
        };
        return {
            intro: "CRITICAL ADMISSION: The codebase is in active organ failure.",
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

        // Dynamic filler beats
        if (day % 14 === 0) {
            const fillers = [
                `Health at ${score}. The drift is accelerating.`,
                `Burnout risk hit ${burnout}%. The team is losing belief.`,
                `Compounding debt is now the primary architect.`,
                `A silent night. No commits. The heartbeat slows.`
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

    _getSignals(day, score) {
        if (day === 30) return ["The Drift", "Dependency drift detected (+15%)"];
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
        // In a real app, we'd look at commit frequency drop.
        // For the demo, we pick a top contributor if risk is high.
        if (riskLevel > 60) {
            const top = contributors[0];
            return {
                name: top.name || top.login,
                login: top.login,
                risk: riskLevel > 80 ? 'Critical' : 'Elevated',
                date: "Day " + (90 - Math.floor(Math.random() * 30)),
                impact: "Sole owner of critical subsystems"
            };
        }
        return null;
    }
}

module.exports = PrognosisSimulator;
