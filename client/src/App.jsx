import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScanExperience from './pages/ScanExperience';
import DischargeSummary from './pages/DischargeSummary';
import SharedScan from './pages/SharedScan';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-[#111417] text-[#e1e2e7] relative overflow-x-hidden">
        {/* Cinematic Overlays */}
        <div className="film-grain" />
        <div className="light-leak-cyan top-[-100px] left-[-200px] opacity-40" />
        <div className="light-leak-cyan bottom-[-50px] right-[-300px] opacity-30 rotate-45" />

        <header className="border-b border-white/5 bg-[#111417]/80 backdrop-blur-3xl sticky top-0 z-50">
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
                <h1 className="text-sm font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors font-technical">
                  DX-RAY <span className="text-cyan-500/60 font-normal">DIAGNOSTIC</span>
                </h1>
                <p className="text-[9px] text-cyan-400/50 font-technical tracking-[0.3em] uppercase">Operating Theatre v2.1</p>
              </div>
            </a>
            <nav className="flex items-center gap-4">
              <span className="hidden sm:block text-[9px] font-mono tracking-wider text-cyan-400/30">
                The first tool that understands the humans who built it.
              </span>
              <span className="text-[10px] font-mono text-cyan-400/40 tracking-wider">v2.1</span>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<ScanExperience />} />
          <Route path="/results" element={<DischargeSummary />} />
          <Route path="/discharge/:scanId" element={<DischargeSummary />} />
          <Route path="/scan/:slug" element={<SharedScan />} />
        </Routes>

        <footer className="border-t border-white/5 py-8 mt-20 relative z-10">
          <div className="max-w-7xl mx-auto px-6 text-center text-cyan-400/30 text-[9px] font-technical tracking-[0.4em] uppercase">
            The Sterile Void &mdash; DX-Ray Operating Theatre
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
