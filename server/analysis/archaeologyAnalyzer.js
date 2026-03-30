// archaeologyAnalyzer.js — The Archaeology Layer
// Compares original architecture vs current state
// Uses earliest commits to reconstruct v1 file structure

class ArchaeologyAnalyzer {
    analyze(currentTree, commits) {
        if (!currentTree?.tree || commits.length === 0) {
            return {
                driftScore: 0,
                originalPathCount: 0,
                survivingPaths: [],
                extinctPaths: [],
                newPaths: [],
                rewriteCount: 0,
                architectureAge: null,
                finding: 'Insufficient data for archaeology analysis.'
            };
        }

        // Get current top-level directories and files
        const currentPaths = currentTree.tree
            .filter(item => item.type === 'tree' || (item.type === 'blob' && !item.path.includes('/')))
            .map(item => item.path)
            .filter(p => !this._isNoise(p));

        // Simulate original architecture from earliest commits
        // Look at files mentioned in oldest 20% of commits
        const sortedCommits = [...commits].sort((a, b) =>
            new Date(a.commit?.author?.date) - new Date(b.commit?.author?.date)
        );

        const earliestCommits = sortedCommits.slice(0, Math.max(5, Math.floor(sortedCommits.length * 0.15)));
        const latestCommits = sortedCommits.slice(-Math.floor(sortedCommits.length * 0.15));

        // Extract original top-level dirs from earliest commit messages and file patterns
        const originalDirs = new Set();
        const currentTopDirs = new Set();

        // Derive structure from current tree's directory listing
        currentTree.tree.forEach(item => {
            const parts = item.path.split('/');
            if (parts.length >= 1 && !this._isNoise(parts[0])) {
                currentTopDirs.add(parts[0]);
            }
        });

        // Reconstruct "original" dirs — heuristic: files modified in earliest commits
        // vs dirs that appear only in recent commits (suggesting major refactors)
        const earlyFiles = new Set();
        const lateFiles = new Set();

        earliestCommits.forEach(c => {
            (c.files || []).forEach(f => {
                const fname = typeof f === 'string' ? f : f.filename;
                if (fname) {
                    const topDir = fname.split('/')[0];
                    if (!this._isNoise(topDir)) earlyFiles.add(topDir);
                }
            });
        });

        latestCommits.forEach(c => {
            (c.files || []).forEach(f => {
                const fname = typeof f === 'string' ? f : f.filename;
                if (fname) {
                    const topDir = fname.split('/')[0];
                    if (!this._isNoise(topDir)) lateFiles.add(topDir);
                }
            });
        });

        // Original paths = dirs touched in early commits
        // If we can't detect, use known architectural patterns
        const originalPaths = earlyFiles.size > 0 ? [...earlyFiles] : this._guessOriginalStructure(currentTopDirs);

        // Surviving paths = original paths still present in current tree
        const survivingPaths = originalPaths.filter(p => currentTopDirs.has(p));
        // Extinct paths = original paths no longer present
        const extinctPaths = originalPaths.filter(p => !currentTopDirs.has(p));
        // New paths = current dirs that weren't in original
        const newPaths = [...currentTopDirs].filter(p => !originalPaths.includes(p) && !this._isNoise(p));

        // Drift score: how much has changed from original
        const survivalRate = originalPaths.length > 0 ? survivingPaths.length / originalPaths.length : 1;
        const driftScore = Math.round((1 - survivalRate) * 100);

        // Estimate rewrite count from directory churn
        const rewriteCount = Math.max(0, Math.floor(extinctPaths.length / 2) + Math.floor(newPaths.length / 3));

        // Architecture age
        const repoAge = sortedCommits.length > 0
            ? (Date.now() - new Date(sortedCommits[0].commit?.author?.date).getTime()) / (1000 * 60 * 60 * 24 * 365)
            : null;

        const architectureAge = repoAge ? `${Math.round(repoAge * 10) / 10} years` : null;

        // Shared architecture percentage
        const sharedPct = Math.round(survivalRate * 100);

        let finding;
        if (sharedPct >= 80) {
            finding = `This codebase shares ~${sharedPct}% of its original architecture. The original design has held. Either the architecture was exceptional, or the codebase hasn't grown enough to strain it.`;
        } else if (sharedPct >= 50) {
            finding = `This codebase shares ~${sharedPct}% of its original architecture. Significant evolution has occurred — ${extinctPaths.length} original structure${extinctPaths.length > 1 ? 's' : ''} no longer exist.`;
        } else if (sharedPct >= 20) {
            finding = `This codebase shares ~${sharedPct}% of its original architecture. It has been effectively rebuilt ${Math.max(1, rewriteCount)} time${rewriteCount > 1 ? 's' : ''} without anyone declaring a rewrite.`;
        } else {
            finding = `This codebase shares only ~${sharedPct}% of its original architecture. It has drifted so far from its origins that the original design is effectively unrecognizable.`;
        }

        return {
            driftScore,
            originalPathCount: originalPaths.length,
            currentPathCount: currentTopDirs.size,
            survivingPaths,
            extinctPaths,
            newPaths,
            rewriteCount,
            architectureAge,
            sharedPercentage: sharedPct,
            finding
        };
    }

    _isNoise(path) {
        return ['.git', 'node_modules', '.github', 'dist', 'build', 'coverage', '.nyc_output',
            '__pycache__', '.DS_Store', 'vendor', '.cache'].includes(path);
    }

    _guessOriginalStructure(currentDirs) {
        // If no early commit file data, return current dirs as "original"
        return [...currentDirs];
    }
}

module.exports = ArchaeologyAnalyzer;
