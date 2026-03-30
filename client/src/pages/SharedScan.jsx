import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { config } from '../api-config';

export default function SharedScan() {
  const { slug } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${config.BACKEND_URL}/api/scans/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Scan not found');
        return res.json();
      })
      .then(data => {
        setScan(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="glass-panel rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Scan Not Found</h2>
          <p className="text-cyan-800/50 text-sm">{error || 'This shared scan does not exist or has expired.'}</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-colors">
            Start New Scan
          </a>
        </div>
      </div>
    );
  }

  const data = scan.data;
  const corpusScore = data.corpusScore;
  const tracks = data.tracks;
  const diagnosis = data.diagnosis;
  const discharge = data.discharge;
  const patient = data.patient;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Shared scan header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="text-[9px] font-mono text-cyan-600/40 tracking-[0.3em] uppercase">
          Shared Diagnostic Report
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          {scan.owner}/{scan.repo}
        </h2>
        <p className="text-cyan-800/50 text-xs font-mono">
          Scanned {new Date(scan.savedAt).toLocaleString()}
        </p>
      </motion.div>

      {/* DX Score */}
      {corpusScore && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-3xl p-8 text-center xray-glow"
        >
          <div className="text-[10px] font-mono text-cyan-600/50 tracking-[0.3em] uppercase mb-2">
            DX Score
          </div>
          <div className={`text-8xl font-black ${corpusScore.dxScore >= 70 ? 'text-emerald-400' :
              corpusScore.dxScore >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
            {corpusScore.dxScore}
          </div>
          <div className="text-sm text-cyan-600/60 mt-2">{corpusScore.severity}</div>
          <div className="flex justify-center gap-6 mt-4 text-[10px] font-mono">
            <span className="text-red-400">{corpusScore.criticalIssues} critical</span>
            <span className="text-amber-400">{corpusScore.warningIssues} warnings</span>
            <span className="text-emerald-400">{corpusScore.goodFindings} good</span>
          </div>
        </motion.div>
      )}

      {/* Track Scores */}
      {corpusScore?.trackScores && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold text-white mb-4">Diagnostic Tracks</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {corpusScore.trackScores.map(t => (
              <div key={t.track} className="p-3 rounded-xl bg-black/20 border border-cyan-900/10">
                <div className="text-[8px] text-cyan-800/40 font-mono uppercase">{t.anatomical}</div>
                <div className="text-[10px] font-bold text-cyan-200 mt-0.5">{t.name}</div>
                <div className={`text-xl font-black mt-1 ${t.score >= 70 ? 'text-emerald-400' : t.score >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                  {t.score}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Diagnosis */}
      {diagnosis?.sections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 font-mono text-xs"
        >
          <h3 className="text-sm font-bold text-white mb-4 font-sans">AI Doctor Diagnosis</h3>
          {diagnosis.sections.map((section, i) => (
            <div key={i} className="mb-3">
              {section.type === 'diagnosis' && (
                <div className="pl-3 border-l border-cyan-900/20">
                  <div className="text-amber-400/70 font-bold">[{section.system}]</div>
                  <div className="text-cyan-200/60 mt-1 pl-2">{section.text}</div>
                  {section.prescription && (
                    <div className="text-emerald-400/50 mt-1 pl-2 italic">Rx: {section.prescription}</div>
                  )}
                </div>
              )}
              {section.type === 'prognosis' && (
                <div className="mt-4 pt-4 border-t border-cyan-900/10 text-cyan-200/70">
                  <span className="text-cyan-400 font-bold">PROGNOSIS:</span> {section.text}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Contributors */}
      {data.debtMap?.contributors && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold text-white mb-4">Contributor Debt Analysis</h3>
          <div className="space-y-3">
            {data.debtMap.contributors.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-cyan-900/10">
                <div className="flex items-center gap-3">
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.login} className="w-7 h-7 rounded-full opacity-70" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                      {c.login?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">{c.login}</div>
                    <div className="text-[9px] text-cyan-800/40 font-mono">{c.totalCommits} commits</div>
                  </div>
                </div>
                <div className="flex gap-4 text-center text-[10px]">
                  <span className="text-red-400">Created: {c.debtCreated}%</span>
                  <span className="text-amber-400">Inherited: {c.debtInherited}%</span>
                  <span className="text-emerald-400">Fixed: {c.debtFixed}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Certificate of Context — THE CLOSING STATEMENT */}
      {data.confession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="glass-panel rounded-3xl p-8 text-center border border-amber-500/10"
        >
          <div className="text-[10px] font-mono text-amber-500/50 tracking-[0.3em] uppercase mb-4">
            Certificate of Context
          </div>
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <p className="text-amber-200/70 text-sm max-w-lg mx-auto leading-relaxed italic">
            {data.confession.certificate?.narrative || 'Context was provided. The scan adjusts its interpretation.'}
          </p>
          <div className="mt-6 pt-4 border-t border-cyan-900/10 text-[10px] text-cyan-800/30 font-mono">
            Every scan deserves the full story. This one got it.
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <div className="text-center py-8">
        <a href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-500/20">
          Scan Your Own Repository
        </a>
      </div>
    </div>
  );
}
