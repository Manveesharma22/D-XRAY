// collaborationAnalyzer.js — Live Collaboration Pulse
// Extracts per-contributor activity streams from commit history
// Detects same-file overlaps (sync) and conflict zones (spike)

const COLORS = ['#00e5ff', '#f59e0b', '#a78bfa', '#34d399', '#fb7185', '#fb923c'];

class CollaborationAnalyzer {
    analyze(commits, contributors) {
        if (!commits || commits.length === 0) {
            return { contributors: [], conflicts: [], finding: 'No commit history available.' };
        }

        // Build per-author commit streams (last 60 days, bucketed into 30 intervals)
        const now = Date.now();
        const WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
        const BUCKETS = 30;
        const BUCKET_MS = WINDOW_MS / BUCKETS;

        const authorMap = new Map();
        const fileAuthorMap = new Map(); // file -> Set of authors who touched it

        commits.forEach(commit => {
            const author = commit.author?.login || commit.commit?.author?.name || 'unknown';
            const ts = new Date(commit.commit?.author?.date).getTime();
            const age = now - ts;
            if (age > WINDOW_MS) return;

            if (!authorMap.has(author)) {
                authorMap.set(author, { name: author, buckets: new Array(BUCKETS).fill(0), files: new Set() });
            }
            const bucketIdx = Math.floor((WINDOW_MS - age) / BUCKET_MS);
            if (bucketIdx >= 0 && bucketIdx < BUCKETS) {
                authorMap.get(author).buckets[bucketIdx]++;
            }

            // Track which files each author touched
            const files = commit.files || [];
            files.forEach(f => {
                const fname = typeof f === 'string' ? f : f.filename;
                if (!fname) return;
                authorMap.get(author).files.add(fname);
                if (!fileAuthorMap.has(fname)) fileAuthorMap.set(fname, new Set());
                fileAuthorMap.get(fname).add(author);
            });
        });

        // Get top 6 contributors by commit count
        const sorted = [...authorMap.values()]
            .sort((a, b) => b.buckets.reduce((s, v) => s + v, 0) - a.buckets.reduce((s, v) => s + v, 0))
            .slice(0, 6);

        // Normalize each contributor's pulse data to 0–1
        const contribData = sorted.map((c, i) => {
            const max = Math.max(...c.buckets, 1);
            return {
                name: c.name,
                color: COLORS[i % COLORS.length],
                pulseData: c.buckets.map(v => v / max),
                totalCommits: c.buckets.reduce((s, v) => s + v, 0)
            };
        });

        // Detect conflicts: files touched by 2+ active contributors recently
        const conflicts = [];
        for (const [file, authors] of fileAuthorMap.entries()) {
            if (authors.size >= 2) {
                const activeAuthors = [...authors].filter(a => sorted.some(s => s.name === a));
                if (activeAuthors.length >= 2) {
                    conflicts.push({ file, authors: activeAuthors });
                }
            }
        }

        // Build sync events: pairs of contributors who worked same bucket
        const syncPairs = [];
        for (let i = 0; i < contribData.length; i++) {
            for (let j = i + 1; j < contribData.length; j++) {
                let syncCount = 0;
                for (let b = 0; b < BUCKETS; b++) {
                    if (contribData[i].pulseData[b] > 0.3 && contribData[j].pulseData[b] > 0.3) syncCount++;
                }
                if (syncCount > 3) syncPairs.push({ a: contribData[i].name, b: contribData[j].name, syncCount });
            }
        }

        const topConflict = conflicts[0];
        let finding;
        if (contribData.length === 0) {
            finding = 'No active contributors detected in the past 60 days.';
        } else if (contribData.length === 1) {
            finding = `Single contributor codebase. ${contribData[0].name} is the sole active developer — a single point of failure.`;
        } else if (conflicts.length > 10) {
            finding = `${contribData.length} active contributors. High contention zone: ${conflicts.length} files with concurrent edits. Collaboration pulse shows frequent conflict spikes.`;
        } else if (syncPairs.length > 2) {
            finding = `${contribData.length} contributors showing synchronized activity patterns. Team is working in concert — ${syncPairs.length} pairs frequently active simultaneously.`;
        } else {
            finding = `${contribData.length} active contributors over the past 60 days. Collaboration density is moderate with ${conflicts.length} shared files.`;
        }

        return {
            contributors: contribData,
            conflicts: conflicts.slice(0, 10),
            syncPairs,
            finding
        };
    }
}

module.exports = CollaborationAnalyzer;
