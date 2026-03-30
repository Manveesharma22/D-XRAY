class DebtDiffuser {
  analyze(commits, contributors, tree, trackFindings) {
    const findings = {
      name: 'Debt Inheritance Map',
      score: 0,
      details: {},
      contributors: [],
      debtTimeline: [],
      blameEvents: [],
      chainOfCustody: [],
      totalDebtInSystem: 0
    };

    if (!commits || commits.length === 0) {
      findings.details.noData = true;
      return findings;
    }

    const files = tree.tree || [];
    const now = new Date();

    // Build contributor profiles with deep analysis
    const contributorMap = {};
    const commitsByFile = {}; // track who touched what and when
    const commitsByAuthor = {};

    // Pass 1: Build contributor map and file history
    commits.forEach((commit) => {
      const author = commit.commit?.author?.name || 'unknown';
      const login = commit.author?.login || author;
      const date = commit.commit?.author?.date;
      const message = commit.commit?.message || '';

      if (!contributorMap[login]) {
        contributorMap[login] = {
          name: author,
          login,
          avatar: commit.author?.avatar_url,
          totalCommits: 0,
          cleanupCommits: 0,
          testCommits: 0,
          refactorCommits: 0,
          choreCommits: 0,
          featureCommits: 0,
          fixCommits: 0,
          unsungFixes: [],
          commitDates: [],
          commitMessages: [],
          firstCommit: date,
          lastCommit: date,
          filesTouched: new Set(),
          lateNightCommits: 0,
          weekendCommits: 0
        };
      }

      const c = contributorMap[login];
      c.totalCommits++;
      c.commitDates.push(date);
      c.commitMessages.push({ message: message.split('\n')[0], date });
      if (date < c.firstCommit) c.firstCommit = date;
      if (date > c.lastCommit) c.lastCommit = date;

      const msg = message.toLowerCase();
      const commitDate = new Date(date);
      const hour = commitDate.getHours();
      const day = commitDate.getDay();

      if (hour >= 22 || hour < 5) c.lateNightCommits++;
      if (day === 0 || day === 6) c.weekendCommits++;

      if (msg.includes('fix') || msg.includes('bug') || msg.includes('patch') || msg.includes('resolve')) {
        c.fixCommits++;
        c.cleanupCommits++;
      }
      if (msg.includes('test') || msg.includes('spec') || msg.includes('coverage')) {
        c.testCommits++;
      }
      if (msg.includes('refactor') || msg.includes('clean') || msg.includes('reorganize')) {
        c.refactorCommits++;
      }
      if (msg.includes('chore') || msg.includes('deps') || msg.includes('update') || msg.includes('bump')) {
        c.choreCommits++;
      }
      if (msg.includes('feat') || msg.includes('add') || msg.includes('implement') || msg.includes('new')) {
        c.featureCommits++;
      }
    });

    // Pass 2: Analyze file ownership — who created files, who maintains them
    const fileOwnershipMap = {};
    files.forEach(f => {
      if (f.type !== 'blob' || !f.path) return;
      fileOwnershipMap[f.path] = { creators: [], maintainers: [], lastTouch: null, lastAuthor: null };
    });

    // Match commits to files using message patterns (we don't have file-level data per commit from REST API)
    // Use heuristic: author who commits most to a directory "owns" it
    const dirOwnership = {};
    commits.forEach(c => {
      const login = c.author?.login || c.commit?.author?.name || 'unknown';
      const msg = c.commit?.message || '';
      // Extract potential file references from commit messages
      const fileRefs = msg.match(/[a-zA-Z0-9_\-/]+\.[a-zA-Z0-9]+/g) || [];
      fileRefs.forEach(ref => {
        const dir = ref.split('/').slice(0, -1).join('/') || '/';
        if (!dirOwnership[dir]) dirOwnership[dir] = {};
        dirOwnership[dir][login] = (dirOwnership[dir][login] || 0) + 1;
      });
    });

    // Pass 3: Calculate debt metrics per contributor
    const totalCommitsAll = commits.length;
    const firstCommitDate = new Date(commits[commits.length - 1]?.commit?.author?.date || now);
    const projectAgeDays = Math.round((now - firstCommitDate) / (1000 * 60 * 60 * 24));

    for (const [login, c] of Object.entries(contributorMap)) {
      const tenureDays = Math.round((now - new Date(c.firstCommit)) / (1000 * 60 * 60 * 24));
      const proportion = c.totalCommits / (totalCommitsAll || 1);

      // Causal blame diffusion:
      // - Senior contributors (long tenure, high proportion) created more architectural decisions
      // - Recent joiners inherited most of the existing codebase
      // - Fix-heavy contributors are silently maintaining debt

      const seniorityFactor = Math.min(1, tenureDays / (projectAgeDays || 1));
      const contributionWeight = proportion;

      // Debt created: proportional to seniority and contribution share
      let debtCreated = Math.round(
        (seniorityFactor * 35) +
        (contributionWeight * 40) +
        (c.featureCommits > c.fixCommits ? 15 : 0)
      );

      // Debt inherited: higher for recent joiners, lower for originals
      let debtInherited = Math.round(
        ((1 - seniorityFactor) * 50) +
        ((1 - contributionWeight) * 30) +
        (tenureDays < 180 ? 20 : 0)
      );

      // Debt silently fixed: based on fix/refactor/chore ratio
      const maintenanceRatio = (c.fixCommits + c.refactorCommits + c.choreCommits) / (c.totalCommits || 1);
      let debtFixed = Math.round(maintenanceRatio * 100);

      // Clamp
      debtCreated = Math.max(0, Math.min(100, debtCreated));
      debtInherited = Math.max(0, Math.min(100, debtInherited));
      debtFixed = Math.max(0, Math.min(80, debtFixed));

      // Normalize so created + inherited ~= 100 (fixed is bonus)
      const total = debtCreated + debtInherited;
      if (total > 0 && total !== 100) {
        const scale = 100 / total;
        debtCreated = Math.round(debtCreated * scale);
        debtInherited = Math.round(debtInherited * scale);
      }

      // Build unsung fixes — specific named work
      const unsung = [];
      if (c.fixCommits > 3) unsung.push(`${c.fixCommits} bug fixes that kept the build alive`);
      if (c.refactorCommits > 2) unsung.push(`${c.refactorCommits} silent refactors no one reviewed`);
      if (c.testCommits > 2) unsung.push(`${c.testCommits} test commits — future incidents prevented`);
      if (c.choreCommits > 3) unsung.push(`${c.choreCommits} dependency updates — invisible maintenance`);
      if (c.lateNightCommits > 5) unsung.push(`${c.lateNightCommits} late-night commits — carrying the weight`);
      if (c.weekendCommits > 3) unsung.push(`${c.weekendCommits} weekend commits — giving time nobody asked for`);

      // Get specific unsung commit messages
      const fixMessages = c.commitMessages
        .filter(m => {
          const l = m.message.toLowerCase();
          return l.includes('fix') || l.includes('clean') || l.includes('refactor') || l.includes('patch');
        })
        .slice(0, 3)
        .map(m => `"${m.message.slice(0, 60)}${m.message.length > 60 ? '...' : ''}"`);

      c.debtCreated = debtCreated;
      c.debtInherited = debtInherited;
      c.debtFixed = debtFixed;
      c.tenureDays = tenureDays;
      c.unsungFixes = unsung;
      c.unsungCommits = fixMessages;
      c.maintenanceRatio = Math.round(maintenanceRatio * 100);
      c.seniorityFactor = Math.round(seniorityFactor * 100);
    }

    // Pass 4: Generate blame events — specific instances of inherited debt
    const blameEvents = [];
    for (const [login, c] of Object.entries(contributorMap)) {
      if (c.tenureDays > 90 || c.totalCommits < 3) continue; // focus on newer contributors

      // Find commits by this person that reference fixing others' code
      c.commitMessages.forEach(m => {
        const msg = m.message.toLowerCase();
        if (msg.includes('fix') && (msg.includes('ci') || msg.includes('build') || msg.includes('pipeline') || msg.includes('broken'))) {
          blameEvents.push({
            author: login,
            message: m.message.slice(0, 80),
            date: m.date,
            type: 'inherited_ci_blame',
            description: `${login} fixed a CI/build issue that predates their tenure`
          });
        }
      });

      // Counterfactual: if they have low feature commits but high fix commits, they inherited debt
      if (c.fixCommits > c.featureCommits * 1.5 && c.totalCommits > 5) {
        blameEvents.push({
          author: login,
          type: 'counterfactual_analysis',
          description: `${login} has ${c.fixCommits} fixes vs ${c.featureCommits} features — they're maintaining, not creating`,
          ratio: `${c.fixCommits}:${c.featureCommits}`
        });
      }
    }
    findings.blameEvents = blameEvents.slice(0, 10);

    // Pass 5: Build chain of custody — debt lineage
    const sortedContributors = Object.values(contributorMap).sort((a, b) =>
      new Date(a.firstCommit) - new Date(b.firstCommit)
    );

    const chainOfCustody = [];
    for (let i = 1; i < sortedContributors.length; i++) {
      const current = sortedContributors[i];
      const predecessors = sortedContributors.slice(0, i);
      const totalPredecessorDebt = predecessors.reduce((s, p) => s + p.debtCreated, 0);

      if (totalPredecessorDebt > 20) {
        chainOfCustody.push({
          carrier: current.login,
          inheritedFrom: predecessors.map(p => p.login),
          totalDebtInherited: Math.round(totalPredecessorDebt / predecessors.length),
          description: `${current.login} inherited work from ${predecessors.length} predecessor${predecessors.length > 1 ? 's' : ''}: ${predecessors.slice(0, 3).map(p => '@' + p.login).join(', ')}`
        });
      }
    }
    findings.chainOfCustody = chainOfCustody;

    // Output
    findings.contributors = Object.values(contributorMap).map(c => ({
      name: c.name,
      login: c.login,
      avatar: c.avatar,
      totalCommits: c.totalCommits,
      tenure: c.tenureDays,
      debtCreated: c.debtCreated,
      debtInherited: c.debtInherited,
      debtFixed: c.debtFixed,
      unsungFixes: c.unsungFixes,
      unsungCommits: c.unsungCommits,
      cleanupCommits: c.cleanupCommits,
      refactorCommits: c.refactorCommits,
      testCommits: c.testCommits,
      featureCommits: c.featureCommits,
      fixCommits: c.fixCommits,
      lateNightCommits: c.lateNightCommits,
      weekendCommits: c.weekendCommits,
      maintenanceRatio: c.maintenanceRatio,
      seniorityFactor: c.seniorityFactor,
      firstCommit: c.firstCommit,
      lastCommit: c.lastCommit
    })).sort((a, b) => b.totalCommits - a.totalCommits);

    findings.totalDebtInSystem = findings.contributors.reduce((s, c) => s + c.debtCreated, 0);
    findings.details.totalContributors = findings.contributors.length;
    findings.details.projectAgeDays = projectAgeDays;

    // Debt timeline
    const monthlyDebt = {};
    commits.forEach(c => {
      const month = c.commit?.author?.date?.slice(0, 7);
      if (month) {
        if (!monthlyDebt[month]) monthlyDebt[month] = { month, commits: 0, fixes: 0, features: 0 };
        monthlyDebt[month].commits++;
        const msg = (c.commit?.message || '').toLowerCase();
        if (msg.includes('fix') || msg.includes('refactor') || msg.includes('clean')) monthlyDebt[month].fixes++;
        if (msg.includes('feat') || msg.includes('add') || msg.includes('new')) monthlyDebt[month].features++;
      }
    });
    findings.debtTimeline = Object.values(monthlyDebt).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

    return findings;
  }
}

module.exports = DebtDiffuser;
