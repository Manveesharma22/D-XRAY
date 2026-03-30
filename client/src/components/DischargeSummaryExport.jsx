import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function DischargeSummaryExport({ discharge, tracks, corpusScore, confession }) {
  const [exported, setExported] = useState(false);

  if (!discharge) return null;

  const generateHTML = () => {
    const trackRows = (corpusScore?.trackScores || []).map(t => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #1e293b;font-weight:600;color:#e2e8f0">${t.track}</td>
        <td style="padding:8px;border-bottom:1px solid #1e293b;color:#94a3b8">${t.name}</td>
        <td style="padding:8px;border-bottom:1px solid #1e293b;color:#94a3b8;font-style:italic">${t.anatomical}</td>
        <td style="padding:8px;border-bottom:1px solid #1e293b;font-weight:700;color:${t.score >= 70 ? '#10b981' : t.score >= 40 ? '#f59e0b' : '#ef4444'}">${t.score}/100</td>
      </tr>
    `).join('');

    const topContribs = (discharge.topContributors || []).map(c => `
      <div style="padding:12px;border:1px solid #1e293b;border-radius:12px;margin-bottom:8px">
        <div style="font-weight:700;color:#e2e8f0">${c.login}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px">${c.totalCommits} commits over ${c.tenure} days</div>
        <div style="display:flex;gap:16px;margin-top:8px">
          <span style="color:#ef4444;font-size:12px">Created: ${c.debtCreated}%</span>
          <span style="color:#f59e0b;font-size:12px">Inherited: ${c.debtInherited}%</span>
          <span style="color:#10b981;font-size:12px">Fixed: ${c.debtFixed}%</span>
        </div>
      </div>
    `).join('');

    const deadCode = (discharge.deadCodeCorpses || []).map(c => `
      <div style="padding:8px;border:1px solid rgba(239,68,68,0.2);border-radius:8px;margin-bottom:4px;font-size:12px">
        <span style="color:#fca5a5;font-family:monospace">${c.file}</span>
        <span style="color:#64748b;margin-left:8px">${c.causeOfDeath}</span>
      </div>
    `).join('');

    // Certificate of Context as closing statement
    const certificateHtml = confession ? `
      <div style="text-align:center;padding:40px 24px;margin-top:48px;border:1px solid rgba(245,158,11,0.15);border-radius:24px;background:rgba(245,158,11,0.03)">
        <div style="font-size:11px;color:#d97706;text-transform:uppercase;letter-spacing:4px;margin-bottom:16px">Certificate of Context</div>
        <div style="font-size:14px;color:#fbbf24;max-width:500px;margin:0 auto;line-height:1.8;font-style:italic">
          ${confession.certificate?.narrative || 'Context was provided for this scan. The findings have been reinterpreted.'}
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(30,41,59,0.5);font-size:10px;color:#64748b">
          Every scan deserves the full story. This one got it.
        </div>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>DX-Ray Discharge: ${discharge.patient}</title></head>
<body style="background:#0a0a0a;color:#e2e8f0;font-family:system-ui;max-width:800px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;margin-bottom:40px">
    <h1 style="font-size:28px;font-weight:900;color:#00e5ff">DX-Ray Discharge Summary</h1>
    <p style="color:#64748b;font-size:14px">Patient: ${discharge.patient} | Generated: ${new Date(discharge.timestamp).toLocaleString()}</p>
  </div>

  <div style="text-align:center;padding:32px;border:1px solid rgba(0,229,255,0.2);border-radius:24px;margin-bottom:32px">
    <div style="font-size:12px;color:#0088aa;text-transform:uppercase;letter-spacing:3px">DX Score</div>
    <div style="font-size:72px;font-weight:900;color:${corpusScore?.dxScore >= 70 ? '#10b981' : corpusScore?.dxScore >= 40 ? '#f59e0b' : '#ef4444'}">${discharge.dxScore}</div>
    <div style="font-size:14px;color:#64748b">${discharge.severity}</div>
    <div style="margin-top:12px;font-size:11px;color:#64748b">${discharge.criticalIssues} critical | ${discharge.warningIssues} warnings | ${discharge.goodFindings} good</div>
  </div>

  <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Diagnostic Tracks</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead><tr style="border-bottom:2px solid #1e293b">
      <th style="padding:8px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Track</th>
      <th style="padding:8px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">System</th>
      <th style="padding:8px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Anatomy</th>
      <th style="padding:8px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Score</th>
    </tr></thead>
    <tbody>${trackRows}</tbody>
  </table>

  ${topContribs ? `<h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Contributor Debt Analysis</h2><div style="margin-bottom:32px">${topContribs}</div>` : ''}

  ${deadCode ? `<h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Dead Code Report</h2><div style="margin-bottom:32px">${deadCode}</div>` : ''}

  ${certificateHtml}

  <div style="text-align:center;padding:24px;color:#1e40af;font-size:11px;border-top:1px solid #1e293b;margin-top:40px">
    Generated by DX-Ray Scanner &mdash; Every other tool tells you what's wrong. We tell you why.
  </div>
</body>
</html>`;
  };

  const handleExport = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dxray-discharge-${discharge.patient?.replace(/\//g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-8 text-center"
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Discharge Summary</h3>
      <p className="text-cyan-800/50 text-xs mb-6 max-w-md mx-auto">
        Download the complete diagnostic report as a shareable HTML document.
      </p>

      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
        <div className="p-3 rounded-xl bg-black/20 border border-cyan-900/10">
          <div className="text-[9px] text-cyan-800/50 font-mono uppercase">Score</div>
          <div className={`text-xl font-black ${corpusScore?.dxScore >= 70 ? 'text-emerald-400' : corpusScore?.dxScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {discharge.dxScore}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-cyan-900/10">
          <div className="text-[9px] text-cyan-800/50 font-mono uppercase">Issues</div>
          <div className="text-xl font-black text-amber-400">{discharge.totalIssues}</div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-cyan-900/10">
          <div className="text-[9px] text-cyan-800/50 font-mono uppercase">Tracks</div>
          <div className="text-xl font-black text-cyan-400">8</div>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
      >
        {exported ? 'Downloaded' : 'Download Discharge Summary'}
      </button>
    </motion.div>
  );
}
