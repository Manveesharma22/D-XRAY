const RAGE_KEYWORDS = [
  'fix this garbage', 'hate', 'stupid', 'terrible', 'awful', 'nightmare',
  'kill', 'die', 'murder', 'scream', 'why does', 'makes no sense',
  'wtf', 'ffs', 'ugh', 'screw this', 'give up', 'broken again',
  'temp fix', 'hack', 'workaround', 'please work', 'for the love',
  'i quit', 'never again', 'worst', 'disaster', 'cluster',
  'dumpster fire', 'garbage', 'trash', 'useless', 'pointless'
];

const DESPERATION_PHRASES = [
  'final', 'actual', 'real fix', 'this time', 'please', 'actually',
  'idk why', 'somehow', 'no idea', 'magic', 'black magic',
  'just work', 'come on'
];

class DeveloperFlowAnalyzer {
  analyze(commits, contributors, pullRequests) {
    const findings = {
      track: 'F',
      name: 'Developer Flow',
      anatomical: 'The Heartbeat',
      score: 100,
      details: {},
      issues: [],
      timeline: [],
      burnoutSignals: [],
      rageCommits: []
    };

    if (!commits || commits.length === 0) {
      findings.score = 50;
      findings.issues.push({
        severity: 'warning',
        message: 'No commit history available for flow analysis',
        detail: 'Cannot assess developer health without commit data.'
      });
      return findings;
    }

    // Analyze commit timing patterns
    const commitHours = [];
    const commitDays = [];
    const commitDates = [];

    commits.forEach(c => {
      if (c.commit?.author?.date) {
        const date = new Date(c.commit.author.date);
        commitHours.push(date.getHours());
        commitDays.push(date.getDay());
        commitDates.push(date);
      }
    });

    // Late night commits (10pm - 6am)
    const lateNightCommits = commitHours.filter(h => h >= 22 || h < 6).length;
    const lateNightRatio = lateNightCommits / (commitHours.length || 1);

    // Weekend commits
    const weekendCommits = commitDays.filter(d => d === 0 || d === 6).length;
    const weekendRatio = weekendCommits / (commitDays.length || 1);

    // Commit frequency analysis
    const commitsByAuthor = {};
    commits.forEach(c => {
      const author = c.commit?.author?.name || c.author?.login || 'unknown';
      if (!commitsByAuthor[author]) commitsByAuthor[author] = { count: 0, hours: [], dates: [], messages: [] };
      commitsByAuthor[author].count++;
      if (c.commit?.author?.date) {
        const d = new Date(c.commit.author.date);
        commitsByAuthor[author].hours.push(d.getHours());
        commitsByAuthor[author].dates.push(d);
      }
      commitsByAuthor[author].messages.push({
        message: c.commit?.message?.split('\n')[0] || '',
        date: c.commit?.author?.date,
        hour: new Date(c.commit?.author?.date || 0).getHours()
      });
    });

    findings.details.totalCommits = commits.length;
    findings.details.lateNightCommits = lateNightCommits;
    findings.details.lateNightRatio = Math.round(lateNightRatio * 100);
    findings.details.weekendCommits = weekendCommits;
    findings.details.weekendRatio = Math.round(weekendRatio * 100);
    findings.details.activeContributors = Object.keys(commitsByAuthor).length;

    // RAGE COMMIT DETECTOR
    const rageCommits = [];
    for (const [author, data] of Object.entries(commitsByAuthor)) {
      // Sort messages by date
      const sortedMessages = data.messages
        .filter(m => m.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Detect rage patterns: angry messages + late night
      sortedMessages.forEach((msg, idx) => {
        const lower = msg.message.toLowerCase();
        const isLateNight = msg.hour >= 22 || msg.hour < 4;
        const hasRageKeyword = RAGE_KEYWORDS.some(kw => lower.includes(kw));
        const hasDesperation = DESPERATION_PHRASES.some(phrase => lower.includes(phrase));

        // Check for rapid-fire commits (burst) around this message
        let nearbyCommits = 0;
        for (let j = Math.max(0, idx - 3); j < Math.min(sortedMessages.length, idx + 4); j++) {
          if (j !== idx) {
            const diff = Math.abs(new Date(sortedMessages[j].date) - new Date(msg.date)) / (1000 * 60);
            if (diff < 60) nearbyCommits++;
          }
        }

        if (hasRageKeyword && (isLateNight || nearbyCommits > 2)) {
          rageCommits.push({
            author,
            message: msg.message,
            date: msg.date,
            hour: msg.hour,
            isLateNight,
            burstCommits: nearbyCommits,
            severity: hasRageKeyword && isLateNight && nearbyCommits > 2 ? 'extreme' :
                     hasRageKeyword && isLateNight ? 'high' : 'moderate'
          });
        } else if (hasDesperation && isLateNight) {
          rageCommits.push({
            author,
            message: msg.message,
            date: msg.date,
            hour: msg.hour,
            isLateNight,
            burstCommits: nearbyCommits,
            severity: 'desperate'
          });
        }
      });
    }
    findings.rageCommits = rageCommits.slice(0, 10);

    if (rageCommits.length > 0) {
      const extremeRage = rageCommits.filter(r => r.severity === 'extreme' || r.severity === 'high');
      if (extremeRage.length > 0) {
        findings.score -= 10;
        const sample = extremeRage[0];
        const date = new Date(sample.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        findings.issues.push({
          severity: 'warning',
          message: `Someone was having a very bad night on ${date}`,
          detail: `${extremeRage.length} rage commits detected — late-night angry commits with burst patterns`,
          rageDetail: sample
        });
      }
    }

    // Burnout signals per contributor
    const contributorBurnout = [];
    for (const [author, data] of Object.entries(commitsByAuthor)) {
      const authorLateNight = data.hours.filter(h => h >= 22 || h < 6).length;
      const authorLateNightRatio = authorLateNight / (data.hours.length || 1);
      
      const dates = data.dates.sort((a, b) => a - b);
      let maxBurst = 0;
      for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60);
        if (diff < 1) maxBurst++;
      }

      const signals = [];
      if (authorLateNightRatio > 0.3) signals.push('Frequent late-night commits');
      if (data.count > commits.length * 0.5 && Object.keys(commitsByAuthor).length > 1) signals.push('Disproportionate commit burden');
      if (maxBurst > 5) signals.push('Commit burst pattern (stress indicator)');

      // Check if this author has rage commits
      const authorRage = rageCommits.filter(r => r.author === author);
      if (authorRage.length > 1) signals.push('Multiple rage commits detected');

      if (signals.length > 0) {
        contributorBurnout.push({
          author,
          commitCount: data.count,
          signals,
          riskLevel: signals.length >= 2 ? 'high' : 'moderate',
          rageCommits: authorRage.length
        });
      }
    }
    findings.details.contributorBurnout = contributorBurnout;
    findings.burnoutSignals = contributorBurnout;

    // PR size analysis
    if (pullRequests && pullRequests.length > 0) {
      const prSizes = pullRequests.map(pr => (pr.additions || 0) + (pr.deletions || 0));
      const avgPrSize = prSizes.reduce((a, b) => a + b, 0) / (prSizes.length || 1);
      const largePRs = prSizes.filter(s => s > 500).length;

      findings.details.avgPrSize = Math.round(avgPrSize);
      findings.details.largePRCount = largePRs;
      findings.details.totalPRs = pullRequests.length;

      if (avgPrSize > 500) {
        findings.score -= 15;
        findings.issues.push({
          severity: 'warning',
          message: `Large PRs averaging ${Math.round(avgPrSize)} lines — context switching risk`,
          detail: 'Large PRs are harder to review and more likely to introduce bugs.'
        });
      }

      if (largePRs > pullRequests.length * 0.3) {
        findings.score -= 10;
        findings.issues.push({
          severity: 'warning',
          message: `${largePRs} oversized PRs detected — review fatigue likely`,
          detail: 'Reviewers may be rubber-stamping large changes.'
        });
      }
    }

    // Scoring
    if (lateNightRatio > 0.3) {
      findings.score -= 20;
      findings.issues.push({
        severity: 'critical',
        message: `${Math.round(lateNightRatio * 100)}% of commits happen after 10PM — burnout risk high`,
        detail: 'The team is coding at unsustainable hours. The heartbeat is erratic.'
      });
    }

    if (weekendRatio > 0.2) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'warning',
        message: `${Math.round(weekendRatio * 100)}% of commits on weekends — work-life imbalance`,
        detail: 'Weekend work has become normalized.'
      });
    }

    if (contributorBurnout.filter(c => c.riskLevel === 'high').length > 0) {
      findings.score -= 15;
      findings.issues.push({
        severity: 'critical',
        message: `${contributorBurnout.filter(c => c.riskLevel === 'high').length} contributor(s) showing burnout signals`,
        detail: contributorBurnout.filter(c => c.riskLevel === 'high').map(c => `${c.author}: ${c.signals.join(', ')}`).join('; ')
      });
    }

    // Commit time distribution for timeline
    findings.timeline = this._buildCommitTimeline(commits);

    findings.score = Math.max(0, Math.min(100, findings.score));
    return findings;
  }

  _buildCommitTimeline(commits) {
    const timeline = {};
    commits.forEach(c => {
      if (c.commit?.author?.date) {
        const week = new Date(c.commit.author.date).toISOString().slice(0, 10);
        timeline[week] = (timeline[week] || 0) + 1;
      }
    });
    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 20);
  }
}

module.exports = DeveloperFlowAnalyzer;
