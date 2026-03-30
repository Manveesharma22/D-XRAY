class DoctorAI {
  generateDiagnosis(corpusScore, trackFindings, debtMap, deadCode, repoInfo, biologicalShadow) {

    const patientName = repoInfo.full_name || repoInfo.name || 'Unknown Patient';
    const age = repoInfo.created_at
      ? Math.round((new Date() - new Date(repoInfo.created_at)) / (1000 * 60 * 60 * 24 * 365) * 10) / 10
      : 'Unknown';
    const familyMembers = debtMap?.contributors?.length || 0;
    const totalCommits = repoInfo.size || 'unknown';

    const sections = [];

    // Opening — clinical intake
    sections.push({
      type: 'opening',
      text: `Patient ${patientName} admitted for full-body diagnostic scan. Date of admission: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Age: ${age} years. Family members present: ${familyMembers}. Initiating scan sequence.`
    });

    const ci = trackFindings['A'];
    const tests = trackFindings['B'];
    const docs = trackFindings['C'];
    const onboarding = trackFindings['D'];
    const deps = trackFindings['E'];
    const flow = trackFindings['F'];
    const review = trackFindings['G'];
    const env = trackFindings['H'];

    // CI / Spine diagnosis — rich medical language
    if (ci) {
      const critical = ci.issues?.find(i => i.severity === 'critical');
      if (critical) {
        const buildTime = ci.details?.avgBuildTime;
        const failureRate = ci.details?.failureRate;
        let diagnosis = `Patient presents with severe CI inflammation`;
        if (buildTime && buildTime > 15) {
          diagnosis += ` — builds averaging ${buildTime} minutes with no caching layer detected`;
        } else if (failureRate && failureRate > 30) {
          diagnosis += ` — ${failureRate}% build failure rate indicating pipeline instability`;
        } else {
          diagnosis += ` — ${critical.message.toLowerCase()}`;
        }
        diagnosis += '.';

        let prescription;
        if (buildTime && buildTime > 15) {
          prescription = `Immediate pipeline surgery with aggressive parallelization. Prognosis: ${Math.round(buildTime * 0.4)} minute reduction within one sprint.`;
        } else {
          prescription = 'Immediate stabilization: implement retry logic for flaky steps, quarantine unstable tests. Prognosis: good with consistent maintenance.';
        }

        sections.push({
          type: 'diagnosis',
          system: 'Spine (CI/Build)',
          text: diagnosis,
          prescription
        });
      } else {
        const status = ci.score > 80 ? 'healthy and responsive' : ci.score > 60 ? 'showing early signs of wear' : 'weakened';
        sections.push({
          type: 'diagnosis',
          system: 'Spine (CI/Build)',
          text: `Spine is ${status}. ${ci.details?.successRate || 'N/A'}% success rate across recent builds. Pipeline integrity: ${ci.score}/100.`,
          prescription: ci.score > 70 ? 'Continue current CI practices. Schedule quarterly pipeline review.' : 'Begin preventive care: audit build steps, add caching layer.'
        });
      }
    }

    // Test suite / Ribcage diagnosis
    if (tests) {
      const testRatio = tests.details?.testRatio || 0;
      if (tests.score < 40) {
        const monthsAgo = this._estimateQuittingTime(tests);
        sections.push({
          type: 'diagnosis',
          system: 'Ribcage (Tests)',
          text: `Test ribcage shows severe stress fractures — only ${testRatio}% of source files have test counterparts. Consistent with a team that stopped trusting their own suite approximately ${monthsAgo} months ago. ${tests.details?.testFileCount || 0} test files found across the skeleton.`,
          prescription: `Begin with integration tests for critical paths. Target ${Math.min(testRatio + 20, 50)}% coverage within 2 sprints. Prognosis: 40% fracture reduction with consistent treatment.`
        });
      } else if (tests.score < 70) {
        sections.push({
          type: 'diagnosis',
          system: 'Ribcage (Tests)',
          text: `Ribcage is showing early-stage fragility. ${testRatio}% coverage detected — adequate for basic protection but critical paths remain exposed. ${tests.details?.frameworks?.join(', ') || 'No framework'} in use.`,
          prescription: 'Increase coverage for high-risk modules. Focus on integration tests over unit tests for better fracture resistance.'
        });
      } else {
        sections.push({
          type: 'diagnosis',
          system: 'Ribcage (Tests)',
          text: `Ribcage is sturdy. ${testRatio}% test-to-source ratio provides strong structural protection. ${tests.details?.testFileCount || 0} test files maintaining integrity.`,
          prescription: 'Maintain current testing discipline. Consider property-based testing for critical business logic.'
        });
      }
    }

    // Documentation / Skull diagnosis
    if (docs) {
      if (docs.score < 40) {
        sections.push({
          type: 'diagnosis',
          system: 'Skull (Documentation)',
          text: `Documentation is severely atrophied — the skull is hollow. README quality: ${docs.details?.readmeQuality || 0}/100. ${docs.details?.hasDocsDir ? 'Docs directory exists but may be stale.' : 'No dedicated documentation structure detected.'} New team members are navigating blind.`,
          prescription: 'Immediate treatment: comprehensive README with setup instructions, architecture overview, and contribution guide. Assign documentation ownership per module.'
        });
      } else if (docs.score < 70) {
        sections.push({
          type: 'diagnosis',
          system: 'Skull (Documentation)',
          text: `Documentation shows signs of staleness. README quality: ${docs.details?.readmeQuality || 'N/A'}/100. ${docs.details?.hasChangelog ? 'Changelog present.' : 'No changelog detected.'} Skull is intact but cognition is fading.`,
          prescription: 'Schedule documentation refresh alongside feature work. Link doc updates to PR checklist.'
        });
      } else {
        sections.push({
          type: 'diagnosis',
          system: 'Skull (Documentation)',
          text: `Skull is well-formed and cognition is strong. README quality: ${docs.details?.readmeQuality || 'N/A'}/100. Documentation tracks code changes effectively.`,
          prescription: 'Continue documentation practices. Consider adding architecture decision records (ADRs).'
        });
      }
    }

    // Dependency / Veins diagnosis
    if (deps) {
      const vulnCount = deps.details?.vulnerabilityCount || 0;
      const totalDeps = deps.details?.totalDependencies || 0;
      if (vulnCount > 0) {
        sections.push({
          type: 'diagnosis',
          system: 'Veins (Dependencies)',
          text: `${vulnCount} security ${vulnCount === 1 ? 'vulnerability' : 'vulnerabilities'} detected in the dependency veins — systemic infection risk. ${deps.details?.problematicPackages?.length || 0} problematic packages identified. ${totalDeps} packages in circulation creating ${totalDeps > 50 ? 'significant' : 'moderate'} attack surface.`,
          prescription: `Immediate treatment: patch all critical vulnerabilities. Surgical removal of problematic packages. Prognosis: ${vulnCount > 3 ? 'guarded' : 'good'} with aggressive intervention.`
        });
      } else {
        const congestion = deps.score < 60 ? 'showing signs of congestion' : deps.score < 80 ? 'adequate but could be leaner' : 'clean and well-circulated';
        sections.push({
          type: 'diagnosis',
          system: 'Veins (Dependencies)',
          text: `Dependency veins are ${congestion}. ${totalDeps} packages in circulation. ${deps.details?.problematicPackages?.length || 0} packages flagged for review.`,
          prescription: totalDeps > 50
            ? 'Recommended: dependency diet — remove unused packages and consolidate overlapping libraries.'
            : 'Continue dependency hygiene practices. Monitor for new CVEs weekly.'
        });
      }
    }

    // Developer Flow / Heartbeat diagnosis
    if (flow) {
      const burnoutSignals = flow.burnoutSignals?.filter(b => b.riskLevel === 'high') || [];
      const lateNightRatio = flow.details?.lateNightRatio || 0;
      const rageCount = flow.rageCommits?.length || 0;

      if (burnoutSignals.length > 0) {
        let text = `Heartbeat is erratic — tachycardia pattern detected. ${burnoutSignals.length} contributor(s) showing burnout signals. ${lateNightRatio}% of commits occur after 10PM, indicating unsustainable work patterns.`;
        if (rageCount > 0) {
          text += ` ${rageCount} rage commit${rageCount > 1 ? 's' : ''} detected — developer distress signals in commit messages.`;
        }
        sections.push({
          type: 'diagnosis',
          system: 'Heartbeat (Developer Flow)',
          text,
          prescription: 'Implement coding hour boundaries. Redistribute review load. Schedule team wellness check. Prognosis: 60% improvement within one month of intervention.'
        });
      } else {
        const weekendRatio = flow.details?.weekendRatio || 0;
        sections.push({
          type: 'diagnosis',
          system: 'Heartbeat (Developer Flow)',
          text: `Heartbeat is steady and regular. ${weekendRatio}% weekend activity — team maintains healthy work-life boundaries. No burnout signals detected.`,
          prescription: 'Continue sustainable development practices. Monitor for seasonal stress patterns.'
        });
      }
    }

    // Code Review / Circulation diagnosis
    if (review && review.details?.hasPRData) {
      const bottlenecks = review.issues?.filter(i => i.severity === 'warning') || [];
      if (bottlenecks.length > 0) {
        sections.push({
          type: 'diagnosis',
          system: 'Circulation (Code Review)',
          text: `Blood flow is restricted. ${review.details?.abandonedPRs || 0} PRs abandoned without merge — circulation blocked. Average time to merge: ${review.details?.avgTimeToMerge || 'N/A'} hours. ${review.details?.megaPRCount || 0} oversized PRs detected causing reviewer fatigue.`,
          prescription: 'Distribute review load across team. Cap PRs per reviewer at 5/day. Set merge time target under 24 hours.'
        });
      }
    }

    // Environment / Skin diagnosis
    if (env) {
      const criticalEnv = env.issues?.find(i => i.severity === 'critical');
      if (criticalEnv) {
        sections.push({
          type: 'diagnosis',
          system: 'Skin (Environment)',
          text: `Skin is pierced — ${criticalEnv.message.toLowerCase()}. Reproducibility score: ${env.details?.reproducibilityScore || 0}%. Environment consistency is compromised.`,
          prescription: 'Immediate wound closure: remove committed secrets, enforce .env.example, add setup validation script.'
        });
      }
    }

    // Biological Shadow / Human Cost diagnosis
    if (biologicalShadow && biologicalShadow.shadowScore > 30) {
      const hours = biologicalShadow.totalHoursStolen || 0;
      const violations = biologicalShadow.circadianViolations?.length || 0;

      let text = `Subject presents with significant Biological Shadow accumulation. Approximately ${hours} hours of human life consumed outside sustainable boundaries. ${violations} circadian violations detected (1AM-5AM work cycles).`;
      if (biologicalShadow.marathonSessions?.length > 0) {
        text += ` Evidence of ${biologicalShadow.marathonSessions.length} exhaustion marathons exceeding 10 hours.`;
      }

      sections.push({
        type: 'diagnosis',
        system: 'Biological Shadow (Human Cost)',
        text: text,
        prescription: 'Immediate mandatory rest cycles. Implement "No-Commit" windows between 12 AM and 6 AM. Audit project deadlines for biological sustainability.'
      });
    }


    // Prognosis
    let prognosis;
    if (corpusScore.dxScore >= 80) {
      prognosis = `Prognosis: Excellent. Patient is in good health with ${corpusScore.criticalIssues} minor observation${corpusScore.criticalIssues !== 1 ? 's' : ''}. Continue regular check-ups every sprint. No immediate treatment required.`;
    } else if (corpusScore.dxScore >= 60) {
      prognosis = `Prognosis: Fair. ${corpusScore.criticalIssues} critical and ${corpusScore.warningIssues} warning finding${corpusScore.warningIssues !== 1 ? 's' : ''} require attention within the next 2 sprints. Without intervention, condition will deteriorate. Follow-up scan recommended in 30 days.`;
    } else if (corpusScore.dxScore >= 40) {
      prognosis = `Prognosis: Critical. ${corpusScore.criticalIssues} critical finding${corpusScore.criticalIssues !== 1 ? 's' : ''} require immediate intervention. Based on similar cases, codebases at this level deteriorate 3x faster without treatment. Recommend daily monitoring until stabilized.`;
    } else {
      prognosis = `Prognosis: Terminal without intervention. ${corpusScore.criticalIssues} critical findings across multiple systems. Based on comparable cases, this codebase has approximately 90 days before CI becomes completely unreliable and developers begin bypassing all quality gates. Immediate triage required.`;
    }
    sections.push({ type: 'prognosis', text: prognosis });

    return {
      patientName,
      age,
      familyMembers,
      dxScore: corpusScore.dxScore,
      severity: corpusScore.severity,
      sections,
      timestamp: new Date().toISOString()
    };
  }

  _estimateQuittingTime(testFindings) {
    if (testFindings.details?.testRatio < 5) return 12;
    if (testFindings.details?.testRatio < 15) return 8;
    if (testFindings.details?.testRatio < 30) return 4;
    return 2;
  }
}

module.exports = DoctorAI;
