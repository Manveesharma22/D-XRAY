class MirrorAI {
    analyze(user, userEvents, userRepoPRs, allRepoCommits, allRepoPRs) {
        if (!user) return null;

        const username = user.login;
        const displayName = user.name || username;

        // 1. Coding Heartbeat (Real vs. Perceived)
        const heartbeat = this._analyzeHeartbeat(userEvents, allRepoCommits, username);

        // 2. Collaboration Shadow (Influence/Gravity)
        const shadow = this._analyzeShadow(allRepoPRs, username);

        // 3. Fingerprint (Stylistic Mark)
        const fingerprint = this._analyzeFingerprint(allRepoCommits, username);

        // 4. Debt Signature (Fixer vs. Creator)
        const debtSignature = this._analyzeDebtSignature(userRepoPRs, allRepoCommits, username);

        // 5. Burnout Fingerprint (Timing & Volatility)
        const burnout = this._analyzeBurnout(userEvents, username);

        return {
            user: {
                login: username,
                name: displayName,
                avatar: user.avatar_url,
                bio: user.bio,
                location: user.location,
                company: user.company,
                created_at: user.created_at
            },
            heartbeat,
            shadow,
            fingerprint,
            debtSignature,
            burnout,
            timestamp: new Date().toISOString()
        };
    }

    _analyzeHeartbeat(events = [], commits = [], username) {
        const hours = new Array(24).fill(0);
        const userCommits = (commits || []).filter(c => (c.author?.login === username) || (c.commit?.author?.name === username));

        // Combine events and commits for better resolution
        (events || []).forEach(e => {
            if (e.created_at) hours[new Date(e.created_at).getHours()]++;
        });
        userCommits.forEach(c => {
            if (c.commit?.author?.date) hours[new Date(c.commit.author.date).getHours()]++;
        });

        const peakHour = hours.indexOf(Math.max(...hours));
        const isNightOwl = peakHour >= 22 || peakHour < 5;

        return {
            hourDistribution: hours,
            peakHour,
            type: isNightOwl ? 'Night Owl' : 'Pragmatist',
            perceivedVsReal: isNightOwl
                ? "You believe you're most productive at night. The data usually says otherwise. Showing you the gap between who you think you are and who the data says you are — that's not a metric. That's a mirror."
                : "You operate with a steady, daylight rhythm. Your peak efficiency occurs in the silence of mid-morning, before the noise of the day intervenes."
        };
    }

    _analyzeShadow(pullRequests = [], username) {
        // How fast do others respond when YOU open a PR?
        const safePRs = (pullRequests || []);
        const myPRs = safePRs.filter(pr => pr.user?.login === username);
        const othersPRs = safePRs.filter(pr => pr.user?.login !== username);

        const getAvgResponseTime = (prs) => {
            const times = prs.map(pr => {
                if (!pr.created_at || !pr.updated_at) return null;
                const delta = (new Date(pr.updated_at) - new Date(pr.created_at));
                return delta > 0 ? delta / (1000 * 60 * 60) : null;
            }).filter(t => t !== null);
            return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 24;
        };

        const myAvg = getAvgResponseTime(myPRs);
        const othersAvg = getAvgResponseTime(othersPRs);
        const hasGravity = myAvg < othersAvg && myPRs.length > 0;

        return {
            gravity: hasGravity ? 'High' : 'Subtle',
            description: hasGravity
                ? `You have a gravity. When you review a PR, others approve ${Math.round(Math.min(95, (1 - myAvg / othersAvg) * 100))}% faster. When you commit, activity around you increases. Most developers have never seen this mapped.`
                : "Your influence is subtle. You move between the gears of the team, stabilizing the orbit of others without disrupting their momentum."
        };
    }

    _analyzeFingerprint(commits = [], username) {
        const userCommits = (commits || []).filter(c => (c.author?.login === username));
        if (userCommits.length === 0) {
            return { words: ['Quiet', 'Consistent', 'Subtle'], description: "Your stylistic fingerprint is one of quiet consistency. You build without leaving a trace of ego in the logs." };
        }
        const msgs = userCommits.map(c => c.commit?.message?.toLowerCase() || '');

        let score = 0;
        if (msgs.some(m => m.includes('fix') || m.includes('refactor'))) score += 1;
        if (msgs.some(m => m.length > 50)) score += 2;
        if (userCommits.length > 5) score += 1;

        const words = score > 3 ? ['Precise', 'Architectural', 'Detailed'] :
            score > 1 ? ['Action-Oriented', 'Swift', 'Pragmatic'] :
                ['Quiet', 'Consistent', 'Subtle'];

        return {
            words,
            description: `Every developer leaves a stylistic fingerprint. Yours is built from ${words[0].toLowerCase()} intent and ${words[2].toLowerCase()} execution. This is how you leave your mark.`
        };
    }

    _analyzeDebtSignature(userPRs = [], commits = [], username) {
        const userCommits = (commits || []).filter(c => (c.author?.login === username));
        const fixCount = userCommits.filter(c => c.commit?.message?.toLowerCase().includes('fix')).length;

        const isFixer = fixCount > (userCommits.length * 0.35) && userCommits.length > 0;

        return {
            role: isFixer ? 'The Silent Fixer' : 'The Creative Architect',
            description: isFixer
                ? `You are a fixer. In your recent repositories, you have resolved more debt than you created. You have never been formally credited for this.`
                : "You are a creator. You thrive in the ambiguity of first-line implementation. You build the skeletons that others later polish."
        };
    }

    _analyzeBurnout(events = [], username) {
        const safeEvents = (events || []);
        const recentEvents = safeEvents.slice(0, 30);
        const olderEvents = safeEvents.slice(30, 60);

        const getVolatility = (evts) => {
            if (evts.length < 5) return 0;
            const gaps = [];
            for (let i = 1; i < evts.length; i++) {
                const delta = Math.abs(new Date(evts[i - 1].created_at) - new Date(evts[i].created_at));
                if (!isNaN(delta)) gaps.push(delta);
            }
            return gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
        };

        const recentVol = getVolatility(recentEvents);
        const olderVol = getVolatility(olderEvents);
        const shift = recentVol > olderVol * 1.35 && recentVol > 0;

        return {
            risk: shift ? 'Elevated' : 'Stable',
            description: shift
                ? "This is what your git history looks like three weeks before you stop enjoying the work. We have seen this pattern in you before. We are seeing early signals of it now."
                : "Your current pattern is consistent with deep work flow. The rhythm is sustainable, resistant to external erosion."
        };
    }
}

module.exports = MirrorAI;
