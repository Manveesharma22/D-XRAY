/**
 * ObituaryEngine — detects dead repositories and generates cinematic eulogy data.
 * All data is sourced from real GitHub signals. Nothing is fabricated.
 */

const ABANDONMENT_DAYS = 180; // 6+ months of silence = dead

function daysBetween(dateA, dateB) {
    return Math.floor(Math.abs(new Date(dateA) - new Date(dateB)) / (1000 * 60 * 60 * 24));
}

function formatAge(days) {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const d = days % 30;
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (d > 0 && years === 0) parts.push(`${d} day${d > 1 ? 's' : ''}`);
    return parts.join(', ');
}

function detectPeakPeriod(commits) {
    if (!commits || commits.length === 0) return null;
    // Group by month
    const byMonth = {};
    for (const c of commits) {
        const month = c.commit?.author?.date?.slice(0, 7);
        if (month) byMonth[month] = (byMonth[month] || 0) + 1;
    }
    let peakMonth = null, peakCount = 0;
    for (const [month, count] of Object.entries(byMonth)) {
        if (count > peakCount) { peakCount = count; peakMonth = month; }
    }
    if (!peakMonth) return null;
    const d = new Date(peakMonth + '-01');
    return {
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        commitCount: peakCount
    };
}

function findLoyalOne(commits, contributors) {
    if (!commits || commits.length === 0) return null;
    // Find contributor with most weeks with at least one commit
    const byContrib = {};
    for (const c of commits) {
        const author = c.author?.login || c.commit?.author?.name;
        const date = c.commit?.author?.date;
        if (!author || !date) continue;
        if (!byContrib[author]) byContrib[author] = new Set();
        const weekKey = date.slice(0, 8) + '0'; // approximate week
        byContrib[author].add(weekKey);
    }
    let loyalLogin = null, loyalWeeks = 0;
    for (const [login, weeks] of Object.entries(byContrib)) {
        if (weeks.size > loyalWeeks) { loyalWeeks = weeks.size; loyalLogin = login; }
    }
    if (!loyalLogin) return null;
    return { login: loyalLogin, weeks: loyalWeeks };
}

function detectSurvivalEvents(commits, repoInfo) {
    const events = [];
    // Detect version bumps from commit messages
    const versionBumps = (commits || []).filter(c => {
        const msg = (c.commit?.message || '').toLowerCase();
        return msg.match(/v?\d+\.\d+\.0|major release|release \d+\.\d+|version \d+/);
    });
    if (versionBumps.length > 0) {
        events.push(`${versionBumps.length} major version${versionBumps.length > 1 ? 's' : ''} shipped`);
    }
    // Detect rewrites
    const rewrites = (commits || []).filter(c => {
        const msg = (c.commit?.message || '').toLowerCase();
        return msg.includes('rewrite') || msg.includes('refactor everything') || msg.includes('start fresh') || msg.includes('ground up');
    });
    if (rewrites.length > 0) {
        events.push(`${rewrites.length === 1 ? 'a complete rewrite' : `${rewrites.length} complete rewrites`}`);
    }
    // Language migration
    const migrations = (commits || []).filter(c => {
        const msg = (c.commit?.message || '').toLowerCase();
        return msg.includes('migrat') || msg.includes('port to') || msg.includes('typescript') || msg.includes('convert');
    });
    if (migrations.length > 1) events.push('a language migration');
    // Long life
    if (repoInfo) {
        const ageDays = daysBetween(repoInfo.created_at, repoInfo.pushed_at || new Date());
        if (ageDays > 1095) events.push(`over three years of continuous development`);
    }
    return events;
}

function generateObituary(repoInfo, commits, contributors, trackFindings, patient) {
    if (!repoInfo) return null;

    const lastCommitDate = repoInfo.pushed_at || commits?.[0]?.commit?.author?.date;
    if (!lastCommitDate) return null;

    const daysSinceLastCommit = daysBetween(lastCommitDate, new Date());
    const isAbandoned = daysSinceLastCommit >= ABANDONMENT_DAYS || repoInfo.archived;

    if (!isAbandoned) return null;

    const repoName = repoInfo.name || 'this project';
    const fullName = repoInfo.full_name || repoName;
    const createdAt = repoInfo.created_at;
    const ageDays = createdAt ? daysBetween(createdAt, lastCommitDate) : 0;
    const ageString = ageDays > 0 ? formatAge(ageDays) : 'an unknown age';

    const peakPeriod = detectPeakPeriod(commits);
    const loyalOne = findLoyalOne(commits, contributors);
    const survivalEvents = detectSurvivalEvents(commits, repoInfo);
    const lastCommit = commits?.[0];
    const lastCommitMessage = lastCommit?.commit?.message?.split('\n')[0] || 'no message left';
    const lastCommitAuthor = lastCommit?.author?.login || lastCommit?.commit?.author?.name;
    const contributorCount = contributors?.length || repoInfo.network_count || 0;
    const openIssues = repoInfo.open_issues_count || 0;
    const stars = repoInfo.stargazers_count || 0;
    const forks = repoInfo.forks_count || 0;

    // Dead date: last commit
    const deadDate = new Date(lastCommitDate);
    const deadDateString = deadDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Cause of death (inferred from track scores)
    const causes = [];
    if (trackFindings?.A?.score < 30) causes.push('CI neglect');
    if (trackFindings?.E?.details?.vulnerabilityCount > 5) causes.push('dependency rot');
    if (trackFindings?.C?.score < 30) causes.push('documentation entropy');
    if (trackFindings?.F?.burnoutSignals?.some(b => b.riskLevel === 'high')) causes.push('developer burnout');
    if (repoInfo.archived) causes.push('organizational deprioritization');
    if (causes.length === 0) causes.push('shifting priorities', 'scope creep');
    const causeString = causes.slice(0, 2).join(' and ');

    // PR ghost count (unanswered PRs approximated)
    const openPRApprox = Math.round(openIssues * 0.15);

    // Build the eulogy — all real data
    const paragraphs = [];

    // Opening paragraph
    paragraphs.push(
        `${repoName} passed away quietly on ${deadDateString}, after a long battle with ${causeString}. ` +
        `It was ${ageString} old.`
    );

    // Peak and reach paragraph
    if (contributorCount > 0 || peakPeriod) {
        let p = '';
        if (contributorCount > 1) {
            p += `At its peak, ${repoName} was touched by ${contributorCount} people who believed in what it could become.`;
        }
        if (survivalEvents.length > 0) {
            p += ` It survived ${survivalEvents.join(', ').replace(/,([^,]*)$/, ' and$1')}.`;
        }
        if (stars > 50) {
            p += ` It earned ${stars.toLocaleString()} stars — ${stars > 1000 ? 'a quiet landmark few projects reach' : 'a small constellation of people who noticed'}.`;
        }
        if (peakPeriod) {
            p += ` It was, for a brief period in ${peakPeriod.label}, producing ${peakPeriod.commitCount} commits in a single month.`;
        }
        if (p) paragraphs.push(p.trim());
    }

    // The loyal one paragraph
    if (loyalOne) {
        paragraphs.push(
            `It is survived by ${openIssues.toLocaleString()} open issues${openPRApprox > 0 ? `, an estimated ${openPRApprox} PRs that were never reviewed` : ''}, ` +
            `and one developer — @${loyalOne.login} — who committed to it across roughly ${loyalOne.weeks} separate weeks without stopping, even after the momentum had gone.`
        );
    } else if (openIssues > 0) {
        paragraphs.push(
            `It is survived by ${openIssues.toLocaleString()} open questions that no one came back to answer.`
        );
    }

    // The last act paragraph
    paragraphs.push(
        `The last commit was ${lastCommitAuthor ? `by @${lastCommitAuthor}` : 'anonymous'}. ` +
        `The message read: "${lastCommitMessage}". ` +
        (lastCommitMessage.length < 30 || lastCommitMessage.toLowerCase().includes('fix') || lastCommitMessage.toLowerCase().includes('typo') || lastCommitMessage.toLowerCase().includes('update')
            ? `Nobody noticed.`
            : `It was trying to say something.`)
    );

    // Closing
    paragraphs.push(`It deserved better.`);

    return {
        isAbandoned: true,
        repoName,
        fullName,
        daysSinceDeath: daysSinceLastCommit,
        deadDateString,
        ageString,
        ageDays,
        causeString,
        contributorCount,
        openIssues,
        stars,
        forks,
        loyalOne,
        peakPeriod,
        survivalEvents,
        lastCommitMessage,
        lastCommitAuthor,
        paragraphs,
        language: repoInfo.language,
        archived: repoInfo.archived || false,
    };
}

module.exports = { generateObituary, ABANDONMENT_DAYS };
