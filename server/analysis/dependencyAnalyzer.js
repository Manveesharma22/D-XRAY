const axios = require('axios');

class DependencyAnalyzer {
  async analyze(packageJson, tree) {
    const findings = {
      track: 'E',
      name: 'Dependencies',
      anatomical: 'The Veins',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    if (!packageJson) {
      findings.score = 50;
      findings.issues.push({
        severity: 'warning',
        message: 'No package.json detected — cannot analyze dependency veins',
        detail: 'Dependency health is unknown.'
      });
      return findings;
    }

    const deps = { ...packageJson.dependencies };
    const devDeps = { ...packageJson.devDependencies };
    const allDeps = { ...deps, ...devDeps };
    const depNames = Object.keys(deps || {});
    const devDepNames = Object.keys(devDeps || {});

    findings.details.totalDependencies = Object.keys(allDeps).length;
    findings.details.productionDeps = depNames.length;
    findings.details.devDeps = devDepNames.length;

    // Check for known problematic packages
    const problematicPackages = {
      'moment': { reason: 'Large bundle size, use date-fns or dayjs instead', severity: 'warning' },
      'lodash': { reason: 'Consider lodash-es or individual imports for tree-shaking', severity: 'info' },
      'request': { reason: 'Deprecated — use axios, node-fetch, or got', severity: 'critical' },
      'node-fetch': { reason: 'v2 is EOL in many contexts — consider upgrading or using native fetch', severity: 'info' },
      'webpack': { reason: 'Consider Vite or esbuild for faster builds', severity: 'info' },
      'babel-core': { reason: 'Legacy — should be @babel/core', severity: 'critical' },
      'tslint': { reason: 'Deprecated — use ESLint with @typescript-eslint', severity: 'critical' },
    };

    const foundProblematic = [];
    for (const [pkg, info] of Object.entries(problematicPackages)) {
      if (allDeps[pkg]) {
        foundProblematic.push({ name: pkg, ...info });
      }
    }
    findings.details.problematicPackages = foundProblematic;

    // Check for outdated version patterns
    let outdatedCount = 0;
    const versionIssues = [];
    for (const [name, version] of Object.entries(allDeps)) {
      if (version && (version.startsWith('^0.') || version.startsWith('~0.'))) {
        outdatedCount++;
        versionIssues.push({ name, version, issue: 'Pre-1.0 version — API may be unstable' });
      }
      if (version && version.startsWith('git+')) {
        versionIssues.push({ name, version, issue: 'Git dependency — pinned to specific commit' });
      }
    }
    findings.details.outdatedVersionCount = outdatedCount;
    findings.details.versionIssues = versionIssues.slice(0, 10);

    // Bloat analysis
    if (Object.keys(allDeps).length > 50) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `Dependency bloat — ${Object.keys(allDeps).length} total packages`,
        detail: 'High dependency count increases attack surface and maintenance burden.'
      });
    } else if (Object.keys(allDeps).length > 100) {
      findings.score -= 25;
      findings.issues.push({
        severity: 'critical',
        message: `Severe dependency bloat — ${Object.keys(allDeps).length} packages in the veins`,
        detail: 'Every dependency is a liability. Consider surgical removal of unused packages.'
      });
    }

    // Check for duplicate functionality
    const hasAxios = !!allDeps.axios;
    const hasNodeFetch = !!allDeps['node-fetch'];
    const hasGot = !!allDeps.got;
    const httpClientCount = [hasAxios, hasNodeFetch, hasGot].filter(Boolean).length;
    if (httpClientCount > 1) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'warning',
        message: 'Multiple HTTP clients detected — dependency redundancy',
        detail: 'Consolidate to one HTTP library to reduce bloat.'
      });
    }

    // Vulnerability check (sample a few packages via OSV)
    let vulnCount = 0;
    const sampleDeps = depNames.slice(0, 5);
    for (const dep of sampleDeps) {
      try {
        const { data } = await axios.post('https://api.osv.dev/v1/query', {
          package: { name: dep, ecosystem: 'npm' }
        }, { timeout: 5000 });
        if (data.vulns && data.vulns.length > 0) {
          vulnCount += data.vulns.length;
          findings.issues.push({
            severity: 'critical',
            message: `Vulnerability detected in ${dep}: ${data.vulns[0].id}`,
            detail: data.vulns[0].summary || 'Security vulnerability found'
          });
        }
      } catch {}
    }
    findings.details.vulnerabilityCount = vulnCount;

    if (vulnCount > 0) {
      findings.score -= vulnCount * 10;
    }

    // Check for dev deps in production
    const devInProd = ['jest', 'mocha', 'eslint', 'prettier', 'typescript', 'webpack', 'vite'];
    const leaking = devInProd.filter(d => deps[d]);
    if (leaking.length > 0) {
      findings.score -= 5;
      findings.issues.push({
        severity: 'info',
        message: 'Dev dependencies in production deps',
        detail: `${leaking.join(', ')} should be in devDependencies.`
      });
    }

    if (foundProblematic.length > 0) {
      findings.score -= foundProblematic.filter(p => p.severity === 'critical').length * 10;
      findings.score -= foundProblematic.filter(p => p.severity === 'warning').length * 5;
    }

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = DependencyAnalyzer;
