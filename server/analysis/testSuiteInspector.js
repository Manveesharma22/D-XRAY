class TestSuiteInspector {
  analyze(tree, commits, packageJson) {
    const findings = {
      track: 'B',
      name: 'Test Suite',
      anatomical: 'The Ribcage',
      score: 100,
      details: {},
      issues: [],
      timeline: []
    };

    const files = tree.tree || [];
    
    // Find test files
    const testPatterns = [/\.test\./, /\.spec\./, /__tests__/, /test\//, /tests\//, /__test__/];
    const testFiles = files.filter(f => {
      if (f.type !== 'blob') return false;
      return testPatterns.some(p => p.test(f.path));
    });

    // Find source files (non-test, non-config)
    const sourcePatterns = [/\.(js|ts|jsx|tsx)$/];
    const excludePatterns = [/node_modules/, /\.test\./, /\.spec\./, /__tests__/, /config/, /\.config\./];
    const sourceFiles = files.filter(f => {
      if (f.type !== 'blob') return false;
      const isSource = sourcePatterns.some(p => p.test(f.path));
      const isExcluded = excludePatterns.some(p => p.test(f.path));
      return isSource && !isExcluded;
    });

    findings.details.totalFiles = files.filter(f => f.type === 'blob').length;
    findings.details.testFileCount = testFiles.length;
    findings.details.sourceFileCount = sourceFiles.length;
    findings.details.testRatio = sourceFiles.length > 0 ? Math.round((testFiles.length / sourceFiles.length) * 100) : 0;

    // Check test framework
    const testFrameworks = [];
    if (packageJson) {
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (allDeps.jest) testFrameworks.push('Jest');
      if (allDeps.mocha) testFrameworks.push('Mocha');
      if (allDeps.vitest) testFrameworks.push('Vitest');
      if (allDeps.cypress) testFrameworks.push('Cypress');
      if (allDeps.playwright) testFrameworks.push('Playwright');
      if (allDeps['@testing-library/react']) testFrameworks.push('React Testing Library');
      if (allDeps.ava) testFrameworks.push('AVA');
      if (allDeps.tape) testFrameworks.push('Tape');
      if (allDeps.uvu) testFrameworks.push('Uvu');
    }
    findings.details.frameworks = testFrameworks;
    findings.details.hasTestScript = !!(packageJson?.scripts?.test && !packageJson.scripts.test.includes('no test'));

    // Check for test config files
    const configFiles = files.filter(f => 
      f.type === 'blob' && (
        /jest\.config/.test(f.path) ||
        /vitest\.config/.test(f.path) ||
        /cypress\.config/.test(f.path) ||
        /\.mocharc/.test(f.path) ||
        /playwright\.config/.test(f.path)
      )
    );
    findings.details.configFiles = configFiles.map(f => f.path);

    // Scoring
    if (testFiles.length === 0) {
      findings.score = 15;
      findings.issues.push({
        severity: 'critical',
        message: 'No test files detected — the ribcage is completely missing',
        detail: 'Zero test coverage means every change is a gamble.'
      });
    } else {
      if (findings.details.testRatio < 10) {
        findings.score -= 30;
        findings.issues.push({
          severity: 'critical',
          message: `Test ratio critically low — ${findings.details.testRatio}% of source files have test counterparts`,
          detail: 'The ribcage has severe stress fractures consistent with a team that stopped trusting their own suite.'
        });
      } else if (findings.details.testRatio < 30) {
        findings.score -= 20;
        findings.issues.push({
          severity: 'warning',
          message: `Test coverage thin — only ${findings.details.testRatio}% test-to-source ratio`,
          detail: 'Many code paths are unprotected.'
        });
      } else if (findings.details.testRatio < 60) {
        findings.score -= 10;
        findings.issues.push({
          severity: 'info',
          message: `Moderate test coverage at ${findings.details.testRatio}% — room for improvement`,
          detail: 'Core paths are tested but gaps remain.'
        });
      } else {
        findings.issues.push({
          severity: 'good',
          message: `Strong test coverage at ${findings.details.testRatio}% — the ribcage is sturdy`,
          detail: 'Well-protected codebase with good test discipline.'
        });
      }
    }

    if (!findings.details.hasTestScript && testFiles.length > 0) {
      findings.score -= 10;
      findings.issues.push({
        severity: 'warning',
        message: 'Test files exist but no test script in package.json',
        detail: 'Tests may be difficult to run consistently.'
      });
    }

    if (testFrameworks.length === 0 && testFiles.length > 0) {
      findings.score -= 5;
      findings.issues.push({
        severity: 'info',
        message: 'Test framework not clearly identifiable from dependencies',
        detail: 'May use custom or non-standard testing setup.'
      });
    }

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }
}

module.exports = TestSuiteInspector;
