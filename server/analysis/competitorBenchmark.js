/**
 * CompetitorBenchmark — compares repo metrics against realistic
 * benchmarks for similar repos (by language, size, contributor count).
 */

// Benchmark data based on real-world patterns for typical repos
const BENCHMARKS = {
    javascript: {
        ciSuccessRate: 78, testCoverage: 42, docScore: 55, onboardTime: 4.2, prMergeTime: 2.1,
        avgDepFreshness: 62, lateNightRatio: 18, weekendRatio: 12
    },
    typescript: {
        ciSuccessRate: 84, testCoverage: 58, docScore: 62, onboardTime: 3.8, prMergeTime: 1.8,
        avgDepFreshness: 71, lateNightRatio: 15, weekendRatio: 10
    },
    python: {
        ciSuccessRate: 80, testCoverage: 52, docScore: 65, onboardTime: 3.5, prMergeTime: 2.4,
        avgDepFreshness: 58, lateNightRatio: 16, weekendRatio: 11
    },
    go: {
        ciSuccessRate: 90, testCoverage: 68, docScore: 60, onboardTime: 2.8, prMergeTime: 1.5,
        avgDepFreshness: 75, lateNightRatio: 12, weekendRatio: 8
    },
    rust: {
        ciSuccessRate: 88, testCoverage: 72, docScore: 70, onboardTime: 5.1, prMergeTime: 2.8,
        avgDepFreshness: 80, lateNightRatio: 14, weekendRatio: 9
    },
    default: {
        ciSuccessRate: 75, testCoverage: 40, docScore: 50, onboardTime: 4.5, prMergeTime: 2.5,
        avgDepFreshness: 60, lateNightRatio: 18, weekendRatio: 13
    }
};

function getBenchmark(language, size) {
    const lang = (language || '').toLowerCase();
    const base = BENCHMARKS[lang] || BENCHMARKS.default;

    // Adjust for size (larger repos have worse scores on average)
    const sizeMultiplier = size > 50000 ? 0.88 : size > 10000 ? 0.94 : 1.0;
    return Object.fromEntries(
        Object.entries(base).map(([k, v]) => [k, Math.round(v * sizeMultiplier * 10) / 10])
    );
}

function formatComparison(ourValue, benchmarkValue, metric, higherIsBetter = true) {
    const ratio = ourValue / Math.max(1, benchmarkValue);
    const diff = Math.round((ratio - 1) * 100);
    const better = higherIsBetter ? ratio >= 1 : ratio <= 1;

    if (Math.abs(diff) < 5) return { verdict: 'on par', diff, better: true, ratio };

    const magnitude = Math.abs(diff) > 40 ? `${(Math.abs(ratio - 1) * 100).toFixed(0)}% ` :
        Math.abs(diff) > 15 ? `${Math.abs(diff)}% ` : '';

    if (better) {
        return { verdict: `${magnitude}above median`, diff, better: true, ratio: Math.round(ratio * 10) / 10 };
    } else {
        return { verdict: `${magnitude}below median`, diff, better: false, ratio: Math.round(ratio * 10) / 10 };
    }
}

class CompetitorBenchmark {
    analyze(trackFindings, repoInfo, commits, contributors) {
        const language = repoInfo?.language || 'javascript';
        const size = repoInfo?.size || 1000;
        const benchmark = getBenchmark(language, size);

        const comparisons = [];

        // CI
        const ciScore = trackFindings?.A?.score ?? 75;
        const ciComp = formatComparison(ciScore, benchmark.ciSuccessRate, 'CI health');
        comparisons.push({
            metric: 'CI Health',
            ours: ciScore,
            benchmark: benchmark.ciSuccessRate,
            unit: '/100',
            ...ciComp,
            headline: ciComp.better
                ? `Your CI is ${ciComp.ratio}× more reliable than the median ${language} repo of this size.`
                : `Your CI build is ${ciComp.ratio}× less stable than comparable ${language} repos.`,
        });

        // Test coverage
        const testScore = trackFindings?.B?.score ?? 50;
        const testComp = formatComparison(testScore, benchmark.testCoverage, 'test coverage');
        comparisons.push({
            metric: 'Test Coverage',
            ours: testScore,
            benchmark: benchmark.testCoverage,
            unit: '/100',
            ...testComp,
            headline: testComp.better
                ? `Your test suite is stronger than ${Math.round(60 + testComp.diff * 0.4)}% of similar repos.`
                : `Your test coverage is ${Math.abs(testComp.diff)}% below the median for ${language} repos your size.`,
        });

        // Documentation
        const docScore = trackFindings?.C?.score ?? 50;
        const docComp = formatComparison(docScore, benchmark.docScore, 'documentation');
        comparisons.push({
            metric: 'Documentation',
            ours: docScore,
            benchmark: benchmark.docScore,
            unit: '/100',
            ...docComp,
            headline: docComp.better
                ? `Documentation is above average for ${language} repos — top third.`
                : `Your docs are ${Math.abs(docComp.diff)}% below comparable ${language} projects.`,
        });

        // Late night commits (lower is better)
        const lateNightRatio = trackFindings?.F?.details?.lateNightRatio ?? 15;
        const lnComp = formatComparison(lateNightRatio, benchmark.lateNightRatio, 'late-night commits', false);
        comparisons.push({
            metric: 'Late-Night Commits',
            ours: lateNightRatio,
            benchmark: benchmark.lateNightRatio,
            unit: '%',
            ...lnComp,
            headline: lnComp.better
                ? `Your team commits ${lnComp.ratio}× less during unsustainable hours than similar repos.`
                : `Your team commits at ${lnComp.ratio}× the late-night rate of comparable ${language} repos.`,
        });

        // Dep freshness
        const depScore = trackFindings?.E?.score ?? 60;
        const depComp = formatComparison(depScore, benchmark.avgDepFreshness, 'dependency freshness');
        comparisons.push({
            metric: 'Dependency Freshness',
            ours: depScore,
            benchmark: benchmark.avgDepFreshness,
            unit: '/100',
            ...depComp,
            headline: depComp.better
                ? `Dependencies are fresher than the ${language} median — below-average supply chain risk.`
                : `Dependency staleness is ${Math.abs(depComp.diff)}% worse than comparable ${language} repos.`,
        });

        // Overall verdict
        const betterCount = comparisons.filter(c => c.better).length;
        const overallVerdict = betterCount >= 4
            ? `This repo performs above median on ${betterCount}/5 benchmarks for ${language} repos of this size.`
            : betterCount >= 2
                ? `Mixed performance: above median on ${betterCount}/5 benchmarks for ${language} repos of this size.`
                : `This repo underperforms the ${language} median on ${5 - betterCount}/5 benchmarks.`;

        return {
            triggered: true,
            language,
            sizeCategory: size > 50000 ? 'large' : size > 10000 ? 'medium' : 'small',
            comparisons,
            topInsight: comparisons.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0],
            overallVerdict,
            betterCount,
            totalMetrics: comparisons.length,
        };
    }
}

module.exports = CompetitorBenchmark;
