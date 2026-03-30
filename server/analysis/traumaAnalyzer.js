// traumaAnalyzer.js — The Trauma Timeline
// Detects defining traumatic events in codebase history

class TraumaAnalyzer {
    analyze(commits) {
        if (!commits || commits.length < 5) {
            return { traumaEvents: [], overallTraumaScore: 0, finding: 'Insufficient commit history for trauma analysis.' };
        }

        // Bucket commits by week
        const weekMap = new Map();
        commits.forEach(commit => {
            const date = new Date(commit.commit?.author?.date);
            const weekKey = this._getWeekKey(date);
            if (!weekMap.has(weekKey)) {
                weekMap.set(weekKey, { date: weekKey, commits: [], authors: new Set() });
            }
            const week = weekMap.get(weekKey);
            week.commits.push(commit);
            const author = commit.author?.login || commit.commit?.author?.name || 'unknown';
            week.authors.add(author);
        });

        const weeks = [...weekMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, data]) => ({ ...data, weekKey: key }));

        // Calculate average commits/week and average message length
        const avgCommitsPerWeek = commits.length / Math.max(weeks.length, 1);

        // Compute message stats across all commits
        const allMsgLengths = commits.map(c => (c.commit?.message || '').split(' ').filter(w => w.length > 0).length);
        const globalAvgMsgLen = allMsgLengths.reduce((a, b) => a + b, 0) / Math.max(allMsgLengths.length, 1);

        const traumaEvents = [];

        weeks.forEach(week => {
            const count = week.commits.length;
            const reverts = week.commits.filter(c => {
                const msg = (c.commit?.message || '').toLowerCase();
                return msg.startsWith('revert') || msg.includes('revert ') || msg.includes('rollback');
            }).length;

            const msgLengths = week.commits.map(c => (c.commit?.message || '').split(' ').filter(w => w.length > 0).length);
            const avgMsgLen = msgLengths.reduce((a, b) => a + b, 0) / Math.max(msgLengths.length, 1);
            const msgLengthDrop = globalAvgMsgLen > 5 ? (globalAvgMsgLen - avgMsgLen) / globalAvgMsgLen : 0;

            // Author concentration
            const authorCommitCounts = {};
            week.commits.forEach(c => {
                const author = c.author?.login || c.commit?.author?.name || 'unknown';
                authorCommitCounts[author] = (authorCommitCounts[author] || 0) + 1;
            });
            const topAuthor = Object.entries(authorCommitCounts).sort(([, a], [, b]) => b - a)[0];
            const topAuthorRatio = topAuthor ? topAuthor[1] / count : 0;

            // Trauma scoring
            let severity = null;
            let traumaScore = 0;
            const signals = [];

            if (count > avgCommitsPerWeek * 3) { traumaScore += 30; signals.push(`${count} commits (${Math.round(count / avgCommitsPerWeek)}x normal pace)`); }
            else if (count > avgCommitsPerWeek * 2) { traumaScore += 15; signals.push(`${count} commits (elevated pace)`); }

            if (reverts >= 5) { traumaScore += 35; signals.push(`${reverts} reverts`); }
            else if (reverts >= 3) { traumaScore += 20; signals.push(`${reverts} reverts`); }
            else if (reverts >= 1) { traumaScore += 8; signals.push(`${reverts} revert${reverts > 1 ? 's' : ''}`); }

            if (msgLengthDrop > 0.5) { traumaScore += 20; signals.push(`commit messages dropped to avg ${Math.round(avgMsgLen)} words`); }
            else if (msgLengthDrop > 0.3) { traumaScore += 10; signals.push(`shorter commit messages`); }

            if (topAuthorRatio > 0.7 && count > 8) { traumaScore += 25; signals.push(`${topAuthor[0]} committed ${topAuthor[1]} times (${Math.round(topAuthorRatio * 100)}% of all activity)`); }

            if (traumaScore >= 50) severity = 'critical';
            else if (traumaScore >= 30) severity = 'acute';
            else if (traumaScore >= 15) severity = 'mild';

            if (severity) {
                const d = new Date(week.weekKey);
                const summary = this._buildTraumaSummary(week.weekKey, count, reverts, avgMsgLen, globalAvgMsgLen, topAuthor, signals, severity);
                traumaEvents.push({
                    date: week.weekKey,
                    displayDate: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    severity,
                    traumaScore,
                    commitCount: count,
                    revertCount: reverts,
                    authorCount: week.authors.size,
                    messageLengthDrop: Math.round(msgLengthDrop * 100),
                    topCommitter: topAuthor ? topAuthor[0] : null,
                    signals,
                    summary
                });
            }
        });

        traumaEvents.sort((a, b) => b.traumaScore - a.traumaScore);

        const overallTraumaScore = Math.min(100, traumaEvents.reduce((s, e) => s + e.traumaScore, 0) / Math.max(weeks.length / 4, 1));

        let finding;
        const criticals = traumaEvents.filter(e => e.severity === 'critical').length;
        if (criticals === 0 && traumaEvents.length === 0) {
            finding = 'No traumatic events detected. This codebase has had a stable, consistent development history.';
        } else if (criticals >= 3) {
            finding = `${criticals} critical trauma events detected. This codebase has been through repeated crises. Some structural damage may be permanent.`;
        } else if (criticals === 1) {
            const te = traumaEvents.find(e => e.severity === 'critical');
            finding = `One critical trauma event during ${te?.displayDate}. ${te?.commitCount} commits in a single week with ${te?.revertCount} reverts. The codebase shows signs it never fully recovered.`;
        } else {
            finding = `${traumaEvents.length} trauma event${traumaEvents.length > 1 ? 's' : ''} identified. The codebase carries visible scars from ${traumaEvents.length > 1 ? 'multiple episodes' : 'one episode'} of crisis-mode development.`;
        }

        return {
            traumaEvents: traumaEvents.slice(0, 8),
            overallTraumaScore: Math.round(overallTraumaScore),
            finding
        };
    }

    _getWeekKey(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return d.toISOString().split('T')[0];
    }

    _buildTraumaSummary(weekKey, commitCount, revertCount, avgMsgLen, globalAvgMsgLen, topAuthor, signals, severity) {
        const d = new Date(weekKey);
        const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        let opening;
        if (severity === 'critical') opening = `Week of ${dateStr} — Critical incident.`;
        else if (severity === 'acute') opening = `Week of ${dateStr} — Acute stress event.`;
        else opening = `Week of ${dateStr} — Elevated activity detected.`;

        const parts = [`${commitCount} commits in 7 days.`];
        if (revertCount > 0) parts.push(`${revertCount} revert${revertCount > 1 ? 's' : ''}.`);
        if (avgMsgLen < globalAvgMsgLen * 0.6) {
            parts.push(`Average commit message length dropped from ${Math.round(globalAvgMsgLen)} words to ${Math.round(avgMsgLen)}.`);
        }
        if (topAuthor && topAuthor[1] > 10) {
            parts.push(`${topAuthor[0]} committed ${topAuthor[1]} times.`);
        }
        if (severity === 'critical') {
            parts.push('The codebase carries a scar from this week.');
        }

        return `${opening} ${parts.join(' ')}`;
    }
}

module.exports = TraumaAnalyzer;
