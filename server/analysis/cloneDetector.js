// cloneDetector.js — DNA Matching / Clone Detector
// Detects copy-pasted logic via file name duplication patterns and directory analysis

class CloneDetector {
    analyze(tree) {
        if (!tree?.tree) {
            return { clones: [], totalCloneRisk: 0, finding: 'No file tree available for clone detection.' };
        }

        const files = tree.tree.filter(item => item.type === 'blob');

        // Group files by base name (without extension)
        const nameGroups = new Map();

        files.forEach(file => {
            const parts = file.path.split('/');
            const fileName = parts[parts.length - 1];
            const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase();

            // Skip trivial names
            if (this._isTrivialName(baseName)) return;

            if (!nameGroups.has(baseName)) nameGroups.set(baseName, []);
            nameGroups.get(baseName).push(file.path);
        });

        // Find groups with 2+ locations (potential clones)
        const cloneGroups = [];

        for (const [baseName, locations] of nameGroups.entries()) {
            if (locations.length < 2) continue;

            // Calculate divergence risk based on directory depth differences
            const depths = locations.map(l => l.split('/').length - 1);
            const maxDepthDiff = Math.max(...depths) - Math.min(...depths);
            const dirs = locations.map(l => l.split('/').slice(0, -1).join('/'));
            const uniqueDirs = new Set(dirs).size;

            let divergenceRisk;
            if (uniqueDirs >= 4 || locations.length >= 5) divergenceRisk = 'high';
            else if (uniqueDirs >= 3 || locations.length >= 3) divergenceRisk = 'medium';
            else divergenceRisk = 'low';

            const finding = this._generateCloneFinding(baseName, locations, divergenceRisk);

            cloneGroups.push({
                baseName,
                displayName: fileName => `${baseName}.*`,
                locations,
                count: locations.length,
                divergenceRisk,
                maxDepthDiff,
                finding
            });
        }

        // Sort by severity then count
        cloneGroups.sort((a, b) => {
            const riskOrder = { high: 0, medium: 1, low: 2 };
            if (riskOrder[a.divergenceRisk] !== riskOrder[b.divergenceRisk]) {
                return riskOrder[a.divergenceRisk] - riskOrder[b.divergenceRisk];
            }
            return b.count - a.count;
        });

        const topClones = cloneGroups.slice(0, 8);
        const highRiskCount = topClones.filter(c => c.divergenceRisk === 'high').length;
        const totalClones = topClones.reduce((s, c) => s + c.count, 0);

        let finding;
        if (topClones.length === 0) {
            finding = 'No significant code duplication detected. This codebase maintains good DRY discipline.';
        } else if (highRiskCount >= 3) {
            finding = `${highRiskCount} high-risk clone groups detected. This codebase is fighting itself — duplicated logic has diverged enough that fixing a bug in one copy no longer fixes it in the others.`;
        } else if (topClones.length >= 5) {
            finding = `${topClones.length} duplicate file name patterns across ${totalClones} locations. Organ duplication detected — the body is replicating instead of reusing.`;
        } else {
            finding = `${topClones.length} file pattern${topClones.length > 1 ? 's' : ''} with potential duplication. Low to moderate copy-paste risk.`;
        }

        const totalCloneRisk = Math.min(100, highRiskCount * 20 + topClones.filter(c => c.divergenceRisk === 'medium').length * 10 + topClones.filter(c => c.divergenceRisk === 'low').length * 5);

        return { clones: topClones, totalCloneRisk, finding };
    }

    _isTrivialName(name) {
        const trivial = ['index', 'main', 'app', 'utils', 'helpers', 'types', 'constants',
            'config', 'styles', 'test', 'spec', 'readme', 'package', 'setup',
            'init', 'base', 'common', 'shared', 'core', 'default'];
        return trivial.includes(name) || name.length <= 2 || name.startsWith('_');
    }

    _generateCloneFinding(baseName, locations, risk) {
        const count = locations.length;
        if (risk === 'high') {
            return `\`${baseName}\` exists in ${count} different locations. They have diverged enough that fixing a bug in one no longer fixes it in the others. You have ${count} versions of the same organ and they are no longer compatible.`;
        } else if (risk === 'medium') {
            return `\`${baseName}\` appears in ${count} locations. Moderate divergence risk — these copies may already be out of sync.`;
        }
        return `\`${baseName}\` duplicated across ${count} locations. Low immediate risk, but divergence will increase over time.`;
    }
}

module.exports = CloneDetector;
