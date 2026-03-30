class MemorialDetector {
    /**
     * @param {Object} repoInfo 
     * @param {Array} commits 
     * @param {Array} contributors 
     */
    analyze(repoInfo, commits, contributors) {
        if (!commits || commits.length === 0) return null;

        const MEMORIAL_KEYWORDS = [
            'rip', 'memory', 'passed', 'memorial', 'tribute', 'legacy',
            'final', 'miss you', 'peace', 'goodbye', 'eternity'
        ];

        // 1. Check repo signals
        const description = (repoInfo.description || '').toLowerCase();
        const topics = (repoInfo.topics || []).map(t => t.toLowerCase());
        const isMemorialRepo = topics.includes('memorial') || topics.includes('tribute') ||
            MEMORIAL_KEYWORDS.some(kw => description.includes(kw));

        // 2. Identify the "Eternal" developer
        // We look for the most active contributor who has no activity after a "memorial" signal
        // OR the author of the final commit in a memorial repo
        let targetCommit = null;
        let deceasedAuthor = null;
        let signalStrength = 0;

        // Scan the last 100 commits for tribute signals
        for (let i = 0; i < Math.min(commits.length, 100); i++) {
            const c = commits[i];
            const msg = (c.commit?.message || '').toLowerCase();

            if (MEMORIAL_KEYWORDS.some(kw => msg.includes(kw))) {
                signalStrength += 5;
                // If this commit IS the tribute, the person passed away before this.
                // Their last commit is the next one in the timeline (lower index = newer)
                // but we want the last commit BY THE DECEASED.

                // Let's find the first commit BY A DIFFERENT PERSON than the tribute-writer 
                // that happened BEFORE the tribute.
                const tributeAuthor = c.author?.login;
                for (let j = i + 1; j < commits.length; j++) {
                    const prevCommit = commits[j];
                    if (prevCommit.author?.login !== tributeAuthor) {
                        targetCommit = prevCommit;
                        deceasedAuthor = prevCommit.commit?.author?.name || prevCommit.author?.login;
                        break;
                    }
                }
                if (targetCommit) break;
            }
        }

        if (isMemorialRepo) signalStrength += 10;

        if (signalStrength >= 5 || isMemorialRepo) {
            // Default to absolute last commit if no specific logic hit
            if (!targetCommit && commits.length > 0) {
                targetCommit = commits[commits.length - 1]; // First commit ever? No, last commit in array is oldest.
                // Actually commits[0] is the newest.
                targetCommit = commits[0];
                deceasedAuthor = targetCommit.commit?.author?.name || targetCommit.author?.login;
            }

            return {
                triggered: true,
                deceasedName: deceasedAuthor || 'Unknown Creator',
                lastCommit: {
                    message: targetCommit.commit?.message,
                    sha: targetCommit.sha.substring(0, 7),
                    date: targetCommit.commit?.author?.date,
                    url: targetCommit.html_url
                },
                signals: isMemorialRepo ? ['Repository marked as memorial'] : ['Tribute commit detected'],
                quote: "They are gone, but their logic still keeps the lights on for us tonight."
            };
        }

        return null;
    }
}

module.exports = MemorialDetector;
