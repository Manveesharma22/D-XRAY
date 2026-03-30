import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScanExperience from './pages/ScanExperience';
import DischargeSummary from './pages/DischargeSummary';
import SharedScan from './pages/SharedScan';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-cyan-900/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  DX-Ray <span className="text-cyan-500/60 font-normal">Scanner</span>
                </h1>
                <p className="text-[9px] text-cyan-800 font-medium tracking-widest uppercase">Full-Body Code Diagnostic</p>
              </div>
            </a>
            <nav className="flex items-center gap-4">
              <span className="hidden sm:block text-[9px] font-mono tracking-wider" style={{ color: 'rgba(0,229,255,0.25)' }}>
                The first tool that understands the humans who built it.
              </span>
              <span className="text-[10px] font-mono text-cyan-900/50 tracking-wider">v2.1</span>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<ScanExperience />} />
          <Route path="/results" element={<DischargeSummary />} />
          <Route path="/discharge/:scanId" element={<DischargeSummary />} />
          <Route path="/scan/:slug" element={<SharedScan />} />
        </Routes>

        <footer className="border-t border-cyan-900/10 py-6 mt-20">
          <div className="max-w-7xl mx-auto px-6 text-center text-cyan-900/30 text-[10px] tracking-wider uppercase">
            DX-Ray Scanner &mdash; The first tool that doesn&apos;t just scan your codebase. It understands the humans who built it.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
