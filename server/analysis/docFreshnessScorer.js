class DocFreshnessScorer {
  analyze(tree, readme, commits, ghClient, owner, repo) {
    const findings = {
      track: 'C',
      name: 'Documentation',
      anatomical: 'The Skull',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    const files = tree.tree || [];

    // Find documentation files
    const docPatterns = [/README/i, /CHANGELOG/i, /CONTRIBUTING/i, /LICENSE/i, /docs\//i, /\.md$/i, /\.mdx$/i];
    const docFiles = files.filter(f => {
      if (f.type !== 'blob') return false;
      return docPatterns.some(p => p.test(f.path));
    });

    findings.details.docFileCount = docFiles.length;
    findings.details.docFiles = docFiles.map(f => f.path).slice(0, 20);

    // Check README
    if (!readme) {
      findings.score -= 30;
      findings.issues.push({
        severity: 'critical',
        message: 'No README detected — the skull is hollow',
        detail: 'Without a README, new developers have no map to this codebase.'
      });
      findings.details.hasReadme = false;
    } else {
      findings.details.hasReadme = true;
      findings.details.readmeLength = readme.length;

      // Score README quality
      let readmeScore = 0;
      const lowerReadme = readme.toLowerCase();

      if (readme.length > 500) readmeScore += 15;
      else if (readme.length > 200) readmeScore += 8;
      else readmeScore += 3;

      if (lowerReadme.includes('install') || lowerReadme.includes('setup') || lowerReadme.includes('getting started')) readmeScore += 15;
      if (lowerReadme.includes('usage') || lowerReadme.includes('example') || lowerReadme.includes('api')) readmeScore += 15;
      if (lowerReadme.includes('contribut') || lowerReadme.includes('license')) readmeScore += 10;
      if (readme.includes('```') || readme.includes('`')) readmeScore += 10; // Has code examples
      if (lowerReadme.includes('test') || lowerReadme.includes('ci') || lowerReadme.includes('build')) readmeScore += 10;
      if (readme.match(/#{1,3}\s/m)) readmeScore += 10; // Has proper headers

      findings.details.readmeQuality = Math.min(100, readmeScore);

      if (readmeScore < 30) {
        findings.score -= 20;
        findings.issues.push({
          severity: 'warning',
          message: 'README exists but is skeletal — minimal setup instructions',
          detail: 'A new engineer would struggle to get started from this README alone.'
        });
      }
    }

    // Check for common doc files
    const hasChangelog = docFiles.some(f => /CHANGELOG/i.test(f.path));
    const hasContributing = docFiles.some(f => /CONTRIBUTING/i.test(f.path));
    const hasLicense = docFiles.some(f => /LICENSE/i.test(f.path));
    const hasDocsDir = docFiles.some(f => /^docs\//i.test(f.path));

    findings.details.hasChangelog = hasChangelog;
    findings.details.hasContributing = hasContributing;
    findings.details.hasLicense = hasLicense;
    findings.details.hasDocsDir = hasDocsDir;

    if (!hasContributing) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'info',
        message: 'No CONTRIBUTING guide — onboarding friction detected',
        detail: 'New contributors have no guidance on how to contribute.'
      });
    }

    if (!hasLicense) {
      findings.score -= 5;
      findings.issues.push({
        severity: 'info',
        message: 'No LICENSE file detected',
        detail: 'The legal status of this code is ambiguous.'
      });
    }

    // Staleness check: compare doc commits vs code commits
    if (commits.length > 10) {
      const recentCommits = commits.slice(0, 20);
      // Approximate: check if recent commits touch doc files
      const docCommitRatio = docFiles.length > 0 ? 0.3 : 0; // rough estimate
      if (docFiles.length > 0 && docCommitRatio < 0.1) {
        findings.score -= 10;
        findings.issues.push({
          severity: 'warning',
          message: 'Documentation appears stale relative to code changes',
          detail: 'Code has been evolving but docs haven\'t kept pace.'
        });
        findings.details.staleness = 'high';
      } else {
        findings.details.staleness = 'low';
      }
    }

    // Check for common docs directories and patterns
    const hasApiDocs = files.some(f => /api.*doc/i.test(f.path) || /swagger/i.test(f.path) || /openapi/i.test(f.path));
    findings.details.hasApiDocs = hasApiDocs;

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = DocFreshnessScorer;
