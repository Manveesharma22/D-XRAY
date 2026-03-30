// biologicalShadowAnalyzer.js — THE BIOLOGICAL SHADOW
// Quantifies the human cost of the codebase: sleep cycles, weekends, and holidays.

class BiologicalShadowAnalyzer {
    analyze(commits, contributors) {
        if (!commits || commits.length === 0) {
            return {
                shadowScore: 0,
                totalHoursStolen: 0,
                circadianViolations: [],
                marathonSessions: [],
                weekendSacrifices: [],
                fatigueSignals: [],
                summary: "No history found. The shadow is silent."
            };
        }

        const circadianViolations = [];
        const weekendSacrifices = [];
        const fatigueSignals = [];
        const marathonSessions = [];

        // 1. Identify Circadian Violations (1 AM - 5 AM local-ish)
        commits.forEach(commit => {
            const dateStr = commit.commit?.author?.date;
            if (!dateStr) return;
            const date = new Date(dateStr);
            const hour = date.getHours();
            const day = date.getDay(); // 0 = Sunday, 6 = Saturday
            const msg = (commit.commit?.message || '').toLowerCase();

            // Circadian: 1 AM to 5 AM
            if (hour >= 1 && hour <= 5) {
                circadianViolations.push({
                    hash: commit.sha.substring(0, 7),
                    author: commit.commit?.author?.name,
                    date: dateStr,
                    hour,
                    message: commit.commit?.message
                });
            }

            // Weekend: Sat or Sun
            if (day === 0 || day === 6) {
                weekendSacrifices.push({
                    hash: commit.sha.substring(0, 7),
                    author: commit.commit?.author?.name,
                    date: dateStr,
                    day: day === 0 ? 'Sunday' : 'Saturday'
                });
            }

            // Fatigue Signals
            const fatigueKeywords = [
                'tired', 'sleep', 'finally', 'ugh', 'exhausted', 'long day',
                'midnight', 'night', 'ignore', 'fixed?', 'hope', 'broken',
                'sorry', 'hack', 'temporary', 'don\'t ask', 'please work'
            ];
            if (fatigueKeywords.some(kw => msg.includes(kw))) {
                fatigueSignals.push({
                    hash: commit.sha.substring(0, 7),
                    author: commit.commit?.author?.name,
                    message: commit.commit?.message
                });
            }
        });

        // 2. Identify Marathon Sessions (Commits by same author spanning > 10 hours in one day)
        const authorBuckets = {};
        commits.forEach(commit => {
            const author = commit.commit?.author?.email || commit.commit?.author?.name;
            const dateStr = commit.commit?.author?.date;
            if (!dateStr || !author) return;
            const date = new Date(dateStr).toDateString();
            const time = new Date(dateStr).getTime();

            if (!authorBuckets[author]) authorBuckets[author] = {};
            if (!authorBuckets[author][date]) authorBuckets[author][date] = [];
            authorBuckets[author][date].push(time);
        });

        Object.entries(authorBuckets).forEach(([author, days]) => {
            Object.entries(days).forEach(([date, times]) => {
                if (times.length > 1) {
                    const min = Math.min(...times);
                    const max = Math.max(...times);
                    const durationHours = (max - min) / (1000 * 60 * 60);

                    if (durationHours >= 10) {
                        marathonSessions.push({
                            author,
                            date,
                            duration: Math.round(durationHours * 10) / 10,
                            commitCount: times.length
                        });
                    }
                }
            });
        });

        // 3. Final Scoring
        const totalHoursStolen = (circadianViolations.length * 4) + (weekendSacrifices.length * 8) + (marathonSessions.length * 6);
        // Normalize: if every commit was 3 AM, score would be 100.
        const shadowScore = Math.min(100, Math.round((totalHoursStolen / (commits.length || 1)) * 5));

        let summary;
        if (shadowScore > 70) {
            summary = `This codebase is built on significant human sacrifice. We detected ${circadianViolations.length} deep-night violations and ${marathonSessions.length} exhaustion marathons. The shadow is heavy.`;
        } else if (shadowScore > 30) {
            summary = `Evidence of intense crunch cycles detected. ${weekendSacrifices.length} weekends were surrendered to meet milestones. A moderate human cost.`;
        } else {
            summary = `The rhythm of development appears sustainable. Few late-night or weekend violations detected. The human cost is low.`;
        }

        return {
            shadowScore,
            totalHoursStolen,
            circadianViolations: circadianViolations.slice(0, 20),
            marathonSessions: marathonSessions.slice(0, 10),
            weekendSacrifices: weekendSacrifices.slice(0, 20),
            fatigueSignals: fatigueSignals.slice(0, 15),
            summary
        };
    }
}

module.exports = BiologicalShadowAnalyzer;
