class CIAnalyzer {
  analyze(workflows, workflowRuns, commits) {
    const findings = {
      track: 'A',
      name: 'CI / Build',
      anatomical: 'The Spine',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    // Check if CI exists
    if (!workflows.workflows || workflows.workflows.length === 0) {
      findings.score = 40;
      findings.issues.push({
        severity: 'critical',
        message: 'No CI/CD pipeline detected — the spine is missing',
        detail: 'Without automated builds, every deploy is a leap of faith.'
      });
      findings.details.hasCI = false;
      return findings;
    }

    findings.details.hasCI = true;
    findings.details.workflowCount = workflows.workflows.length;
    findings.details.workflows = workflows.workflows.map(w => ({
      name: w.name,
      state: w.state,
      path: w.path
    }));

    const runs = workflowRuns.workflow_runs || [];
    if (runs.length === 0) {
      findings.score = 60;
      findings.issues.push({
        severity: 'warning',
        message: 'CI configured but no recent runs detected',
        detail: 'The pipeline exists but may not be actively used.'
      });
      return findings;
    }

    // Analyze run patterns
    const recentRuns = runs.slice(0, 30);
    const failedRuns = recentRuns.filter(r => r.conclusion === 'failure');
    const successRuns = recentRuns.filter(r => r.conclusion === 'success');
    const flakyRatio = failedRuns.length / (recentRuns.length || 1);

    // Detect flaky patterns (runs that fail then succeed on retry)
    let flakySequences = 0;
    for (let i = 1; i < recentRuns.length; i++) {
      if (recentRuns[i].conclusion === 'failure' && recentRuns[i - 1].conclusion === 'success') {
        flakySequences++;
      }
    }

    findings.details.totalRuns = recentRuns.length;
    findings.details.failureRate = Math.round(flakyRatio * 100);
    findings.details.successRate = Math.round((successRuns.length / (recentRuns.length || 1)) * 100);
    findings.details.flakySequences = flakySequences;

    // Calculate build time (estimated from run duration if available)
    const durations = recentRuns
      .filter(r => r.run_started_at && r.updated_at)
      .map(r => (new Date(r.updated_at) - new Date(r.run_started_at)) / 1000 / 60);
    
    if (durations.length > 0) {
      findings.details.avgBuildTime = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      findings.details.maxBuildTime = Math.round(Math.max(...durations));
    }

    // Scoring
    if (flakyRatio > 0.4) {
      findings.score -= 30;
      findings.issues.push({
        severity: 'critical',
        message: `Severe CI inflammation — ${Math.round(flakyRatio * 100)}% failure rate detected`,
        detail: 'Builds are erratic. The team has likely stopped trusting the pipeline.'
      });
    } else if (flakyRatio > 0.2) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Moderate CI instability — ${Math.round(flakyRatio * 100)}% failure rate`,
        detail: 'Some builds are flaky, causing workflow disruption.'
      });
    }

    if (flakySequences > 3) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Flaky test pattern detected — ${flakySequences} failure-after-success sequences`,
        detail: 'Builds that pass then fail without code changes indicate flaky steps.'
      });
    }

    if (findings.details.avgBuildTime && findings.details.avgBuildTime > 15) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Build times averaging ${findings.details.avgBuildTime} minutes — no caching layer detected`,
        detail: 'Recommended: immediate pipeline surgery with aggressive parallelization.'
      });
    }

    if (findings.details.avgBuildTime && findings.details.avgBuildTime < 5) {
      findings.issues.push({
        severity: 'good',
        message: `Build times healthy at ${findings.details.avgBuildTime} minutes average`,
        detail: 'The spine is strong and responsive.'
      });
    }

    // Build timeline of CI health
    findings.timeline = recentRuns.slice(0, 10).map(r => ({
      date: r.created_at,
      status: r.conclusion,
      name: r.name || r.display_title
    }));

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = CIAnalyzer;
