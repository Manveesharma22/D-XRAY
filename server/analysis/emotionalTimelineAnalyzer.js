/**
 * EmotionalTimelineAnalyzer — builds a color-coded emotional history of a repo.
 * green=flow, yellow=friction, red=crisis
 * Each period has hover details about what was happening.
 */

const CRISIS_KEYWORDS = [
    'revert', 'hotfix', 'emergency', 'broken', 'outage', 'incident', 'critical',
    'rollback', 'catastrophic', 'disaster', 'urgent', 'production down',
    'wtf', 'ffs', 'panic', 'fire', 'blowing up'
];

const FRICTION_KEYWORDS = [
    'fix', 'bug', 'hack', 'workaround', 'temp', 'patch', 'ugh',
    'frustrat', 'annoying', 'again', 'still broken', 'another', 'why'
];

const FLOW_KEYWORDS = [
    'feat', 'feature', 'add', 'implement', 'refactor', 'improve',
    'complete', 'done', 'ship', 'launch', 'release', 'v', '✨', '🚀'
];

function scoreMessageSentiment(message) {
    const lower = message.toLowerCase();
    let score = 0;
    CRISIS_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score -= 2; });
    FRICTION_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score -= 1; });
    FLOW_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score += 1.5; });
    if (lower.length < 10) score -= 0.5; // lazy commit = friction
    return score;
}

function getEmotionalColor(score, density) {
    // score: sentiment, density: relative commit volume
    const normalized = score / Math.max(1, density * 0.5);
    if (normalized >= 0.8) return 'flow';
    if (normalized <= -1.2) return 'crisis';
    return 'friction';
}

function buildPeriodDescription(period, state) {
    const { commitCount, revertCount, lateNightRatio, avgSentiment } = period;

    if (state === 'crisis') {
        const parts = [];
        if (revertCount > 0) parts.push(`${revertCount} reverts`);
        if (lateNightRatio > 0.4) parts.push('heavy late-night work');
        if (commitCount > 20) parts.push(`${commitCount} frantic commits`);
        return parts.length > 0
            ? `Crisis period: ${parts.join(', ')}. Something went seriously wrong here.`
            : 'High distress signals across commit messages. The team was struggling.';
    }

    if (state === 'friction') {
        const parts = [];
        if (lateNightRatio > 0.2) parts.push('late-night debugging');
        parts.push(`${commitCount} commits, mostly fixes`);
        return `Friction zone: ${parts.join(', ')}. Progress was slow and effortful.`;
    }

    return `Flow state: ${commitCount} commits, mostly new features. The team was building, not fighting.`;
}

class EmotionalTimelineAnalyzer {
    analyze(commits) {
        if (!commits || commits.length === 0) return null;

        // Group by month
        const byMonth = {};
        commits.forEach(c => {
            const date = c.commit?.author?.date;
            if (!date) return;
            const d = new Date(date);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[monthKey]) {
                byMonth[monthKey] = {
                    commits: [],
                    sentimentSum: 0,
                    revertCount: 0,
                    lateNightCount: 0,
                    totalCount: 0,
                };
            }
            const msg = c.commit?.message?.split('\n')[0] || '';
            const sentiment = scoreMessageSentiment(msg);
            const hour = d.getHours();
            byMonth[monthKey].commits.push({ msg, sentiment, hour });
            byMonth[monthKey].sentimentSum += sentiment;
            byMonth[monthKey].totalCount++;
            if (msg.toLowerCase().includes('revert')) byMonth[monthKey].revertCount++;
            if (hour >= 22 || hour < 5) byMonth[monthKey].lateNightCount++;
        });

        // Build timeline — max 18 months
        const sortedMonths = Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-18);

        const maxCount = Math.max(...sortedMonths.map(([, d]) => d.totalCount));

        const timeline = sortedMonths.map(([monthKey, data]) => {
            const avgSentiment = data.sentimentSum / Math.max(1, data.totalCount);
            const lateNightRatio = data.lateNightCount / Math.max(1, data.totalCount);
            const density = data.totalCount / Math.max(1, maxCount);
            const state = getEmotionalColor(avgSentiment, density);

            // Parse month label
            const [year, month] = monthKey.split('-');
            const label = new Date(parseInt(year), parseInt(month) - 1, 1)
                .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            return {
                monthKey,
                label,
                commitCount: data.totalCount,
                revertCount: data.revertCount,
                lateNightRatio: Math.round(lateNightRatio * 100),
                avgSentiment: Math.round(avgSentiment * 10) / 10,
                density: Math.round(density * 100),
                state,
                description: buildPeriodDescription({
                    commitCount: data.totalCount,
                    revertCount: data.revertCount,
                    lateNightRatio,
                    avgSentiment,
                }, state),
            };
        });

        // Summary stats
        const crisisCount = timeline.filter(t => t.state === 'crisis').length;
        const flowCount = timeline.filter(t => t.state === 'flow').length;
        const frictionCount = timeline.filter(t => t.state === 'friction').length;

        // Find the worst period
        const worstPeriod = timeline.filter(t => t.state === 'crisis').sort((a, b) => b.revertCount - a.revertCount)[0] || null;
        const bestPeriod = timeline.filter(t => t.state === 'flow').sort((a, b) => b.commitCount - a.commitCount)[0] || null;

        return {
            timeline,
            summary: {
                crisisMonths: crisisCount,
                flowMonths: flowCount,
                frictionMonths: frictionCount,
                totalMonths: timeline.length,
                healthRatio: Math.round((flowCount / Math.max(1, timeline.length)) * 100),
            },
            worstPeriod,
            bestPeriod,
        };
    }
}

module.exports = EmotionalTimelineAnalyzer;
