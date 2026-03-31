/**
 * client/src/utils/prognosisEngine.js
 * Frontend port of the Prognosis Simulation logic.
 * Ensures the Discharge Summary can generate its own future projection without server sync.
 */

export const simulatePrognosis = (scanResults) => {
    const { corpusScore, tracks, biologicalShadow, patient, contributors } = scanResults;
    const currentScore = corpusScore?.dxScore || 50;

    // Helper to get decay rate based on track score
    const getDecay = (track, base) => {
        if (!track) return base;
        const severity = (100 - (track.score || 50)) / 100;
        return base + (severity * 0.1);
    };

    const tf = tracks || {};
    const decayFactors = {
        ci: getDecay(tf.A, 0.05),
        test: getDecay(tf.B, 0.08),
        docs: getDecay(tf.C, 0.04),
        onboarding: getDecay(tf.D, 0.03),
        deps: getDecay(tf.E, 0.06),
        flow: getDecay(tf.F, 0.07),
        review: getDecay(tf.G, 0.04),
        env: getDecay(tf.H, 0.02),
        burnout: (biologicalShadow?.shadowScore || 0) / 100 * 0.15,
    };

    const totalDecayRate = Object.values(decayFactors).reduce((a, b) => a + b, 0) / 10;

    // Story hooks based on score
    const getStoryHooks = (score, name) => {
        if (score > 70) return {
            intro: `The baseline of ${name} is strong, but a silent decay has been admitted.`,
            drift: "Day 30: Small documentation gaps have turned into knowledge silos. The team is starting to guess.",
            crisis: "Day 67: The first core maintainer expresses systemic fatigue. The heartbeat is irregular.",
            terminal: "Day 90: The code is still 'working', but it has become a black box. No one dares refactor."
        };
        if (score > 40) return {
            intro: `Initial diagnosis for ${name}: Chronic technical debt with early signs of team atrophy.`,
            drift: tf?.A?.score < 50 ? "Day 30: The CI pipeline is now a game of chance. One out of three builds fails." : "Day 30: Velocity is dropping. The team spends more time talking about code than writing it.",
            crisis: "Day 67: Knowledge loss has reached a tipping point. The original context is gone.",
            terminal: "Day 90: Total systemic paralysis. Every new feature introduces three new fractures."
        };
        return {
            intro: `CRITICAL ADMISSION: The internal structure of ${name} is in active organ failure.`,
            drift: "Day 30: The 'hero' developers are working weekends just to keep the lights on.",
            crisis: "Day 67: A mass exodus of context. The repo is officially 'haunted'.",
            terminal: "Day 90: Terminal state. The cost to repair exceeds the cost to rewrite from zero."
        };
    };

    const name = patient?.name?.split('/')[1] || 'repository';
    const hooks = getStoryHooks(currentScore, name);
    const timeline = [];

    for (let days = 0; days <= 90; days += 2) {
        const t = days / 90;
        const healthDrop = (currentScore * 0.45) * (t + Math.pow(t, 2) * (0.6 + totalDecayRate));
        const fatigueMultiplier = 1 + (decayFactors.burnout * t * 6);
        const score = Math.max(5, Math.round(currentScore - (healthDrop * fatigueMultiplier)));
        const burnoutRisk = Math.min(100, Math.round((decayFactors.burnout * 100) + (days * 0.9)));

        const recoveryPotential = 0.9 - (t * 0.5);
        const interventionScore = Math.min(100, Math.round(currentScore + (100 - currentScore) * recoveryPotential * Math.sqrt(Math.max(0.1, t))));

        // Story Beats
        let storyBeat = null;
        if (days === 0) storyBeat = hooks.intro;
        else if (days === 30) storyBeat = hooks.drift;
        else if (days === 67) storyBeat = hooks.crisis;
        else if (days === 90) storyBeat = hooks.terminal;
        else if (days === 10) storyBeat = "The first silent fracture: A critical test was skipped to meet a phantom deadline.";
        else if (days === 40) storyBeat = "The Silence: PR reviews are taking 3x longer. Trust is the first casualty.";
        else if (days === 75) storyBeat = "Systemic fatigue. The repository is now a monument to its own context-loss.";

        let healingBeat = null;
        if (days === 0) healingBeat = "Intervention initialized. Prescriptions are being distributed.";
        if (days === 30) healingBeat = "Stabilization visible. The 'hero' culture is being replaced by process.";
        if (days === 90) healingBeat = "Codebase reborn. Total technical absolution achieved.";

        const signals = [];
        if (days === 20 && tf?.E?.score < 50) signals.push("Dependency Drift", "Vulnerable paths detected (+15%)");
        if (days === 40 && tf?.F?.score < 50) signals.push("The Silence", "Collaboration frequency dropped 40%");
        if (days === 67) signals.push("The Crisis", "Personnel risk threshold crossed");
        if (days === 90) signals.push("Terminal", "Repo death-spiral confirmed");

        timeline.push({
            day: days,
            score,
            interventionScore: days === 0 ? currentScore : interventionScore,
            burnoutRisk,
            costToFix: Math.round(Math.max(1, (100 - score) / 5) * (1 + (days / 30) * 0.5)),
            signals,
            storyBeat,
            healingBeat
        });
    }

    const terminalFrame = timeline[timeline.length - 1];
    const costBasis = timeline[0].costToFix || 1;

    // Predict departure
    let atRiskContributor = null;
    const contributorsList = contributors || [];
    if (terminalFrame.burnoutRisk > 55 && contributorsList.length > 0) {
        const top = contributorsList[0];
        const departureDay = Math.max(60, 90 - Math.floor((terminalFrame.burnoutRisk - 55) * 0.8));
        atRiskContributor = {
            name: top.name || top.login || 'Lead Maintainer',
            login: top.login,
            risk: terminalFrame.burnoutRisk > 80 ? 'Critical' : 'Elevated',
            date: `Day ${departureDay}`,
            impact: "Sole owner of critical subsystems. Context loss high."
        };
    }

    return {
        timeline,
        currentScore,
        atRiskContributor,
        compoundingCostRatio: Math.round(terminalFrame.costToFix / costBasis) || 8,
        recoveryGap: terminalFrame.interventionScore - terminalFrame.score,
        interventionROI: ((terminalFrame.interventionScore - terminalFrame.score) / costBasis).toFixed(1)
    };
};
