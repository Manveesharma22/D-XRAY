/**
 * TimeBombAnalyzer — finds dependencies and patterns on a trajectory
 * to critical failure within 90 days. Returns countdown data.
 */

const VULN_SEVERITY_SCORE = { critical: 40, high: 25, moderate: 10, low: 3 };

function daysUntilCritical(trajectory) {
    // trajectory: 0–1 normalized progress toward failure
    if (trajectory >= 1) return 0;
    if (trajectory <= 0) return 999;
    return Math.round(90 * (1 - trajectory));
}

function detectDepTrajectory(packageJson, trackFindings) {
    const bombs = [];
    const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
    const depCount = Object.keys(deps).length;
    const vulns = trackFindings?.E?.details?.vulnerabilityCount || 0;
    const depScore = trackFindings?.E?.score ?? 100;

    // Vulnerability trajectory bomb
    if (vulns > 0) {
        const severity = vulns >= 10 ? 'critical' : vulns >= 5 ? 'high' : 'moderate';
        const trajectory = Math.min(0.99, vulns / 12);
        const days = daysUntilCritical(trajectory);
        if (days <= 90) {
            bombs.push({
                type: 'vulnerability_cascade',
                title: 'Dependency Vulnerability Cascade',
                description: `${vulns} known vulnerabilities. At current patch velocity, this crosses the critical threshold.`,
                days,
                severity,
                detail: `${vulns} CVEs unpatched. No fix → breach surface grows each week.`,
            });
        }
    }

    // Stale deps trajectory
    if (depScore < 40 && depCount > 5) {
        const trajectory = Math.min(0.99, (100 - depScore) / 100);
        const days = daysUntilCritical(trajectory * 0.7);
        if (days <= 90) {
            bombs.push({
                type: 'dependency_rot',
                title: 'Dependency Rot',
                description: `${depCount} dependencies with low freshness score. Supply chain risk accumulating daily.`,
                days,
                severity: depScore < 20 ? 'critical' : 'high',
                detail: 'Outdated deps = widening attack surface + future upgrade hell.',
            });
        }
    }

    return bombs;
}

function detectCITrajectory(trackFindings, commits) {
    const bombs = [];
    const ciScore = trackFindings?.A?.score ?? 100;

    if (ciScore < 35) {
        const trajectory = Math.min(0.99, (100 - ciScore) / 100 * 0.8);
        const days = daysUntilCritical(trajectory);
        if (days <= 90) {
            bombs.push({
                type: 'ci_collapse',
                title: 'CI Pipeline Collapse',
                description: `CI health is ${ciScore}/100 and declining. Developers will stop trusting the pipeline.`,
                days,
                severity: ciScore < 20 ? 'critical' : 'high',
                detail: 'When CI breaks fail silently, teams ship without tests. This precedes 6-month quality freefall.',
            });
        }
    }

    // Rage commit trajectory → burnout
    const rageCount = trackFindings?.F?.rageCommits?.length || 0;
    if (rageCount > 3) {
        const trajectory = Math.min(0.99, rageCount / 8);
        const days = daysUntilCritical(trajectory * 0.6);
        if (days <= 90) {
            bombs.push({
                type: 'developer_departure',
                title: 'Developer Departure Risk',
                description: `${rageCount} rage commit signals. Sustained burnout becomes resignation within weeks.`,
                days,
                severity: rageCount > 5 ? 'critical' : 'high',
                detail: 'Engineers who commit at 3am for months start sending their CVs at 9am.',
            });
        }
    }

    return bombs;
}

function detectTestTrajectory(trackFindings) {
    const bombs = [];
    const testScore = trackFindings?.B?.score ?? 100;

    if (testScore < 30) {
        const trajectory = Math.min(0.99, (100 - testScore) / 100 * 0.75);
        const days = daysUntilCritical(trajectory);
        if (days <= 90) {
            bombs.push({
                type: 'test_flakiness_crisis',
                title: 'Test Suite Collapse',
                description: `Test coverage at ${testScore}/100. Flakiness growing — CI will soon be meaningless noise.`,
                days,
                severity: testScore < 15 ? 'critical' : 'high',
                detail: 'Once developers ignore failing tests, the codebase is effectively running without a safety net.',
            });
        }
    }

    return bombs;
}

class TimeBombAnalyzer {
    analyze(trackFindings, packageJson, commits) {
        const allBombs = [
            ...detectDepTrajectory(packageJson, trackFindings),
            ...detectCITrajectory(trackFindings, commits),
            ...detectTestTrajectory(trackFindings),
        ];

        // Sort by nearest detonation
        allBombs.sort((a, b) => a.days - b.days);

        // Pick most urgent
        const primary = allBombs[0] || null;
        const triggered = allBombs.length > 0 && primary.days <= 90;

        return {
            triggered,
            bombs: allBombs,
            primary,
            totalThreats: allBombs.length,
            nearestDetonation: primary?.days ?? null,
        };
    }
}

module.exports = TimeBombAnalyzer;
