// immuneSystemAnalyzer.js — The Immune System Score
// Measures how quickly the codebase fights off infection

class ImmuneSystemAnalyzer {
    analyze(pullRequests, workflowRuns, commits) {
        const result = {
            immuneScore: 50,
            whiteCellSpeed: 'moderate',
            vulnerabilityLag: null,
            testFixLag: null,
            buildFixLag: null,
            metrics: [],
            finding: ''
        };

        let totalScore = 0;
        let scoreComponents = 0;

        // 1. Security PR response speed
        const securityPRs = (pullRequests || []).filter(pr => {
            const title = (pr.title || '').toLowerCase();
            const body = (pr.body || '').toLowerCase();
            const labels = (pr.labels || []).map(l => (l.name || '').toLowerCase());
            return title.includes('secur') || title.includes('vuln') || title.includes('cve') || title.includes('patch') ||
                body.includes('cve-') || labels.some(l => l.includes('secur') || l.includes('vuln'));
        });

        if (securityPRs.length > 0) {
            const mergedSec = securityPRs.filter(pr => pr.merged_at);
            if (mergedSec.length > 0) {
                const lagDays = mergedSec.map(pr => {
                    const created = new Date(pr.created_at).getTime();
                    const merged = new Date(pr.merged_at).getTime();
                    return (merged - created) / (1000 * 60 * 60 * 24);
                });
                const avgLag = lagDays.reduce((a, b) => a + b, 0) / lagDays.length;
                result.vulnerabilityLag = Math.round(avgLag);

                let secScore;
                if (avgLag <= 1) secScore = 95;
                else if (avgLag <= 3) secScore = 80;
                else if (avgLag <= 7) secScore = 60;
                else if (avgLag <= 14) secScore = 40;
                else if (avgLag <= 30) secScore = 20;
                else secScore = 5;

                totalScore += secScore;
                scoreComponents++;
                result.metrics.push({
                    label: 'Security patch speed',
                    value: `${Math.round(avgLag)} day avg`,
                    score: secScore,
                    status: secScore >= 60 ? 'healthy' : secScore >= 30 ? 'slow' : 'critical'
                });
            } else {
                // Security PRs exist but none merged
                const openCount = securityPRs.filter(pr => pr.state === 'open').length;
                if (openCount > 0) {
                    result.vulnerabilityLag = 999; // never fixed
                    totalScore += 5;
                    scoreComponents++;
                    result.metrics.push({
                        label: 'Security patches',
                        value: `${openCount} open, none merged`,
                        score: 5,
                        status: 'critical'
                    });
                }
            }
        }

        // 2. Build fix speed from workflow runs
        if (workflowRuns && workflowRuns.length > 0) {
            const runs = [...workflowRuns].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            let failStart = null;
            const breakDurations = [];

            runs.forEach(run => {
                if (run.conclusion === 'failure' && !failStart) {
                    failStart = new Date(run.created_at).getTime();
                } else if (run.conclusion === 'success' && failStart) {
                    const fixTime = new Date(run.created_at).getTime() - failStart;
                    breakDurations.push(fixTime / (1000 * 60 * 60)); // hours
                    failStart = null;
                }
            });

            if (breakDurations.length > 0) {
                const avgHours = breakDurations.reduce((a, b) => a + b, 0) / breakDurations.length;
                result.buildFixLag = Math.round(avgHours);

                let buildScore;
                if (avgHours <= 1) buildScore = 95;
                else if (avgHours <= 4) buildScore = 80;
                else if (avgHours <= 24) buildScore = 60;
                else if (avgHours <= 72) buildScore = 35;
                else buildScore = 10;

                totalScore += buildScore;
                scoreComponents++;
                result.metrics.push({
                    label: 'Broken build fix time',
                    value: avgHours < 1 ? '<1 hour avg' : `${Math.round(avgHours)} hours avg`,
                    score: buildScore,
                    status: buildScore >= 60 ? 'healthy' : buildScore >= 30 ? 'slow' : 'critical'
                });
            }
        }

        // 3. PR review-to-merge speed
        const mergedPRs = (pullRequests || []).filter(pr => pr.merged_at && pr.created_at);
        if (mergedPRs.length > 0) {
            const reviewLags = mergedPRs.slice(0, 20).map(pr => {
                const created = new Date(pr.created_at).getTime();
                const merged = new Date(pr.merged_at).getTime();
                return (merged - created) / (1000 * 60 * 60 * 24);
            });
            const avgReviewLag = reviewLags.reduce((a, b) => a + b, 0) / reviewLags.length;

            let reviewScore;
            if (avgReviewLag <= 0.5) reviewScore = 90;
            else if (avgReviewLag <= 1) reviewScore = 80;
            else if (avgReviewLag <= 3) reviewScore = 65;
            else if (avgReviewLag <= 7) reviewScore = 45;
            else if (avgReviewLag <= 14) reviewScore = 25;
            else reviewScore = 10;

            totalScore += reviewScore;
            scoreComponents++;
            result.metrics.push({
                label: 'PR review speed',
                value: `${avgReviewLag < 1 ? Math.round(avgReviewLag * 24) + ' hours' : Math.round(avgReviewLag) + ' days'} avg`,
                score: reviewScore,
                status: reviewScore >= 60 ? 'healthy' : reviewScore >= 30 ? 'moderate' : 'slow'
            });
        }

        // 4. Unreviewed self-merges (PRs merged without review)
        const selfMerges = (pullRequests || []).filter(pr =>
            pr.merged_at && pr.user?.login && pr.merged_by?.login === pr.user?.login
        );
        if (pullRequests && pullRequests.length > 0) {
            const selfMergeRate = selfMerges.length / pullRequests.length;
            let selfMergeScore;
            if (selfMergeRate < 0.05) selfMergeScore = 90;
            else if (selfMergeRate < 0.15) selfMergeScore = 70;
            else if (selfMergeRate < 0.3) selfMergeScore = 45;
            else if (selfMergeRate < 0.5) selfMergeScore = 20;
            else selfMergeScore = 5;

            totalScore += selfMergeScore;
            scoreComponents++;
            result.metrics.push({
                label: 'Self-merge rate',
                value: `${Math.round(selfMergeRate * 100)}% unreviewed`,
                score: selfMergeScore,
                status: selfMergeScore >= 60 ? 'healthy' : selfMergeScore >= 30 ? 'moderate' : 'compromised'
            });
        }

        // Calculate final immune score
        result.immuneScore = scoreComponents > 0 ? Math.round(totalScore / scoreComponents) : 50;

        // Determine white cell speed
        if (result.immuneScore >= 80) result.whiteCellSpeed = 'fast';
        else if (result.immuneScore >= 55) result.whiteCellSpeed = 'moderate';
        else if (result.immuneScore >= 30) result.whiteCellSpeed = 'slow';
        else result.whiteCellSpeed = 'absent';

        // Generate one-sentence finding
        const criticalMetrics = result.metrics.filter(m => m.status === 'critical' || m.status === 'compromised');
        if (result.immuneScore >= 80) {
            result.finding = `This codebase has a healthy immune system. Security patches merge quickly, builds are fixed fast, and bad code rarely slips through review.`;
        } else if (result.immuneScore >= 55) {
            result.finding = `This codebase has a moderate immune system. It responds to infections, but not quickly enough to prevent spread.`;
        } else if (result.immuneScore >= 30) {
            result.finding = `This codebase has a compromised immune system. Response to vulnerabilities and failures is slow — infections linger.`;
        } else {
            const vulnStr = result.vulnerabilityLag && result.vulnerabilityLag > 7
                ? ` It has ignored known vulnerabilities for an average of ${result.vulnerabilityLag} days each.`
                : '';
            result.finding = `This codebase has a severely compromised immune system. It cannot fight off infections effectively.${vulnStr}`;
        }

        return result;
    }
}

module.exports = ImmuneSystemAnalyzer;
