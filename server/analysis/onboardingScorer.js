class OnboardingScorer {
  analyze(tree, readme, packageJson, contributors, ghClient, owner, repo) {
    const findings = {
      track: 'D',
      name: 'Onboarding',
      anatomical: 'The Nervous System',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    const files = tree.tree || [];

    // Measure setup complexity
    let setupSteps = 0;
    let hasEnvExample = false;
    let hasDockerfile = false;
    let hasDockerCompose = false;
    let configFiles = [];
    let hasMonorepo = false;

    files.forEach(f => {
      if (f.type !== 'blob') return;
      const path = f.path.toLowerCase();
      
      if (path.includes('.env.example') || path.includes('.env.template') || path.includes('.env.sample')) hasEnvExample = true;
      if (path === 'dockerfile') hasDockerfile = true;
      if (path.includes('docker-compose')) hasDockerCompose = true;
      if (path.match(/lerna\.json|nx\.json|pnpm-workspace|turbo\.json/)) hasMonorepo = true;
      if (path.match(/\.(config|rc)\./)) configFiles.push(f.path);
    });

    // Count setup dependencies
    const allDeps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    const depCount = allDeps ? Object.keys(allDeps).length : 0;

    // Estimate time-to-first-commit
    let estimatedMinutes = 15; // base: clone and install
    estimatedMinutes += Math.min(depCount * 0.5, 30); // dependency install time
    if (!hasEnvExample && files.some(f => /\.env/.test(f.path))) estimatedMinutes += 15; // figure out env vars
    if (hasDockerfile) estimatedMinutes += 10; // docker setup
    if (hasMonorepo) estimatedMinutes += 15; // monorepo complexity
    setupSteps = Math.ceil(estimatedMinutes / 10);

    findings.details.estimatedTimeToFirstCommit = `${estimatedMinutes}-${estimatedMinutes + 15} minutes`;
    findings.details.setupSteps = setupSteps;
    findings.details.hasEnvExample = hasEnvExample;
    findings.details.hasDockerfile = hasDockerfile;
    findings.details.hasDockerCompose = hasDockerCompose;
    findings.details.dependencyCount = depCount;
    findings.details.configFileCount = configFiles.length;
    findings.details.hasMonorepo = hasMonorepo;

    // Tribal knowledge indicators
    const tribalKnowledgeSignals = [];
    if (!hasEnvExample && files.some(f => /\.env/.test(f.path))) {
      tribalKnowledgeSignals.push('Environment variables exist without documentation');
    }
    if (!readme || readme.length < 200) {
      tribalKnowledgeSignals.push('Minimal README — setup knowledge may be tribal');
    }
    if (configFiles.length > 5) {
      tribalKnowledgeSignals.push(`${configFiles.length} config files — complex configuration surface`);
    }

    findings.details.tribalKnowledgeSignals = tribalKnowledgeSignals;

    // Scoring
    if (estimatedMinutes > 45) {
      findings.score -= 30;
      findings.issues.push({
        severity: 'critical',
        message: `Onboarding time estimated at ${estimatedMinutes}+ minutes — nervous system overloaded`,
        detail: 'A new engineer joining Monday would need significant hand-holding.'
      });
    } else if (estimatedMinutes > 25) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Moderate onboarding complexity — ~${estimatedMinutes} minutes to first commit`,
        detail: 'Some friction exists for new team members.'
      });
    } else {
      findings.issues.push({
        severity: 'good',
        message: `Streamlined onboarding — ~${estimatedMinutes} minutes to first commit`,
        detail: 'New engineers can hit the ground running.'
      });
    }

    if (tribalKnowledgeSignals.length > 0) {
      findings.score -= tribalKnowledgeSignals.length * 8;
      findings.issues.push({
        severity: 'warning',
        message: `${tribalKnowledgeSignals.length} tribal knowledge dependencies detected`,
        detail: tribalKnowledgeSignals.join('; ')
      });
    }

    if (!hasEnvExample && files.some(f => /\.env/.test(f.path))) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'critical',
        message: '.env files exist without .env.example — critical tribal knowledge',
        detail: 'New engineers must ask someone what environment variables are needed.'
      });
    }

    // Contributor concentration (bus factor)
    if (contributors.length > 0) {
      const totalCommits = contributors.reduce((sum, c) => sum + c.contributions, 0);
      const topContributorCommits = contributors[0]?.contributions || 0;
      const busFactor = topContributorCommits / (totalCommits || 1);
      
      findings.details.busFactor = Math.round(busFactor * 100);
      findings.details.totalContributors = contributors.length;

      if (busFactor > 0.7) {
        findings.score -= 15;
        findings.issues.push({
          severity: 'critical',
          message: `Bus factor critical — ${Math.round(busFactor * 100)}% of commits from one person`,
          detail: 'Knowledge concentration creates massive onboarding risk.'
        });
      }
    }

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = OnboardingScorer;
