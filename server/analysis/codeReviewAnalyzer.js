class CodeReviewAnalyzer {
  analyze(pullRequests, contributors) {
    const findings = {
      track: 'G',
      name: 'Code Review',
      anatomical: 'The Circulation',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    if (!pullRequests || pullRequests.length === 0) {
      findings.score = 50;
      findings.issues.push({
        severity: 'warning',
        message: 'No pull request data available — circulation unknown',
        detail: 'Cannot assess code review health without PR data.'
      });
      findings.details.hasPRData = false;
      return findings;
    }

    findings.details.hasPRData = true;
    findings.details.totalPRs = pullRequests.length;

    // PR state analysis
    const openPRs = pullRequests.filter(pr => pr.state === 'open');
    const closedPRs = pullRequests.filter(pr => pr.state === 'closed' && !pr.merged_at);
    const mergedPRs = pullRequests.filter(pr => pr.merged_at);

    findings.details.openPRs = openPRs.length;
    findings.details.mergedPRs = mergedPRs.length;
    findings.details.abandonedPRs = closedPRs.length;

    // Merge rate
    const mergeRate = mergedPRs.length / (pullRequests.length || 1);
    findings.details.mergeRate = Math.round(mergeRate * 100);

    // Time to merge analysis
    const mergeTimes = mergedPRs
      .filter(pr => pr.created_at && pr.merged_at)
      .map(pr => (new Date(pr.merged_at) - new Date(pr.created_at)) / (1000 * 60 * 60)); // hours

    if (mergeTimes.length > 0) {
      findings.details.avgTimeToMerge = Math.round(mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length);
      findings.details.medianTimeToMerge = Math.round(mergeTimes.sort((a, b) => a - b)[Math.floor(mergeTimes.length / 2)]);
    }

    // Reviewer load distribution
    const reviewersByPR = {};
    pullRequests.forEach(pr => {
      const reviewer = pr.user?.login || 'unknown';
      if (!reviewersByPR[reviewer]) reviewersByPR[reviewer] = 0;
      reviewersByPR[reviewer]++;
    });

    findings.details.prAuthors = Object.entries(reviewersByPR)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Check for review bottlenecks
    const topAuthor = findings.details.prAuthors[0];
    if (topAuthor && topAuthor.count > pullRequests.length * 0.5 && Object.keys(reviewersByPR).length > 1) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Review bottleneck — ${topAuthor.name} authored ${topAuthor.count} of ${pullRequests.length} PRs`,
        detail: 'Code review load is unevenly distributed.'
      });
    }

    // PR complexity
    const prSizes = pullRequests.map(pr => ({
      title: pr.title,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      changed: (pr.additions || 0) + (pr.deletions || 0),
      files: pr.changed_files || 0
    }));

    const avgChanges = prSizes.reduce((a, p) => a + p.changed, 0) / (prSizes.length || 1);
    const megaPRs = prSizes.filter(p => p.changed > 1000);
    const complexPRs = prSizes.filter(p => p.files > 20);

    findings.details.avgPRSize = Math.round(avgChanges);
    findings.details.megaPRCount = megaPRs.length;
    findings.details.complexPRCount = complexPRs.length;

    // Scoring
    if (closedPRs.length > mergedPRs.length * 0.3) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `${closedPRs.length} PRs abandoned without merge — circulation blocked`,
        detail: 'A significant number of PRs are being closed without merging, indicating wasted effort.'
      });
    }

    if (findings.details.avgTimeToMerge && findings.details.avgTimeToMerge > 72) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Average time to merge: ${findings.details.avgTimeToMerge} hours — slow circulation`,
        detail: 'PRs are sitting too long before review, creating stale branches and merge conflicts.'
      });
    }

    if (megaPRs.length > 0) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'warning',
        message: `${megaPRs.length} mega-PRs (>1000 lines) detected — reviewer overload risk`,
        detail: megaPRs.slice(0, 3).map(p => p.title).join('; ')
      });
    }

    if (openPRs.length > 10) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'warning',
        message: `${openPRs.length} open PRs — work-in-progress backlog growing`,
        detail: 'Many open PRs suggests review capacity issues.'
      });
    }

    // Timeline
    findings.timeline = pullRequests.slice(0, 10).map(pr => ({
      date: pr.created_at,
      title: pr.title,
      state: pr.merged_at ? 'merged' : pr.state,
      size: (pr.additions || 0) + (pr.deletions || 0)
    }));

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = CodeReviewAnalyzer;
