/**
 * FirstDaySimulator — simulates a new developer's first Monday
 * based on real gaps found in the onboarding/doc/test tracks.
 */

function buildHourlySchedule(trackFindings, repoInfo, readme) {
    const onboardScore = trackFindings?.D?.score ?? 80;
    const docScore = trackFindings?.C?.score ?? 80;
    const testScore = trackFindings?.B?.score ?? 80;
    const ciScore = trackFindings?.A?.score ?? 80;
    const envScore = trackFindings?.H?.score ?? 80;
    const depScore = trackFindings?.E?.score ?? 80;

    const blocker = (score) => score < 40;
    const rough = (score) => score < 70;

    const schedule = [];

    // 9am: Clone
    schedule.push({
        time: '9:00 AM',
        event: 'Clone the repository',
        status: 'ok',
        detail: `git clone ${repoInfo?.html_url || 'https://github.com/org/repo'}`,
        icon: '📥',
        duration: 5,
    });

    // 9:05 - README
    if (!readme) {
        schedule.push({ time: '9:05 AM', event: 'Look for setup instructions', status: 'blocker', detail: 'No README found. Open the codebase and try to reverse-engineer how to run it.', icon: '🔍', duration: 45 });
    } else if (docScore < 40) {
        schedule.push({ time: '9:05 AM', event: 'Read the README', status: 'friction', detail: 'README exists but setup instructions are incomplete or outdated. Missing: Node version, env vars, local DB setup.', icon: '📄', duration: 20 });
    } else {
        schedule.push({ time: '9:05 AM', event: 'Read the README', status: 'ok', detail: 'Clear setup docs. Running the install command.', icon: '📄', duration: 10 });
    }

    // npm install / deps
    const installTime = blocker(depScore) ? '10:30 AM' : rough(depScore) ? '9:30 AM' : '9:15 AM';
    if (blocker(depScore)) {
        schedule.push({ time: '9:25 AM', event: 'Run npm install', status: 'blocker', detail: `Dependency conflicts. Peer dep errors. ${trackFindings?.E?.details?.vulnerabilityCount || 0} vulnerabilities. Run npm install --legacy-peer-deps and hope for the best.`, icon: '📦', duration: 65 });
        schedule.push({ time: installTime, event: 'Finally installs', status: 'friction', detail: 'Had to ask someone on Slack. Node version not pinned in .nvmrc.', icon: '✅', duration: 5 });
    } else if (rough(depScore)) {
        schedule.push({ time: '9:15 AM', event: 'Run npm install', status: 'friction', detail: '14 deprecation warnings. 3 peer dep warnings. Proceeds cautiously.', icon: '📦', duration: 15 });
        schedule.push({ time: installTime, event: 'Install complete', status: 'ok', detail: `${trackFindings?.E?.details?.vulnerabilityCount || 0} vulnerabilities flagged. Will deal with later.`, icon: '✅', duration: 2 });
    } else {
        schedule.push({ time: '9:15 AM', event: 'Run npm install', status: 'ok', detail: 'Clean install. No errors.', icon: '📦', duration: 10 });
    }

    // Env setup
    if (blocker(envScore)) {
        schedule.push({ time: '10:35 AM', event: 'Configure environment', status: 'blocker', detail: 'No .env.example. No docs about required env vars. Pings three people on Slack. Discovers 7 undocumented environment secrets.', icon: '🔐', duration: 90 });
        schedule.push({ time: '12:05 PM', event: 'Lunch break', status: 'ok', detail: 'Takes lunch. Still hasn\'t run the app.', icon: '🥪', duration: 60 });
        schedule.push({ time: '1:05 PM', event: 'Returns from lunch', status: 'friction', detail: 'Someone finally shared the secrets in a DM. Sets them up.', icon: '🔑', duration: 20 });
    } else if (rough(envScore)) {
        schedule.push({ time: '10:40 AM', event: 'Configure environment', status: 'friction', detail: '.env.example found but missing 3 required vars. Asks Slack.', icon: '🔐', duration: 30 });
        schedule.push({ time: '11:10 AM', event: 'Lunch break', status: 'ok', detail: 'Short lunch.', icon: '🥪', duration: 45 });
    } else {
        schedule.push({ time: '10:40 AM', event: 'Configure environment', status: 'ok', detail: '.env.example is complete. Copies and fills in values.', icon: '🔐', duration: 15 });
        schedule.push({ time: '10:55 AM', event: 'Lunch break', status: 'ok', detail: '', icon: '🥪', duration: 60 });
    }

    // Run the app
    const runTime = blocker(envScore) ? '1:25 PM' : rough(envScore) ? '11:55 AM' : '11:15 AM';
    if (blocker(ciScore)) {
        schedule.push({ time: runTime, event: 'Try to start the dev server', status: 'blocker', detail: 'App crashes on startup. Missing undocumented DB migration. No CI to catch this.', icon: '💥', duration: 45 });
        schedule.push({ time: '2:10 PM', event: 'App finally starts', status: 'friction', detail: 'After running 3 undocumented migration scripts found in a Slack message from 2022.', icon: '🖥️', duration: 5 });
    } else if (rough(onboardScore)) {
        schedule.push({ time: runTime, event: 'Start the dev server', status: 'friction', detail: 'Server starts but shows 3 warnings. One is a deprecated API that\'s been in the codebase for 2 years.', icon: '🖥️', duration: 20 });
    } else {
        schedule.push({ time: runTime, event: 'Start the dev server', status: 'ok', detail: 'App runs on first try. Running at localhost:3000.', icon: '🖥️', duration: 5 });
    }

    // Run tests
    const testTime = blocker(envScore) ? '2:15 PM' : rough(envScore) ? '12:15 PM' : '11:20 AM';
    if (testScore < 20) {
        schedule.push({ time: testTime, event: 'Run the test suite', status: 'blocker', detail: `No tests found. ${trackFindings?.B?.issues?.[0]?.message || 'Test suite empty or absent.'}`, icon: '🧪', duration: 10 });
        schedule.push({ time: testTime.replace(/\d+:\d+/, h => h), event: 'Give up on tests', status: 'friction', detail: 'No test baseline. Working blind.', icon: '🤷', duration: 5 });
    } else if (testScore < 50) {
        schedule.push({ time: testTime, event: 'Run the test suite', status: 'friction', detail: `${Math.round((100 - testScore) / 5)} tests fail locally but supposedly pass in CI. Nobody knows why. Told "it\'s fine, just push."`, icon: '🧪', duration: 20 });
    } else {
        schedule.push({ time: testTime, event: 'Run the test suite', status: 'ok', detail: 'Tests pass. Green across the board.', icon: '🧪', duration: 10 });
    }

    // End of day
    const endTime = blocker(envScore) || blocker(depScore) ? '6:30 PM' : rough(onboardScore) ? '5:30 PM' : '5:00 PM';
    const successRate = [onboardScore, docScore, envScore, ciScore, testScore]
        .filter(s => s >= 60).length;
    const tasksDone = successRate >= 4 ? 'first small ticket submitted' : successRate >= 2 ? 'setup complete, no real work done' : 'still fighting the environment';

    schedule.push({
        time: endTime,
        event: 'End of first day',
        status: successRate >= 4 ? 'ok' : successRate >= 2 ? 'friction' : 'blocker',
        detail: `Day 1 complete. Status: ${tasksDone}. Productivity: ${Math.round(successRate / 5 * 100)}%.`,
        icon: '🌙',
        duration: 0,
        isFinal: true,
    });

    return schedule;
}

class FirstDaySimulator {
    analyze(trackFindings, repoInfo, readme) {
        if (!trackFindings) return null;

        const schedule = buildHourlySchedule(trackFindings, repoInfo, readme);
        const blockers = schedule.filter(s => s.status === 'blocker').length;
        const onboardScore = trackFindings?.D?.score ?? 80;

        let verdict;
        if (blockers === 0) {
            verdict = 'Smooth onboarding. A new developer is productive by end of Day 1.';
        } else if (blockers <= 2) {
            verdict = `${blockers} blocker${blockers > 1 ? 's' : ''} hit. A new developer loses most of their first day to environment issues.`;
        } else {
            verdict = `${blockers} critical blockers. A new developer will need 2-3 days just to run the project. First impressions are irreparable.`;
        }

        return {
            triggered: true,
            schedule,
            blockerCount: blockers,
            verdict,
            onboardScore,
            productivity: Math.max(0, Math.round(100 - blockers * 25)),
        };
    }
}

module.exports = FirstDaySimulator;
