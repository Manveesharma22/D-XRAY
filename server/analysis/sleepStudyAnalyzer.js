// sleepStudyAnalyzer.js — The Sleep Study
// Analyzes when the codebase is most active and most broken

class SleepStudyAnalyzer {
    analyze(commits) {
        if (!commits || commits.length < 10) {
            return {
                hourlyActivity: new Array(24).fill(0),
                hourlyRevertRate: new Array(24).fill(0),
                peakHour: 10,
                bestHour: 10,
                worstHour: 23,
                incidentCorrelation: 0,
                wavePattern: [],
                finding: 'Insufficient commit history for sleep study analysis.'
            };
        }

        const hourlyActivity = new Array(24).fill(0);
        const hourlyReverts = new Array(24).fill(0);
        const hourlyCommits = new Array(24).fill(0);

        commits.forEach(commit => {
            const date = new Date(commit.commit?.author?.date);
            const hour = date.getUTCHours();
            const msg = (commit.commit?.message || '').toLowerCase();
            const isRevert = msg.startsWith('revert') || msg.includes('fix\n') || msg.includes('hotfix') ||
                msg.includes('rollback') || msg.includes('broke') || msg.includes('emergency');

            hourlyCommits[hour]++;
            if (isRevert) hourlyReverts[hour]++;
        });

        // Normalize activity to 0-100
        const maxCommits = Math.max(...hourlyCommits, 1);
        for (let i = 0; i < 24; i++) {
            hourlyActivity[i] = Math.round((hourlyCommits[i] / maxCommits) * 100);
        }

        // Calculate revert rate per hour
        const hourlyRevertRate = hourlyCommits.map((count, i) =>
            count > 0 ? Math.round((hourlyReverts[i] / count) * 100) : 0
        );

        // Find peak activity hour
        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));

        // Best hour: high activity, low revert rate
        const hourScores = hourlyActivity.map((activity, i) => ({
            hour: i,
            score: activity - hourlyRevertRate[i] * 2,
            activity,
            revertRate: hourlyRevertRate[i]
        })).filter(h => h.activity > 20); // only hours with meaningful activity

        hourScores.sort((a, b) => b.score - a.score);
        const bestHour = hourScores[0]?.hour ?? 10;
        const worstHour = hourScores[hourScores.length - 1]?.hour ?? 23;

        // Incident correlation: % of high-revert commits that happened after 6pm
        const afterHoursCommits = commits.filter(c => {
            const h = new Date(c.commit?.author?.date).getUTCHours();
            return h >= 18 || h <= 5;
        });
        const afterHoursReverts = afterHoursCommits.filter(c => {
            const msg = (c.commit?.message || '').toLowerCase();
            return msg.startsWith('revert') || msg.includes('hotfix') || msg.includes('rollback');
        });

        const totalReverts = commits.filter(c => {
            const msg = (c.commit?.message || '').toLowerCase();
            return msg.startsWith('revert') || msg.includes('hotfix') || msg.includes('rollback');
        }).length;

        const incidentCorrelation = totalReverts > 0
            ? Math.round((afterHoursReverts.length / totalReverts) * 100)
            : 0;

        // Generate EEG-style wave pattern (24 values representing amplitude)
        const wavePattern = hourlyActivity.map((v, i) => {
            const revert = hourlyRevertRate[i];
            if (v < 10) return { type: 'flatline', amplitude: 0 };
            if (revert > 30) return { type: 'crisis', amplitude: v };
            if (v > 60) return { type: 'deep_work', amplitude: v };
            return { type: 'normal', amplitude: v };
        });

        // Determine dominant pattern
        const crisisHours = wavePattern.filter(w => w.type === 'crisis').length;
        const deepWorkHours = wavePattern.filter(w => w.type === 'deep_work').length;

        const formatHour = (h) => {
            if (h === 0) return '12am';
            if (h < 12) return `${h}am`;
            if (h === 12) return '12pm';
            return `${h - 12}pm`;
        };

        let finding;
        if (incidentCorrelation >= 70) {
            finding = `This team does its best work around ${formatHour(bestHour)}. ${incidentCorrelation}% of incidents were introduced in commits made after 6pm. The codebase has a bedtime. Nobody is respecting it.`;
        } else if (incidentCorrelation >= 40) {
            finding = `Peak productivity at ${formatHour(bestHour)}. After-hours commits show ${incidentCorrelation}% higher incident rate — late commits carry risk.`;
        } else if (crisisHours >= 3) {
            finding = `${crisisHours} hours of the day show elevated crisis commit patterns. The team is frequently firefighting. Deep work windows are narrow.`;
        } else if (deepWorkHours >= 4) {
            finding = `Strong deep work pattern centered around ${formatHour(bestHour)}. This team has found a rhythm. Guard these hours carefully.`;
        } else {
            finding = `Commit activity peaks at ${formatHour(peakHour)}. Activity distribution is relatively even — no clear deep work window or consistent crisis times.`;
        }

        return {
            hourlyActivity,
            hourlyRevertRate,
            peakHour,
            bestHour,
            worstHour,
            incidentCorrelation,
            wavePattern,
            totalCommitsAnalyzed: commits.length,
            finding
        };
    }
}

module.exports = SleepStudyAnalyzer;
