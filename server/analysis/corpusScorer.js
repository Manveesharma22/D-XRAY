class CorpusScorer {
  aggregate(trackFindings, debtMap, deadCode) {
    const tracks = Object.values(trackFindings);
    
    // Calculate overall DX score (weighted average)
    const weights = {
      'A': 0.15, // CI
      'B': 0.15, // Tests
      'C': 0.10, // Docs
      'D': 0.15, // Onboarding
      'E': 0.15, // Dependencies
      'F': 0.10, // Developer Flow
      'G': 0.10, // Code Review
      'H': 0.10  // Environment
    };

    let weightedSum = 0;
    let totalWeight = 0;

    tracks.forEach(t => {
      const weight = weights[t.track] || 0.1;
      weightedSum += (t.score || 50) * weight;
      totalWeight += weight;
    });

    const dxScore = Math.round(weightedSum / (totalWeight || 1));

    // Severity classification
    let severity;
    if (dxScore >= 80) severity = 'Healthy';
    else if (dxScore >= 60) severity = 'Fair';
    else if (dxScore >= 40) severity = 'Critical';
    else severity = 'Terminal';

    // Count total issues by severity
    const allIssues = tracks.flatMap(t => t.issues || []);
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const warningCount = allIssues.filter(i => i.severity === 'warning').length;
    const goodCount = allIssues.filter(i => i.severity === 'good').length;

    return {
      dxScore,
      severity,
      trackScores: tracks.map(t => ({
        track: t.track,
        name: t.name,
        anatomical: t.anatomical,
        score: t.score
      })),
      totalIssues: allIssues.length,
      criticalIssues: criticalCount,
      warningIssues: warningCount,
      goodFindings: goodCount,
      allIssues,
      deadCodeCount: deadCode?.totalDeadFiles || 0,
      contributorCount: debtMap?.contributors?.length || 0
    };
  }
}

module.exports = CorpusScorer;
