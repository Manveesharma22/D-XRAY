#!/usr/bin/env node
/**
 * DX-Ray Demo Cache Seeder
 * 
 * Pre-runs full scans on 3 famous repos and persists them to /scans/*.json
 * so the demo day never touches live GitHub APIs.
 * 
 * Usage: GITHUB_TOKEN=ghp_... node seed-cache.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const GitHubClient = require('./analysis/githubClient');
const CIAnalyzer = require('./analysis/ciAnalyzer');
const TestSuiteInspector = require('./analysis/testSuiteInspector');
const DocFreshnessScorer = require('./analysis/docFreshnessScorer');
const OnboardingScorer = require('./analysis/onboardingScorer');
const DependencyAnalyzer = require('./analysis/dependencyAnalyzer');
const DeveloperFlowAnalyzer = require('./analysis/developerFlowAnalyzer');
const CodeReviewAnalyzer = require('./analysis/codeReviewAnalyzer');
const EnvironmentAnalyzer = require('./analysis/environmentAnalyzer');
const DebtDiffuser = require('./analysis/debtDiffuser');
const DeadCodeCoroner = require('./analysis/deadCodeCoroner');
const CorpusScorer = require('./analysis/corpusScorer');
const DoctorAI = require('./analysis/doctorAI');
const CollaborationAnalyzer = require('./analysis/collaborationAnalyzer');
const TraumaAnalyzer = require('./analysis/traumaAnalyzer');
const ImmuneSystemAnalyzer = require('./analysis/immuneSystemAnalyzer');
const ArchaeologyAnalyzer = require('./analysis/archaeologyAnalyzer');
const WhisperAnalyzer = require('./analysis/whisperAnalyzer');
const CloneDetector = require('./analysis/cloneDetector');
const SleepStudyAnalyzer = require('./analysis/sleepStudyAnalyzer');
const ScarTissueAnalyzer = require('./analysis/scarTissueAnalyzer');

const SCANS_DIR = path.join(__dirname, 'scans');
if (!fs.existsSync(SCANS_DIR)) fs.mkdirSync(SCANS_DIR);

const DEMO_REPOS = [
    { owner: 'facebook', repo: 'react', slug: 'facebook-react' },
    { owner: 'vercel', repo: 'next.js', slug: 'vercel-nextjs' },
    { owner: 'torvalds', repo: 'linux', slug: 'torvalds-linux' },
];

const safe = (fn, label, defaults) => {
    try { return fn(); } catch (e) {
        console.warn(`  ⚠ ${label} failed: ${e.message}`);
        return defaults;
    }
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scanRepo(owner, repo, slug) {
    const outPath = path.join(SCANS_DIR, `${slug}.json`);
    if (fs.existsSync(outPath)) {
        console.log(`  ✓ Already cached: ${slug}.json — skipping`);
        return;
    }

    console.log(`\n🔬 Scanning ${owner}/${repo}...`);
    const gh = new GitHubClient(process.env.GITHUB_TOKEN);

    const repoInfo = await gh.getRepoInfo(owner, repo);
    console.log(`  ✓ Repo info: ${repoInfo.full_name} (${repoInfo.stargazers_count} ⭐)`);

    const [tree, commits, contributors, pullRequests, workflows, workflowRuns, languages, packageJson, readme] = await Promise.all([
        gh.getTree(owner, repo, repoInfo.default_branch).catch(() => ({ tree: [] })),
        gh.getCommits(owner, repo, null, 100).catch(() => []),
        gh.getContributors(owner, repo).catch(() => []),
        gh.getPullRequests(owner, repo, 'all', 30).catch(() => []),
        gh.getWorkflows(owner, repo).catch(() => ({ workflows: [] })),
        gh.getWorkflowRuns(owner, repo, 30).catch(() => ({ workflow_runs: [] })),
        gh.getLanguages(owner, repo).catch(() => ({})),
        gh.getPackageJson(owner, repo).catch(() => null),
        gh.getReadme(owner, repo).catch(() => null),
    ]);
    console.log(`  ✓ Data fetched — ${commits.length} commits, ${contributors.length} contributors`);

    await delay(500); // be gentle with the API

    const [ciResult, testResult, docResult, onboardResult, depResult, flowResult, reviewResult, envResult] = await Promise.all([
        safe(() => new CIAnalyzer().analyze(workflows, workflowRuns, commits), 'CI', { track: 'A', score: 50, details: {}, issues: [] }),
        safe(() => new TestSuiteInspector().analyze(tree, commits, packageJson), 'Tests', { track: 'B', score: 50, details: {}, issues: [] }),
        safe(() => new DocFreshnessScorer().analyze(tree, readme, commits), 'Docs', { track: 'C', score: 50, details: {}, issues: [] }),
        safe(() => new OnboardingScorer().analyze(tree, readme, packageJson, contributors), 'Onboarding', { track: 'D', score: 50, details: {}, issues: [] }),
        safe(() => new DependencyAnalyzer().analyze(packageJson, tree), 'Deps', { track: 'E', score: 50, details: {}, issues: [] }),
        safe(() => new DeveloperFlowAnalyzer().analyze(commits, contributors, pullRequests), 'Flow', { track: 'F', score: 50, details: {}, issues: [], burnoutSignals: [], rageCommits: [] }),
        safe(() => new CodeReviewAnalyzer().analyze(pullRequests, contributors), 'Review', { track: 'G', score: 50, details: {}, issues: [] }),
        safe(() => new EnvironmentAnalyzer().analyze(tree, packageJson), 'Env', { track: 'H', score: 50, details: {}, issues: [] }),
    ]);

    const trackFindings = { A: ciResult, B: testResult, C: docResult, D: onboardResult, E: depResult, F: flowResult, G: reviewResult, H: envResult };
    console.log(`  ✓ 8 diagnostic tracks complete`);

    const debtMap = safe(() => new DebtDiffuser().analyze(commits, contributors, tree, trackFindings), 'Debt', { contributors: [], debtTimeline: [], details: {} });
    const deadCode = safe(() => new DeadCodeCoroner().analyze(tree, commits), 'Coroner', { deceased: [], totalDeadFiles: 0, details: {} });
    const corpusScore = safe(() => new CorpusScorer().aggregate(trackFindings, debtMap, deadCode), 'Score', { dxScore: 50, severity: 'Unknown', trackScores: [], totalIssues: 0, criticalIssues: 0, warningIssues: 0, goodFindings: 0 });
    const diagnosis = safe(() => new DoctorAI().generateDiagnosis(corpusScore, trackFindings, debtMap, deadCode, repoInfo), 'Doctor', { sections: [], headline: '' });

    const workflowRunsArr = workflowRuns?.workflow_runs || [];
    let collaboration, trauma, immune, archaeology, whispers, clones, sleepStudy, scarTissue;
    await Promise.all([
        (async () => { try { collaboration = new CollaborationAnalyzer().analyze(commits, contributors); } catch (e) { } })(),
        (async () => { try { trauma = new TraumaAnalyzer().analyze(commits); } catch (e) { } })(),
        (async () => { try { immune = new ImmuneSystemAnalyzer().analyze(pullRequests, workflowRunsArr, commits); } catch (e) { } })(),
        (async () => { try { archaeology = new ArchaeologyAnalyzer().analyze(tree, commits); } catch (e) { } })(),
        (async () => { try { whispers = new WhisperAnalyzer().analyze(pullRequests, []); } catch (e) { } })(),
        (async () => { try { clones = new CloneDetector().analyze(tree); } catch (e) { } })(),
        (async () => { try { sleepStudy = new SleepStudyAnalyzer().analyze(commits); } catch (e) { } })(),
        (async () => { try { scarTissue = new ScarTissueAnalyzer().analyze(tree, commits); } catch (e) { } })(),
    ]);
    console.log(`  ✓ V2 extended diagnostics complete`);

    const patient = {
        name: repoInfo.full_name,
        dateOfBirth: repoInfo.created_at,
        admissionTime: new Date().toISOString(),
        familyMembers: repoInfo.forks_count,
        description: repoInfo.description,
        language: repoInfo.language,
        stars: repoInfo.stargazers_count,
        size: repoInfo.size,
        defaultBranch: repoInfo.default_branch,
        isArchived: repoInfo.archived || false,
        openIssues: repoInfo.open_issues_count || 0
    };

    const discharge = {
        id: `scan_demo_${slug}`,
        patient: repoInfo.full_name,
        timestamp: new Date().toISOString(),
        dxScore: corpusScore.dxScore,
        severity: corpusScore.severity,
        tracks: corpusScore.trackScores,
        totalIssues: corpusScore.totalIssues,
        criticalIssues: corpusScore.criticalIssues,
        warningIssues: corpusScore.warningIssues,
        goodFindings: corpusScore.goodFindings,
        topContributors: debtMap.contributors?.slice(0, 5) || [],
        deadCodeCorpses: deadCode.deceased?.slice(0, 5) || [],
        diagnosis: diagnosis.sections,
        repoStats: { stars: repoInfo.stargazers_count, forks: repoInfo.forks_count, language: repoInfo.language, createdAt: repoInfo.created_at, size: repoInfo.size }
    };

    const scanData = {
        slug,
        scanId: `scan_demo_${slug}`,
        owner,
        repo,
        savedAt: new Date().toISOString(),
        isDemoCache: true,
        data: {
            trackFindings, debtMap, deadCode, corpusScore, diagnosis, repoInfo, patient, discharge,
            collaboration, trauma, immune, archaeology, whispers, clones, sleepStudy, scarTissue,
            livingAutopsy: null, obituary: null,
            timeBomb: null, busFactor: null, emotionalTimeline: null, firstDaySim: null, competitorBenchmark: null
        }
    };

    fs.writeFileSync(outPath, JSON.stringify(scanData, null, 2));
    console.log(`  ✅ Saved to scans/${slug}.json  (DX Score: ${corpusScore.dxScore})`);
}

async function main() {
    console.log('🏥 DX-Ray Demo Cache Seeder');
    console.log('═══════════════════════════');
    if (!process.env.GITHUB_TOKEN) {
        console.warn('⚠️  No GITHUB_TOKEN — rate limited to 60 req/hr. This may fail for large repos.');
        console.warn('   Set GITHUB_TOKEN in server/.env for best results.\n');
    }

    for (const { owner, repo, slug } of DEMO_REPOS) {
        await scanRepo(owner, repo, slug);
        await delay(2000); // polite pause between repos
    }

    console.log('\n✅ Cache seeding complete!');
    console.log('   The following demo URLs are now ready:');
    DEMO_REPOS.forEach(({ slug }) => console.log(`   → http://localhost:5174/scan/${slug}`));
    console.log('\n   During the demo, type the repo URL normally — cache will serve instantly.');
}

main().catch(err => {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
});
