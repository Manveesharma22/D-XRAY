class PrognosisSimulator {
    /**
     * @param {Object} scanResults - All previous scan data
     */
    simulate(scanResults) {
        const { corpusScore, trackFindings, debtMap, biologicalShadow, repoInfo, contributors } = scanResults;

        // Base health (0-100)
        const currentScore = corpusScore?.dxScore || 50;

        // Calculate decay factors based on current "fractures"
        const decayFactors = {
            ci: this._getDecay(trackFindings.A, 0.05),
            test: this._getDecay(trackFindings.B, 0.08),
            docs: this._getDecay(trackFindings.C, 0.03),
            burnout: (biologicalShadow?.shadowScore || 0) / 100 * 0.15,
            coupling: (scanResults.clones?.density || 0) * 0.05
        };

        const timeline = [0, 30, 60, 90].map(days => {
            const t = days / 90;

            // Linear + Exponential decay
            const healthDrop = (currentScore * 0.4) * (t + Math.pow(t, 2) * 0.5);
            const fatigueMultiplier = 1 + (decayFactors.burnout * t * 5);

            const projectedScore = Math.max(5, Math.round(currentScore - (healthDrop * fatigueMultiplier)));

            // Generate phase-specific markers
            let signals = [];
            if (days === 30) signals = ["Minor build time drift (+12%)", "First silent burnout markers"];
            if (days === 60) signals = ["Test flakiness threshold crossed", "Knowledge silos deepening"];
            if (days === 90) signals = ["Death spiral entry point", "Critical contributor departure risk"];

            // Calculate "Intervention" score (what if we act today?)
            const interventionScore = Math.min(100, Math.round(currentScore + (100 - currentScore) * 0.3 * t));

            return {
                day: days,
                score: projectedScore,
                interventionScore,
                signals,
                costToFix: this._calculateCost(projectedScore, days),
                burnoutRisk: Math.min(100, Math.round((decayFactors.burnout * 100) + (days * 0.8)))
            };
        });

        // Predict which contributor might leave
        const atRiskContributor = this._predictDeparture(contributors, biologicalShadow, timeline[3].burnoutRisk);

        return {
            timeline,
            currentScore,
            atRiskContributor,
            compoundingCostRatio: Math.round(timeline[3].costToFix / timeline[0].costToFix) || 8
        };
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
