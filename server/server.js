require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
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
// New v2 analyzers
const CollaborationAnalyzer = require('./analysis/collaborationAnalyzer');
const TraumaAnalyzer = require('./analysis/traumaAnalyzer');
const ImmuneSystemAnalyzer = require('./analysis/immuneSystemAnalyzer');
const ArchaeologyAnalyzer = require('./analysis/archaeologyAnalyzer');
const WhisperAnalyzer = require('./analysis/whisperAnalyzer');
const CloneDetector = require('./analysis/cloneDetector');
const SleepStudyAnalyzer = require('./analysis/sleepStudyAnalyzer');
const ScarTissueAnalyzer = require('./analysis/scarTissueAnalyzer');
const { generateObituary } = require('./analysis/obituaryEngine');
const TimeBombAnalyzer = require('./analysis/timeBombAnalyzer');
const BusFactorAnalyzer = require('./analysis/busFactorAnalyzer');
const EmotionalTimelineAnalyzer = require('./analysis/emotionalTimelineAnalyzer');
const FirstDaySimulator = require('./analysis/firstDaySimulator');
const CompetitorBenchmark = require('./analysis/competitorBenchmark');
const MirrorAI = require('./analysis/mirrorAI');
const BiologicalShadowAnalyzer = require('./analysis/biologicalShadowAnalyzer');
const MemorialDetector = require('./analysis/memorialDetector');
const PrognosisSimulator = require('./analysis/prognosisSimulator');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Scan cache: owner/repo -> { data, timestamp }
const scanCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Persistent scan storage
const SCANS_DIR = path.join(__dirname, 'scans');
if (!fs.existsSync(SCANS_DIR)) fs.mkdirSync(SCANS_DIR);

// Active scans store
const activeScans = new Map();

function sendWS(ws, type, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

function getCacheKey(owner, repo) {
  return `${owner}/${repo}`.toLowerCase();
}

function getCachedScan(owner, repo) {
  const key = getCacheKey(owner, repo);
  const cached = scanCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedScan(owner, repo, data) {
  const key = getCacheKey(owner, repo);
  scanCache.set(key, { data, timestamp: Date.now() });
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);

      if (msg.type === 'start_scan') {
        await runScan(ws, msg.repoUrl, msg);
      } else if (msg.type === 'confess') {
        const scan = activeScans.get(msg.scanId);
        if (scan) {
          const healingResult = processConfession(scan, msg.confession);
          sendWS(ws, 'confession_processed', { scanId: msg.scanId, healing: healingResult });
        }
      }
    } catch (err) {
      console.error('WS error:', err.message);
      sendWS(ws, 'scan_error', { message: err.message });
    }
  });

  ws.on('close', () => console.log('WebSocket disconnected'));
});

async function runScan(ws, repoUrl, options = {}) {
  const scanId = `scan_${Date.now()}`;
  const gh = new GitHubClient(options.githubToken);

  try {
    const { owner, repo } = gh.parseRepoUrl(repoUrl);

    // Check cache first
    const cached = getCachedScan(owner, repo);
    if (cached && !options.forceFresh) {
      console.log(`Cache hit for ${owner}/${repo}`);
      sendWS(ws, 'scan_started', { scanId, owner, repo, cached: true });
      // Replay cached data with small delays for animation
      sendWS(ws, 'act', { act: 1, name: 'Intake', message: 'Admitting patient...' });
      await delay(300);
      sendWS(ws, 'intake_complete', { patient: cached.patient });
      await delay(400);
      sendWS(ws, 'act', { act: 2, name: 'The X-Ray', message: 'Loading cached scan...' });
      sendWS(ws, 'xray_beam', { phase: 'sweep_1', message: 'Retrieving structure...' });
      await delay(500);

      // Replay tracks
      for (const [key, findings] of Object.entries(cached.trackFindings)) {
        sendWS(ws, 'xray_beam', { phase: 'sweep_2', message: `Track ${key}...` });
        sendWS(ws, 'track_result', { track: key, findings });
        await delay(150);
      }

      sendWS(ws, 'debt_map', cached.debtMap);
      sendWS(ws, 'dead_code', cached.deadCode);
      sendWS(ws, 'dx_score', cached.corpusScore);
      sendWS(ws, 'act', { act: 4, name: 'The Ghost', message: 'The patient is speaking...' });
      sendWS(ws, 'diagnosis', cached.diagnosis);
      sendWS(ws, 'act', { act: 5, name: 'The Confessional', message: 'Would you like to confess?' });

      // Replay v2 data
      if (cached.collaboration) sendWS(ws, 'collaboration_pulse', cached.collaboration);
      if (cached.trauma) sendWS(ws, 'trauma_timeline', cached.trauma);
      if (cached.immune) sendWS(ws, 'immune_system', cached.immune);
      if (cached.archaeology) sendWS(ws, 'archaeology_layer', cached.archaeology);
      if (cached.whispers) sendWS(ws, 'whisper_network', cached.whispers);
      if (cached.clones) sendWS(ws, 'clone_detection', cached.clones);
      if (cached.sleepStudy) sendWS(ws, 'sleep_study', cached.sleepStudy);
      if (cached.scarTissue) sendWS(ws, 'scar_tissue', cached.scarTissue);
      if (cached.livingAutopsy) sendWS(ws, 'living_autopsy', cached.livingAutopsy);
      if (cached.obituary) sendWS(ws, 'codebase_obituary', cached.obituary);

      let prognosis = cached.prognosis;
      if (!prognosis) {
        try {
          const ps = new PrognosisSimulator();
          prognosis = ps.simulate({
            corpusScore: cached.corpusScore,
            trackFindings: cached.trackFindings,
            repoInfo: cached.repoInfo,
            contributors: cached.contributors,
            deadCode: cached.deadCode,
            debtMap: cached.debtMap
          });
        } catch (e) { console.error('Cache prognosis fallback failed:', e.message); }
      }
      if (prognosis) sendWS(ws, 'prognosis_data', prognosis);

      if (cached.mourning) sendWS(ws, 'mourning_detected', cached.mourning);
      if (cached.biologicalShadow) sendWS(ws, 'biological_shadow', cached.biologicalShadow);
      if (cached.timeBomb) sendWS(ws, 'time_bomb', cached.timeBomb);
      if (cached.busFactor) sendWS(ws, 'bus_factor', cached.busFactor);
      if (cached.emotionalTimeline) sendWS(ws, 'emotional_timeline', cached.emotionalTimeline);
      if (cached.firstDaySim) sendWS(ws, 'first_day_sim', cached.firstDaySim);
      if (cached.competitorBenchmark) sendWS(ws, 'competitor_benchmark', cached.competitorBenchmark);

      activeScans.set(scanId, cached);
      sendWS(ws, 'scan_complete', { scanId, discharge: cached.discharge });
      return;
    }

    // ACT 1: INTAKE
    sendWS(ws, 'scan_started', { scanId, owner, repo });
    sendWS(ws, 'act', { act: 1, name: 'Intake', message: 'Admitting patient...' });
    await delay(400);

    const repoInfo = await gh.getRepoInfo(owner, repo);
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
    sendWS(ws, 'intake_complete', { patient });
    await delay(600);

    // ACT 2: THE X-RAY — Fetch data
    sendWS(ws, 'act', { act: 2, name: 'The X-Ray', message: 'Initiating scan sequence...' });
    sendWS(ws, 'xray_beam', { phase: 'sweep_1', message: 'Scanning file structure...' });
    await delay(400);

    const [tree, commits, contributors, pullRequests, workflows, workflowRuns, languages, packageJson, readme, issues] = await Promise.all([
      gh.getTree(owner, repo, repoInfo.default_branch).catch(() => ({ tree: [] })),
      gh.getCommits(owner, repo, null, 100).catch(() => []),
      gh.getContributors(owner, repo).catch(() => []),
      gh.getPullRequests(owner, repo, 'all', 30).catch(() => []),
      gh.getWorkflows(owner, repo).catch(() => ({ workflows: [] })),
      gh.getWorkflowRuns(owner, repo, 30).catch(() => ({ workflow_runs: [] })),
      gh.getLanguages(owner, repo).catch(() => ({})),
      gh.getPackageJson(owner, repo).catch(() => null),
      gh.getReadme(owner, repo).catch(() => null),
      gh.getIssues ? gh.getIssues(owner, repo, 'open', 20).catch(() => []) : Promise.resolve([])
    ]);

    sendWS(ws, 'xray_beam', { phase: 'sweep_1_done', message: 'File structure mapped' });
    await delay(200);
    sendWS(ws, 'xray_beam', { phase: 'sweep_2', message: 'Running all 8 diagnostic tracks...' });

    // Run ALL 8 CORE TRACKS IN PARALLEL
    const ciAnalyzer = new CIAnalyzer();
    const testInspector = new TestSuiteInspector();
    const docScorer = new DocFreshnessScorer();
    const onboardingScorer = new OnboardingScorer();
    const depAnalyzer = new DependencyAnalyzer();
    const flowAnalyzer = new DeveloperFlowAnalyzer();
    const reviewAnalyzer = new CodeReviewAnalyzer();
    const envAnalyzer = new EnvironmentAnalyzer();

    // Safe analyzer wrapper — returns default findings on error
    const safe = (fn, label, defaults) => {
      try { return fn(); } catch (e) { console.error(`${label} failed:`, e.message); return defaults; }
    };

    const [
      ciResult, testResult, docResult, onboardResult,
      depResult, flowResult, reviewResult, envResult
    ] = await Promise.all([
      safe(() => ciAnalyzer.analyze(workflows, workflowRuns, commits), 'CI', { track: 'A', name: 'CI / Build', anatomical: 'The Spine', score: 50, details: {}, issues: [] }),
      safe(() => testInspector.analyze(tree, commits, packageJson), 'Tests', { track: 'B', name: 'Test Suite', anatomical: 'The Ribcage', score: 50, details: {}, issues: [] }),
      safe(() => docScorer.analyze(tree, readme, commits), 'Docs', { track: 'C', name: 'Documentation', anatomical: 'The Skull', score: 50, details: {}, issues: [] }),
      safe(() => onboardingScorer.analyze(tree, readme, packageJson, contributors), 'Onboarding', { track: 'D', name: 'Onboarding', anatomical: 'The Nervous System', score: 50, details: {}, issues: [] }),
      safe(() => depAnalyzer.analyze(packageJson, tree), 'Deps', { track: 'E', name: 'Dependencies', anatomical: 'The Veins', score: 50, details: {}, issues: [] }),
      safe(() => flowAnalyzer.analyze(commits, contributors, pullRequests), 'Flow', { track: 'F', name: 'Developer Flow', anatomical: 'The Heartbeat', score: 50, details: {}, issues: [], burnoutSignals: [], rageCommits: [] }),
      safe(() => reviewAnalyzer.analyze(pullRequests, contributors), 'Review', { track: 'G', name: 'Code Review', anatomical: 'The Circulation', score: 50, details: {}, issues: [] }),
      safe(() => envAnalyzer.analyze(tree, packageJson), 'Env', { track: 'H', name: 'Environment', anatomical: 'The Skin', score: 50, details: {}, issues: [] })
    ]);

    // Emit results sequentially for animation, but analysis was parallel
    const trackFindings = {
      A: ciResult, B: testResult, C: docResult, D: onboardResult,
      E: depResult, F: flowResult, G: reviewResult, H: envResult
    };

    // Emit each track result with heartbeat reactions
    for (const [key, findings] of Object.entries(trackFindings)) {
      sendWS(ws, 'track_result', { track: key, findings });

      // Heartbeat reactions per track
      if (key === 'A') {
        const ciCritical = findings.issues?.some(i => i.severity === 'critical');
        sendWS(ws, 'heartbeat', {
          bpm: findings.score > 70 ? 60 : findings.score > 40 ? 90 : 140,
          pattern: ciCritical ? 'tachycardia' : (findings.score > 70 ? 'normal' : 'erratic'),
          reason: findings.issues[0]?.message || 'CI scan complete'
        });
      }
      if (key === 'B' && findings.score < 30) {
        sendWS(ws, 'heartbeat', { bpm: 130, pattern: 'erratic', reason: 'Test suite fractured' });
      }
      if (key === 'C' && findings.score < 30) {
        sendWS(ws, 'heartbeat', { bpm: 0, pattern: 'flatline', reason: 'Documentation flatline' });
      }
      if (key === 'E' && findings.details?.vulnerabilityCount > 0) {
        sendWS(ws, 'heartbeat', { bpm: 150, pattern: 'tachycardia', reason: `${findings.details.vulnerabilityCount} vulnerabilities detected` });
      }
      if (key === 'F' && findings.burnoutSignals?.some(b => b.riskLevel === 'high')) {
        sendWS(ws, 'heartbeat', { bpm: 110, pattern: 'erratic', reason: 'Burnout signals detected' });
      }
      await delay(200);
    }

    sendWS(ws, 'xray_beam', { phase: 'sweep_2_done', message: 'All tracks complete' });
    await delay(200);

    // ACT 3: HEARTBEAT — Debt + Coroner + Score
    sendWS(ws, 'act', { act: 3, name: 'The Heartbeat', message: 'Computing vital signs...' });
    sendWS(ws, 'xray_beam', { phase: 'sweep_3', message: 'Building Debt Inheritance Map...' });
    await delay(300);

    let debtMap, deadCode, corpusScore;

    try {
      const debtDiffuser = new DebtDiffuser();
      debtMap = debtDiffuser.analyze(commits, contributors, tree, trackFindings);
    } catch (e) {
      console.error('Debt map failed:', e.message);
      debtMap = { contributors: [], debtTimeline: [], details: {} };
    }
    sendWS(ws, 'debt_map', debtMap);
    await delay(400);

    sendWS(ws, 'xray_beam', { phase: 'coroner', message: 'Dispatching Dead Code Coroner...' });
    try {
      const coroner = new DeadCodeCoroner();
      deadCode = coroner.analyze(tree, commits);
    } catch (e) {
      console.error('Coroner failed:', e.message);
      deadCode = { deceased: [], totalDeadFiles: 0, details: {} };
    }
    sendWS(ws, 'dead_code', deadCode);
    await delay(300);

    try {
      const scorer = new CorpusScorer();
      corpusScore = scorer.aggregate(trackFindings, debtMap, deadCode);
    } catch (e) {
      console.error('Scorer failed:', e.message);
      corpusScore = { dxScore: 50, severity: 'Unknown', trackScores: [], totalIssues: 0, criticalIssues: 0, warningIssues: 0, goodFindings: 0 };
    }
    sendWS(ws, 'dx_score', corpusScore);
    sendWS(ws, 'heartbeat', { bpm: 60, pattern: 'normal', reason: 'Vital signs computed' });

    // V2: PRE-CALCULATE PROGNOSIS (Fast-path)
    let prognosis = null;
    try {
      const ps = new PrognosisSimulator();
      prognosis = ps.simulate({ corpusScore, trackFindings, repoInfo, contributors, deadCode, debtMap });
      if (prognosis) sendWS(ws, 'prognosis_data', prognosis);
    } catch (e) { console.error('Early prognosis failed:', e.message); }

    await delay(300);

    // ACT 4: THE GHOST
    sendWS(ws, 'act', { act: 4, name: 'The Ghost', message: 'The patient is speaking...' });
    await delay(600);

    // ============================================================
    // V2 EXTENDED DIAGNOSTICS — Run all in parallel
    // ============================================================
    sendWS(ws, 'xray_beam', { phase: 'v2_scan', message: 'Running extended diagnostics...' });

    const workflowRunsArr = workflowRuns?.workflow_runs || [];

    let collaboration, trauma, immune, archaeology, whispers, clones, sleepStudy, scarTissue;
    let timeBomb, busFactor, emotionalTimeline, firstDaySim, competitorBenchmark, biologicalShadow, mourningData;

    await Promise.all([
      (async () => {
        try {
          const ca = new CollaborationAnalyzer();
          collaboration = ca.analyze(commits, contributors);
          sendWS(ws, 'collaboration_pulse', collaboration);
        } catch (e) { console.error('Collaboration failed:', e.message); }
      })(),
      (async () => {
        try {
          const ta = new TraumaAnalyzer();
          trauma = ta.analyze(commits);
          sendWS(ws, 'trauma_timeline', trauma);
        } catch (e) { console.error('Trauma failed:', e.message); }
      })(),
      (async () => {
        try {
          const ia = new ImmuneSystemAnalyzer();
          immune = ia.analyze(pullRequests, workflowRunsArr, commits);
          sendWS(ws, 'immune_system', immune);
        } catch (e) { console.error('Immune failed:', e.message); }
      })(),
      (async () => {
        try {
          const aa = new ArchaeologyAnalyzer();
          archaeology = aa.analyze(tree, commits);
          sendWS(ws, 'archaeology_layer', archaeology);
        } catch (e) { console.error('Archaeology failed:', e.message); }
      })(),
      (async () => {
        try {
          const wa = new WhisperAnalyzer();
          whispers = wa.analyze(pullRequests, issues);
          sendWS(ws, 'whisper_network', whispers);
        } catch (e) { console.error('Whispers failed:', e.message); }
      })(),
      (async () => {
        try {
          const cd = new CloneDetector();
          clones = cd.analyze(tree);
          sendWS(ws, 'clone_detection', clones);
        } catch (e) { console.error('Clones failed:', e.message); }
      })(),
      (async () => {
        try {
          const ssa = new SleepStudyAnalyzer();
          sleepStudy = ssa.analyze(commits);
          sendWS(ws, 'sleep_study', sleepStudy);
        } catch (e) { console.error('Sleep study failed:', e.message); }
      })(),
      (async () => {
        try {
          const sta = new ScarTissueAnalyzer();
          scarTissue = sta.analyze(tree, commits);
          sendWS(ws, 'scar_tissue', scarTissue);
        } catch (e) { console.error('Scar tissue failed:', e.message); }
      })(),
      (async () => {
        try {
          const tba = new TimeBombAnalyzer();
          timeBomb = tba.analyze(trackFindings, packageJson, commits);
          if (timeBomb?.triggered) sendWS(ws, 'time_bomb', timeBomb);
        } catch (e) { console.error('TimeBomb failed:', e.message); }
      })(),
      (async () => {
        try {
          const bfa = new BusFactorAnalyzer();
          busFactor = bfa.analyze(commits, contributors, tree);
          if (busFactor?.triggered) sendWS(ws, 'bus_factor', busFactor);
        } catch (e) { console.error('BusFactor failed:', e.message); }
      })(),
      (async () => {
        try {
          const bsa = new BiologicalShadowAnalyzer();
          biologicalShadow = bsa.analyze(commits, contributors);
          if (biologicalShadow) sendWS(ws, 'biological_shadow', biologicalShadow);
        } catch (e) { console.error('BiologicalShadow failed:', e.message); }
      })(),
      (async () => {
        try {
          const md = new MemorialDetector();
          mourningData = md.analyze(repoInfo, commits, contributors);
          if (mourningData?.triggered) {
            console.log(`🕯️  The Eternal Echo detected: ${mourningData.deceasedName}`);
            sendWS(ws, 'mourning_detected', mourningData);
          }
        } catch (e) { console.error('Memorial detection failed:', e.message); }
      })(),
      (async () => {
        try {
          const eta = new EmotionalTimelineAnalyzer();
          emotionalTimeline = eta.analyze(commits);
          if (emotionalTimeline) sendWS(ws, 'emotional_timeline', emotionalTimeline);
        } catch (e) { console.error('EmotionalTimeline failed:', e.message); }
      })(),
      (async () => {
        try {
          const fds = new FirstDaySimulator();
          firstDaySim = fds.analyze(trackFindings, repoInfo, readme);
          if (fds) sendWS(ws, 'first_day_sim', firstDaySim);
        } catch (e) { console.error('FirstDaySim failed:', e.message); }
      })(),
      (async () => {
        try {
          const cb = new CompetitorBenchmark();
          competitorBenchmark = cb.analyze(trackFindings, repoInfo, commits, contributors);
          if (competitorBenchmark) sendWS(ws, 'competitor_benchmark', competitorBenchmark);
        } catch (e) { console.error('CompetitorBenchmark failed:', e.message); }
      })()
    ]);

    // Now run DoctorAI with all data available
    const doctorAI = new DoctorAI();
    const diagnosis = doctorAI.generateDiagnosis(corpusScore, trackFindings, debtMap, deadCode, repoInfo, biologicalShadow);
    sendWS(ws, 'diagnosis', diagnosis);
    await delay(400);



    // ACT 5: THE CONFESSIONAL
    sendWS(ws, 'act', { act: 5, name: 'The Confessional', message: 'Would you like to confess?' });

    // === CODEBASE OBITUARY ===
    let obituary = null;
    try {
      obituary = generateObituary(repoInfo, commits, contributors, trackFindings, patient);
      if (obituary) {
        console.log(`⚰️  Obituary triggered for ${repoInfo.full_name} — dead ${obituary.daysSinceDeath} days`);
        sendWS(ws, 'codebase_obituary', obituary);
      }
    } catch (e) { console.error('Obituary failed:', e.message); }

    // === LIVING AUTOPSY CHECK ===
    let livingAutopsy = null;
    const lastCommitMs = commits.length > 0 ? new Date(commits[0]?.commit?.author?.date).getTime() : null;
    const silentDays = lastCommitMs ? Math.floor((Date.now() - lastCommitMs) / (1000 * 60 * 60 * 24)) : 0;
    const isAbandoned = repoInfo.archived === true || silentDays > 365;

    if (isAbandoned && commits.length > 0) {
      // PASSION SCORE — We look for signals of genuine ambition
      let passionScore = 0;
      const passionSignals = [];

      // 1. Commit density
      if (commits.length >= 100) { passionScore += 25; passionSignals.push(`${commits.length} commits`); }
      else if (commits.length >= 50) { passionScore += 15; passionSignals.push(`${commits.length} commits`); }
      else if (commits.length >= 20) { passionScore += 8; passionSignals.push(`${commits.length} commits`); }

      // 2. Team investment
      if (contributors.length >= 5) { passionScore += 20; passionSignals.push(`${contributors.length} contributors`); }
      else if (contributors.length >= 3) { passionScore += 12; passionSignals.push(`${contributors.length} contributors`); }
      else if (contributors.length >= 2) { passionScore += 6; passionSignals.push('multiple contributors'); }

      // 3. Commit message quality
      const avgMsgLen = commits.slice(0, 30).map(c => (c.commit?.message || '').length).reduce((a, b) => a + b, 0) / Math.min(commits.length, 30);
      if (avgMsgLen > 40) { passionScore += 15; passionSignals.push('thoughtful commit history'); }
      else if (avgMsgLen > 20) { passionScore += 8; passionSignals.push('descriptive commits'); }

      // 4. Had tests
      const hadTests = trackFindings.B?.score > 30 || tree.tree?.some(f => f.path?.includes('test') || f.path?.includes('spec'));
      if (hadTests) { passionScore += 15; passionSignals.push('test coverage exists'); }

      // 5. Had CI
      if (trackFindings.A?.score > 30 || workflows?.workflows?.length > 0) {
        passionScore += 10; passionSignals.push('CI pipeline configured');
      }

      // 6. Stars or forks
      if (repoInfo.stargazers_count >= 50) { passionScore += 20; passionSignals.push(`${repoInfo.stargazers_count} stars`); }
      else if (repoInfo.stargazers_count >= 10) { passionScore += 10; passionSignals.push(`${repoInfo.stargazers_count} stars`); }

      // 7. Had documentation
      if (trackFindings.C?.score > 40 || readme) {
        passionScore += 8; passionSignals.push('documentation written');
      }

      // 8. Velocity bursts
      const sortedByDate = [...commits].sort((a, b) => new Date(b.commit?.author?.date) - new Date(a.commit?.author?.date));
      let maxBurst = 0;
      for (let i = 0; i < sortedByDate.length - 5; i++) {
        const windowEnd = new Date(sortedByDate[i]?.commit?.author?.date).getTime();
        const windowStart = new Date(sortedByDate[Math.min(i + 10, sortedByDate.length - 1)]?.commit?.author?.date).getTime();
        const windowDays = (windowEnd - windowStart) / (1000 * 60 * 60 * 24);
        if (windowDays < 7) maxBurst = Math.max(maxBurst, 10);
        if (windowDays < 3) maxBurst = Math.max(maxBurst, 18);
      }
      if (maxBurst > 0) { passionScore += maxBurst; passionSignals.push('velocity bursts detected'); }

      const hadQuality = corpusScore.dxScore >= 35;
      const wasAmbitious = passionScore >= 30;

      if (wasAmbitious && hadQuality) {
        const completionProxy = Math.min(100, Math.round((passionScore / 80) * 60 + (corpusScore.dxScore / 100) * 40));
        livingAutopsy = {
          triggered: true,
          repoName: repoInfo.full_name,
          lastCommit: commits[0]?.commit?.author?.date,
          totalCommits: commits.length,
          peakContributors: contributors.length,
          dxScore: corpusScore.dxScore,
          passionScore,
          passionSignals,
          silentDays,
          completionProxy,
          causeOfDeath: 'External. Not the code\'s fault.',
          epitaph: 'This wasn\'t a failure of engineering. This was a failure of circumstance. The code was ready. The world wasn\'t.'
        };
        console.log(`💀 Living Autopsy triggered for ${repoInfo.full_name} — passion: ${passionScore}, silent: ${silentDays} days`);
        sendWS(ws, 'living_autopsy', livingAutopsy);
      }
    }


    // === THE MIRROR (Personal X-Ray) ===
    let mirrorData = null;
    try {
      const mirrorUser = await gh.getAuthenticatedUser();
      if (mirrorUser) {
        const [userEvents, userRepoPRs] = await Promise.all([
          gh.getUserEvents(mirrorUser.login),
          gh.getUserPRs(mirrorUser.login, owner, repo)
        ]);
        const mirrorAI = new MirrorAI();
        mirrorData = mirrorAI.analyze(mirrorUser, userEvents, userRepoPRs, commits, pullRequests);
        if (mirrorData) {
          sendWS(ws, 'mirror_scan', mirrorData);
        }
      }
    } catch (e) { console.error('The Mirror failed:', e.message); }

    const discharge = buildDischargeSummary(scanId, repoInfo, corpusScore, trackFindings, debtMap, deadCode, diagnosis);

    const scanData = {
      trackFindings, debtMap, deadCode, corpusScore, diagnosis, repoInfo, patient, discharge,
      collaboration, trauma, immune, archaeology, whispers, clones, sleepStudy, scarTissue, livingAutopsy, obituary,
      timeBomb, busFactor, emotionalTimeline, firstDaySim, competitorBenchmark, biologicalShadow, mirror: mirrorData,
      mourning: mourningData, prognosis
    };
    activeScans.set(scanId, scanData);
    setCachedScan(owner, repo, scanData);

    sendWS(ws, 'scan_complete', { scanId, discharge });

  } catch (error) {
    console.error('Scan error:', error);
    sendWS(ws, 'scan_error', { message: error.message, stack: error.stack });
  }
}


function processConfession(scan, confession) {
  const c = confession.toLowerCase();
  const healing = { fractures: [], ekgChange: 0, scoreBoost: 0, certificate: null };
  const tokens = [];
  const fractureMap = {
    deadline_pressure: { keywords: ['deadline', 'rushed', 'pressure', 'crunch', 'ship date'], heal: 'CI instability explained by deadline pressure — builds were sacrificed for velocity' },
    team_turnover: { keywords: ['left', 'quit', 'departed', 'resigned', 'fired', 'moved on'], heal: 'Documentation gaps explained by team transitions — knowledge walked out the door' },
    legacy_inheritance: { keywords: ['legacy', 'inherited', 'previous team', 'old code', 'before us'], heal: 'Technical debt is inherited, not created — the original authors made different decisions under different constraints' },
    experimental: { keywords: ['experiment', 'prototype', 'poc', 'proof of concept', 'spike'], heal: 'Dead code was exploratory work that proved a hypothesis — not neglect' },
    resource_constraints: { keywords: ['understaffed', 'overworked', 'resource', 'no time', 'short staffed'], heal: 'Coverage gaps due to resource constraints, not negligence — the team did what they could with what they had' },
    security_aware: { keywords: ['security', 'vulnerability', 'cve', 'mitigation', 'risk accepted'], heal: 'Team is aware of vulnerabilities and has a mitigation plan — risk is accepted, not ignored' },
    scope_creep: { keywords: ['scope', 'requirements changed', 'feature creep', 'pivot'], heal: 'Architectural debt is the result of shifting requirements, not poor design' }
  };

  for (const [token, config] of Object.entries(fractureMap)) {
    if (config.keywords.some(kw => c.includes(kw))) {
      tokens.push(token);
      healing.fractures.push(config.heal);
    }
  }

  healing.scoreBoost = Math.min(15, tokens.length * 5);
  healing.ekgChange = tokens.length * 8;
  healing.contextTokens = tokens;

  let narrative;
  if (tokens.length > 1) {
    narrative = `Context received. ${tokens.length} factors identified: ${healing.fractures.map(f => f.split(' — ')[0].toLowerCase()).join('; ')}. The X-ray reinterprets its findings with this human context. Every scan deserves the full story. This one got it.`;
  } else if (tokens.length === 1) {
    narrative = `${healing.fractures[0]}. The X-ray adjusts. A fracture that looked like negligence now looks like a decision made under constraint. Context changes everything.`;
  } else {
    narrative = 'Confession noted. The act of providing context — even without specific keyword matches — changes the interpretation of this scan. Every codebase has a story. This one was told.';
  }

  healing.certificate = {
    patientConfessed: true,
    contextProvided: tokens.length > 0,
    tokens,
    narrative,
    timestamp: new Date().toISOString()
  };

  return healing;
}

function buildDischargeSummary(scanId, repoInfo, corpusScore, trackFindings, debtMap, deadCode, diagnosis) {
  return {
    id: scanId,
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
    repoStats: {
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      language: repoInfo.language,
      createdAt: repoInfo.created_at,
      size: repoInfo.size
    }
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Production static file serving ──────────────────────────────────────────
const DIST_PATH = path.join(__dirname, '../client/dist');

// Serve static assets from client/dist if they exist
if (fs.existsSync(DIST_PATH)) {
  console.log(`Serving static files from ${DIST_PATH}`);
  app.use(express.static(DIST_PATH));
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), cachedScans: scanCache.size });
});

app.post('/api/scans/save', (req, res) => {
  const { scanId, owner, repo, data } = req.body;
  const slug = `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const scanData = { slug, scanId, owner, repo, data, savedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(SCANS_DIR, `${slug}.json`), JSON.stringify(scanData, null, 2));
  res.json({ slug, url: `/scan/${slug}` });
});

app.get('/api/scans/:slug', (req, res) => {
  const filePath = path.join(SCANS_DIR, `${req.params.slug}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Scan not found' });
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
});

app.get('/api/scans', (req, res) => {
  if (!fs.existsSync(SCANS_DIR)) return res.json([]);
  const scans = fs.readdirSync(SCANS_DIR).filter(f => f.endsWith('.json')).map(f => {
    const d = JSON.parse(fs.readFileSync(path.join(SCANS_DIR, f), 'utf-8'));
    return { slug: d.slug, owner: d.owner, repo: d.repo, savedAt: d.savedAt };
  });
  res.json(scans);
});

// ─── Memorial Wall endpoints ─────────────────────────────────────────────────
const MEMORIALS_FILE = path.join(__dirname, 'scans', 'memorials.json');

function loadMemorials() {
  if (!fs.existsSync(MEMORIALS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(MEMORIALS_FILE, 'utf-8')); } catch { return {}; }
}

function saveMemorials(data) {
  fs.writeFileSync(MEMORIALS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/memorial/:repoSlug — get flowers for a repo
app.get('/api/memorial/:repoSlug', (req, res) => {
  const memorials = loadMemorials();
  const entry = memorials[req.params.repoSlug] || { flowers: [], count: 0 };
  res.json(entry);
});

// POST /api/memorial/:repoSlug/flower — leave a flower
app.post('/api/memorial/:repoSlug/flower', express.json(), (req, res) => {
  const { handle } = req.body || {};
  const slug = req.params.repoSlug;
  const memorials = loadMemorials();
  if (!memorials[slug]) memorials[slug] = { flowers: [], count: 0 };
  const entry = memorials[slug];
  // Deduplicate by handle
  const sanitized = (handle || 'anonymous').replace(/[^a-zA-Z0-9_\-\.]/g, '').slice(0, 39);
  if (sanitized && !entry.flowers.find(f => f.handle === sanitized)) {
    entry.flowers.push({ handle: sanitized, leftAt: new Date().toISOString() });
  }
  entry.count = entry.flowers.length;
  saveMemorials(memorials);
  res.json({ success: true, count: entry.count, flowers: entry.flowers.slice(-20) });
});

// Single Page Application catch-all route
// IMPORTANT: This must be after all API routes
if (fs.existsSync(DIST_PATH)) {
  app.use((req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`DX-Ray Scanner server running on http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  if (process.env.GITHUB_TOKEN) {
    console.log(`GitHub token loaded — 5,000 req/hr rate limit`);
  } else {
    console.log(`No GitHub token — rate limited to 60 req/hr. Add GITHUB_TOKEN to server/.env`);
  }
});
