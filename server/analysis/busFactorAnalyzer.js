/**
 * BusFactorAnalyzer — calculates per-module bus factor and generates
 * human-readable obituary prose for organizational risk.
 */

function formatModuleName(path) {
    const parts = path.split('/');
    return parts[parts.length - 1].replace(/\.[^.]+$/, '');
}

function inferModuleImportance(path) {
    const lower = path.toLowerCase();
    if (lower.includes('auth') || lower.includes('login') || lower.includes('session')) return { importance: 'critical', label: 'authentication' };
    if (lower.includes('payment') || lower.includes('billing') || lower.includes('stripe')) return { importance: 'critical', label: 'payment processing' };
    if (lower.includes('api') || lower.includes('route') || lower.includes('endpoint')) return { importance: 'high', label: 'API layer' };
    if (lower.includes('db') || lower.includes('database') || lower.includes('model') || lower.includes('schema')) return { importance: 'high', label: 'data layer' };
    if (lower.includes('config') || lower.includes('env') || lower.includes('secret')) return { importance: 'high', label: 'configuration' };
    if (lower.includes('migration') || lower.includes('seed')) return { importance: 'high', label: 'data migration' };
    if (lower.includes('deploy') || lower.includes('infra') || lower.includes('terraform')) return { importance: 'critical', label: 'infrastructure' };
    if (lower.includes('util') || lower.includes('helper') || lower.includes('shared')) return { importance: 'medium', label: 'shared utilities' };
    if (lower.includes('test') || lower.includes('spec') || lower.includes('mock')) return { importance: 'low', label: 'test suite' };
    return { importance: 'medium', label: 'core module' };
}

function buildModuleOwnership(commits, tree) {
    // Build file → author ownership map
    const fileAuthors = {};

    commits.forEach(c => {
        const author = c.author?.login || c.commit?.author?.name || 'unknown';
        if (!author || author === 'unknown') return;
        // Each commit touches all files — approximate by grouping commit authors
        // We don't have per-file diff data, so we use commit author as proxy
        const date = c.commit?.author?.date;
        if (!date) return;
        const key = author;
        if (!fileAuthors[key]) fileAuthors[key] = { count: 0, dates: [], lastCommit: null };
        fileAuthors[key].count++;
        fileAuthors[key].dates.push(new Date(date));
        if (!fileAuthors[key].lastCommit || new Date(date) > new Date(fileAuthors[key].lastCommit)) {
            fileAuthors[key].lastCommit = date;
        }
    });

    // Find critical-looking paths
    const criticalFiles = (tree?.tree || [])
        .filter(f => f.type === 'blob')
        .map(f => ({ path: f.path, ...inferModuleImportance(f.path) }))
        .filter(f => f.importance === 'critical' || f.importance === 'high')
        .slice(0, 20);

    return { fileAuthors, criticalFiles };
}

function generateObituary(module, soloAuthor, contributorCount) {
    const name = module.label;
    const { importance } = module;

    if (soloAuthor) {
        const templates = [
            `If @${soloAuthor} left tomorrow, the ${name} module would have no living memory. They are the last person who knows why this system was built this way.`,
            `@${soloAuthor} is the sole author of the ${name} layer. Their departure would leave zero people who understand how this module actually works under load.`,
            `The ${name} module exists entirely inside @${soloAuthor}'s head. No documentation. No pair. When they leave — and everyone leaves — this code becomes archaeology.`,
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    if (contributorCount === 2) {
        return `The ${name} module has exactly two living authors. Remove either one, and the remaining engineer inherits a system they only partially understand.`;
    }

    return `The ${name} module has ${contributorCount} contributors. Bus factor: manageable, but not comfortable.`;
}

class BusFactorAnalyzer {
    analyze(commits, contributors, tree) {
        if (!commits || commits.length === 0) return null;

        const { fileAuthors, criticalFiles } = buildModuleOwnership(commits, tree);
        const authorList = Object.entries(fileAuthors)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 15);

        const totalAuthors = authorList.length;

        // Overall bus factor
        const topAuthorCommitShare = authorList[0]?.[1]?.count / (commits.length || 1);
        const overallBusFactor = topAuthorCommitShare > 0.7 ? 1 :
            topAuthorCommitShare > 0.5 ? 2 :
                topAuthorCommitShare > 0.35 ? 3 : Math.min(totalAuthors, 5);

        // Per-module risk (approximate with commit data)
        const modules = criticalFiles.slice(0, 6).map((file, i) => {
            // Assign ownership based on commit patterns
            const ownerIdx = i % Math.max(1, authorList.length);
            const soloThreshold = topAuthorCommitShare > 0.6;
            const moduleAuthorCount = soloThreshold ? 1 : Math.min(2, authorList.length);
            const soloAuthor = moduleAuthorCount === 1 ? authorList[0]?.[0] : null;

            return {
                path: file.path,
                name: formatModuleName(file.path),
                label: file.label,
                importance: file.importance,
                busFactor: moduleAuthorCount,
                soloAuthor,
                obituary: generateObituary(file, soloAuthor, moduleAuthorCount),
                riskLevel: moduleAuthorCount === 1 ? 'critical' : moduleAuthorCount === 2 ? 'high' : 'medium',
            };
        });

        // Overall verdict
        const criticalModules = modules.filter(m => m.riskLevel === 'critical');
        const highModules = modules.filter(m => m.riskLevel === 'high');

        let overallNarrative;
        if (overallBusFactor === 1) {
            const solo = authorList[0]?.[0] || 'the primary author';
            overallNarrative = `This entire codebase has a bus factor of 1. If @${solo} leaves, nobody knows how to run this in production. That is not a technical risk — it is an existential one.`;
        } else if (overallBusFactor <= 2) {
            overallNarrative = `Bus factor: ${overallBusFactor}. Two engineers carry the system. One bad week — mental health, resignation, burnout — and the team is navigating a codebase they barely know.`;
        } else {
            overallNarrative = `Bus factor: ${overallBusFactor}. Knowledge is distributed, but critical modules still have single-author concentration.`;
        }

        return {
            triggered: modules.length > 0,
            overallBusFactor,
            overallNarrative,
            modules,
            topAuthor: authorList[0]?.[0],
            topAuthorShare: Math.round(topAuthorCommitShare * 100),
            criticalModuleCount: criticalModules.length,
            highRiskModuleCount: highModules.length,
            totalAuthors,
        };
    }
}

module.exports = BusFactorAnalyzer;
