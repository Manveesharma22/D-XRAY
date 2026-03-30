// scarTissueAnalyzer.js — Scar Tissue Detector
// Identifies files that have been rewritten so many times they've become scar tissue

class ScarTissueAnalyzer {
    analyze(tree, commits) {
        if (!tree?.tree || !commits || commits.length === 0) {
            return {
                scars: [],
                mostScared: null,
                totalScarScore: 0,
                finding: 'Insufficient data for scar tissue analysis.'
            };
        }

        // Track per-file stats: authors, commits, churn
        const fileStats = new Map();

        const repoAgeMs = Date.now() - new Date(commits[commits.length - 1]?.commit?.author?.date).getTime();
        const repoAgeMonths = Math.max(1, repoAgeMs / (1000 * 60 * 60 * 24 * 30));

        commits.forEach(commit => {
            const author = commit.author?.login || commit.commit?.author?.name || 'unknown';
            const files = commit.files || [];

            files.forEach(f => {
                const path = typeof f === 'string' ? f : f.filename;
                if (!path) return;

                if (!fileStats.has(path)) {
                    fileStats.set(path, {
                        path,
                        authors: new Set(),
                        commitCount: 0,
                        rewriteCount: 0,
                        lastModified: commit.commit?.author?.date || null
                    });
                }

                const stats = fileStats.get(path);
                const prevAuthorCount = stats.authors.size;
                stats.authors.add(author);
                stats.commitCount++;

                // Count as "rewrite" if: author switches significantly on a file with many edits
                if (stats.authors.size > prevAuthorCount && stats.commitCount > 3) {
                    stats.rewriteCount++;
                }

                if (!stats.lastModified || new Date(commit.commit?.author?.date) > new Date(stats.lastModified)) {
                    stats.lastModified = commit.commit?.author?.date;
                }
            });
        });

        // Score scar tissue
        const scored = [];
        for (const [path, stats] of fileStats.entries()) {
            // Only include non-trivial files
            if (stats.commitCount < 3) continue;
            if (path.includes('package-lock') || path.includes('yarn.lock') || path.includes('.min.')) continue;

            // Scar score formula: commits per month + author diversity + rewrite count
            const commitsPerMonth = stats.commitCount / repoAgeMonths;
            const scarScore = Math.round(
                (commitsPerMonth * 3) +
                (stats.authors.size * 5) +
                (stats.rewriteCount * 8)
            );

            if (scarScore < 10) continue;

            scored.push({
                path,
                commitCount: stats.commitCount,
                authorCount: stats.authors.size,
                authors: [...stats.authors].slice(0, 5),
                rewriteCount: stats.rewriteCount,
                scarScore,
                scarDensity: Math.min(1, scarScore / 80), // 0-1 for visualization
                lastModified: stats.lastModified,
                finding: this._generateFinding(path, stats.commitCount, stats.rewriteCount, stats.authors.size)
            });
        }

        // Sort by scar score
        scored.sort((a, b) => b.scarScore - a.scarScore);
        const topScars = scored.slice(0, 10);

        const mostScared = topScars[0] || null;
        const totalScarScore = Math.min(100, Math.round(
            topScars.reduce((s, t) => s + t.scarScore, 0) / Math.max(topScars.length, 1)
        ));

        let finding;
        if (topScars.length === 0) {
            finding = 'No significant scar tissue detected. Files have been modified at a sustainable pace.';
        } else if (mostScared && mostScared.rewriteCount >= 5) {
            const shortPath = mostScared.path.split('/').slice(-2).join('/');
            finding = `${shortPath} has been rewritten ${mostScared.rewriteCount} times in its lifetime. It is scar tissue. Every new feature that touches it causes a regression. The team knows this. Nobody has scheduled the surgery.`;
        } else if (topScars.length >= 5) {
            finding = `${topScars.length} files show significant scar tissue patterns — heavily churn, multiple author rewrites, high commit density. These are the most dangerous areas of the codebase.`;
        } else {
            finding = `${topScars.length} file${topScars.length > 1 ? 's' : ''} showing early scar tissue formation. Consistent high churn with author turnover — watch these areas carefully.`;
        }

        return { scars: topScars, mostScared, totalScarScore, finding };
    }

    _generateFinding(path, commitCount, rewriteCount, authorCount) {
        const shortPath = path.split('/').slice(-2).join('/');
        if (rewriteCount >= 8) {
            return `${shortPath} has been rewritten ${rewriteCount} times by ${authorCount} different developers. It is scar tissue. Rigid, painful to change, always the source of new problems.`;
        } else if (rewriteCount >= 4) {
            return `${shortPath} shows heavy rewrite history across ${authorCount} authors. Every significant change increases regression risk.`;
        } else if (commitCount >= 20) {
            return `${shortPath} has ${commitCount} commits — the most-touched file in this codebase. High traffic means high scar tissue risk.`;
        }
        return `${shortPath} shows early signs of scar tissue: ${commitCount} commits, ${authorCount} contributing authors.`;
    }
}

module.exports = ScarTissueAnalyzer;
