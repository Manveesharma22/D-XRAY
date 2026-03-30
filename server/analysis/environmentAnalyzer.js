class EnvironmentAnalyzer {
  analyze(tree, packageJson) {
    const findings = {
      track: 'H',
      name: 'Environment',
      anatomical: 'The Skin',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    const files = tree.tree || [];

    // Environment config files
    const envFiles = files.filter(f => f.type === 'blob' && /\.env/i.test(f.path));
    const configFiles = files.filter(f => f.type === 'blob' && /\.(config|rc)\./i.test(f.path));
    const dockerFiles = files.filter(f => f.type === 'blob' && /docker/i.test(f.path));
    const ciFiles = files.filter(f => f.type === 'blob' && /\.(yml|yaml)$/i.test(f.path) && (f.path.includes('.github/') || f.path.includes('.gitlab') || f.path.includes('ci/')));

    findings.details.envFiles = envFiles.map(f => f.path);
    findings.details.configFiles = configFiles.map(f => f.path).slice(0, 15);
    findings.details.dockerFiles = dockerFiles.map(f => f.path);
    findings.details.ciFiles = ciFiles.map(f => f.path);

    // Check for env example/template
    const hasEnvExample = envFiles.some(f => /example|template|sample/i.test(f.path));
    const hasEnvProd = envFiles.some(f => /prod/i.test(f.path));
    const hasEnvDev = envFiles.some(f => /dev/i.test(f.path));
    const hasEnvStaging = envFiles.some(f => /stag/i.test(f.path));

    findings.details.hasEnvExample = hasEnvExample;
    findings.details.hasEnvProd = hasEnvProd;
    findings.details.hasEnvDev = hasEnvDev;
    findings.details.hasEnvStaging = hasEnvStaging;

    // Check for committed secrets (red flag)
    const dangerousEnvFiles = envFiles.filter(f => !/example|template|sample/i.test(f.path));
    if (dangerousEnvFiles.length > 0) {
      findings.score -= 20;
      findings.issues.push({
        severity: 'critical',
        message: `${dangerousEnvFiles.length} .env file(s) committed to repository — skin is pierced`,
        detail: `Files: ${dangerousEnvFiles.map(f => f.path).join(', ')}. Secrets may be exposed.`
      });
    }

    // Reproducibility score
    let reproducibilityScore = 0;
    if (files.some(f => f.path === 'package-lock.json' || f.path === 'yarn.lock' || f.path === 'pnpm-lock.yaml')) reproducibilityScore += 25;
    if (dockerFiles.length > 0) reproducibilityScore += 25;
    if (hasEnvExample) reproducibilityScore += 25;
    if (ciFiles.length > 0) reproducibilityScore += 25;

    findings.details.reproducibilityScore = reproducibilityScore;

    // Check lock file
    const hasLockFile = files.some(f => /lock/i.test(f.path) && f.type === 'blob');
    if (!hasLockFile && packageJson) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: 'No lock file detected — build reproducibility at risk',
        detail: 'Without a lock file, different environments may resolve different dependency versions.'
      });
    }

    // Check for Docker
    if (dockerFiles.length === 0) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'info',
        message: 'No Docker configuration — environment consistency relies on manual setup',
        detail: 'Consider adding a Dockerfile for reproducible environments.'
      });
    }

    // Config complexity
    if (configFiles.length > 8) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'warning',
        message: `${configFiles.length} configuration files — high config surface area`,
        detail: 'Many config files increases the chance of environment drift.'
      });
    }

    // Environment drift indicators
    if (hasEnvProd && hasEnvDev && !hasEnvStaging) {
      findings.issues.push({
        severity: 'info',
        message: 'No staging environment configuration detected',
        detail: 'Changes go directly from dev to production.'
      });
    }

    if (reproducibilityScore === 100) {
      findings.issues.push({
        severity: 'good',
        message: 'Excellent reproducibility — the skin is intact',
        detail: 'Lock file, Docker, env examples, and CI all present.'
      });
    } else if (reproducibilityScore < 50) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Low reproducibility score (${reproducibilityScore}%) — skin is thin`,
        detail: 'New developers will struggle to reproduce the development environment.'
      });
    }

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = EnvironmentAnalyzer;
