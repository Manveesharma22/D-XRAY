import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function EKGMonitor({ bpm = 60, pattern = 'normal', reason = '' }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ bpm, pattern });
  const [displayBpm, setDisplayBpm] = useState(bpm);
  const historyRef = useRef([]); // ghost trail history

  useEffect(() => {
    stateRef.current = { bpm, pattern };
    setDisplayBpm(bpm);
  }, [bpm, pattern]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(canvas);

    let offset = 0;
    let flatlineTick = 0;
    const midY = h / 2;
    const TRAIL_LEN = 2; // ghost trail frames

    function getColor(p) {
      if (p === 'flatline') return '#ff4444';
      if (p === 'erratic') return '#ffaa00';
      if (p === 'tachycardia') return '#ff2222';
      if (p === 'healing') return '#44ff88';
      return '#00e5ff';
    }

    function getFillColor(p) {
      if (p === 'flatline') return 'rgba(255,68,68,';
      if (p === 'erratic') return 'rgba(255,170,0,';
      if (p === 'tachycardia') return 'rgba(255,34,34,';
      if (p === 'healing') return 'rgba(68,255,136,';
      return 'rgba(0,229,255,';
    }

    function getY(x, p, b) {
      const interval = Math.max(18, 110 - b);
      const t = (x + offset) % interval;
      switch (p) {
        case 'flatline': {
          flatlineTick = (flatlineTick + 1) % 120;
          if (flatlineTick < 100) return midY + (Math.random() - 0.5) * 0.8;
          if (flatlineTick < 108) return midY - Math.sin((flatlineTick - 100) / 8 * Math.PI) * 12;
          return midY + (Math.random() - 0.5) * 0.8;
        }
        case 'erratic': {
          const spike = Math.random() > 0.88;
          return midY + Math.sin((x + offset) * 0.06) * (spike ? 26 : 3) + (Math.random() - 0.5) * (spike ? 7 : 1);
        }
        case 'tachycardia': {
          const fi = interval * 0.45;
          const ft = (x + offset) % fi;
          if (ft < 2) return midY - ft * 5;
          if (ft < 4) return midY - 10 + (ft - 2) * 14;
          if (ft < 6) return midY + 18 - (ft - 4) * 15;
          if (ft < 8) return midY - 12 + (ft - 6) * 6;
          if (ft < 11) return midY + Math.sin((ft - 8) * 1.05) * 7;
          return midY + Math.sin((x + offset) * 0.03) * 1.5;
        }
        case 'healing': {
          const pulse = t < 15 ? Math.sin(t / 15 * Math.PI) * 20 : 0;
          return midY - pulse + Math.sin((x + offset) * 0.025) * 2.5;
        }
        default: {
          if (t < 3) return midY - t * 1.5;
          if (t < 5) return midY - 4.5 + (t - 3) * 2.25;
          if (t < 7) return midY - (t - 5) * 1.2;
          if (t < 9) return midY - 2.4 + (t - 7) * 13;
          if (t < 11) return midY + 23.6 - (t - 9) * 14;
          if (t < 14) return midY - 4.4 + (t - 11) * 2.8;
          if (t < 18) return midY + 4 - (t - 14) * 1.4;
          return midY + Math.sin((x + offset) * 0.012) * 0.8;
        }
      }
    }

    function buildPointArray(p, b) {
      const pts = [];
      for (let x = 0; x < w; x++) pts.push({ x, y: getY(x, p, b) });
      return pts;
    }

    function draw() {
      const { bpm: b, pattern: p } = stateRef.current;
      const color = getColor(p);
      const fillBase = getFillColor(p);
      ctx.clearRect(0, 0, w, h);

      // CRT scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let gy = 0; gy < h; gy += 4) {
        ctx.fillRect(0, gy, w, 1);
      }

      // Grid - Draw only once to a background or optimize
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.02)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gy = 0; gy < h; gy += 16) {
        ctx.moveTo(0, gy); ctx.lineTo(w, gy);
      }
      for (let gx = 0; gx < w; gx += 40) {
        ctx.moveTo(gx, 0); ctx.lineTo(gx, h);
      }
      ctx.stroke();

      // Build current points
      const pts = buildPointArray(p, b);

      // Ghost trail (previous frames)
      historyRef.current.forEach((trail, ti) => {
        const trailOpacity = 0.04 + (ti / historyRef.current.length) * 0.06;
        ctx.strokeStyle = color;
        ctx.globalAlpha = trailOpacity;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        trail.forEach(({ x, y }, xi) => {
          if (xi === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Gradient fill under waveform
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `${fillBase}0.08)`);
      grad.addColorStop(0.5, `${fillBase}0.03)`);
      grad.addColorStop(1, `${fillBase}0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      pts.forEach(({ x, y }) => ctx.lineTo(x, y));
      ctx.lineTo(w, midY);
      ctx.closePath();
      ctx.fill();

      // Main EKG line - Multi-pass glow
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Pass 1: Outer glow
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 4;
      ctx.beginPath();
      pts.forEach(({ x, y }, xi) => {
        if (xi === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Pass 2: Inner glow
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pass 3: Bright core
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Leading edge glow (bright moving dot)
      const lastPt = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(lastPt.x - 2, lastPt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastPt.x - 2, lastPt.y, 2.2, 0, Math.PI * 2);
      ctx.globalAlpha = 1;
      ctx.fill();

      // Flatline flash
      if (p === 'flatline' && Math.sin(offset * 0.08) > 0.5) {
        ctx.fillStyle = 'rgba(255, 68, 68, 0.05)';
        ctx.fillRect(0, 0, w, h);
      }

      // Store trail
      historyRef.current.push(pts);
      if (historyRef.current.length > TRAIL_LEN) historyRef.current.shift();

      offset += p === 'tachycardia' ? 2.8 : p === 'erratic' ? 2 : 1.6;
      if (isVisible) animRef.current = requestAnimationFrame(draw);
      else animRef.current = setTimeout(() => { if (isVisible) draw(); }, 1000); // Polling check
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, []);

  const isCritical = pattern === 'flatline' || pattern === 'tachycardia';
  const statusColor = pattern === 'flatline' ? 'text-red-400'
    : pattern === 'erratic' ? 'text-amber-400'
      : pattern === 'tachycardia' ? 'text-red-500'
        : pattern === 'healing' ? 'text-emerald-400'
          : 'text-cyan-400';
  const statusLabel = {
    flatline: 'FLATLINE', erratic: 'ARRHYTHMIA', tachycardia: 'TACHYCARDIA',
    healing: 'RECOVERING', normal: 'NORMAL SINUS'
  }[pattern] || 'MONITORING';

  // Mock O2 and RESP based on pattern
  const o2Sat = pattern === 'flatline' ? 71 : pattern === 'tachycardia' ? 88 : pattern === 'erratic' ? 92 : 98;
  const resp = pattern === 'flatline' ? 0 : pattern === 'tachycardia' ? 28 : pattern === 'erratic' ? 22 : 16;
  const o2Color = o2Sat < 80 ? 'text-red-400' : o2Sat < 92 ? 'text-amber-400' : 'text-cyan-400';
  const respColor = resp === 0 ? 'text-red-400' : resp > 24 ? 'text-amber-400' : 'text-cyan-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-2xl overflow-hidden ${isCritical ? 'border-red-500/20' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(0,5,10,0.85), rgba(0,10,20,0.7))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-400 animate-pulse' : pattern === 'erratic' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'}`} />
          <span className="text-xs font-mono text-cyan-800/50 tracking-[0.2em] uppercase">ECG Monitor</span>
        </div>
        <div className="flex items-center gap-6">
          {/* O2 SAT */}
          <div className="text-center">
            <div className="text-[9px] font-mono text-cyan-400/50 tracking-wider">SpO₂</div>
            <div className={`text-base font-black font-mono ${o2Color} ${o2Sat < 80 ? 'vital-critical' : ''}`}>
              {o2Sat}<span className="text-[10px] font-normal opacity-50">%</span>
            </div>
          </div>
          {/* RESP */}
          <div className="text-center">
            <div className="text-[9px] font-mono text-cyan-400/50 tracking-wider">RESP</div>
            <div className={`text-base font-black font-mono ${respColor}`}>
              {resp}<span className="text-[10px] font-normal opacity-50">/min</span>
            </div>
          </div>
          {/* BPM + Status */}
          {reason && <span className="text-[10px] text-cyan-400/60 font-mono truncate max-w-[200px]">{reason}</span>}
          <span className={`text-base font-mono font-black uppercase tracking-tighter ${statusColor}`}>{statusLabel}</span>
          <span className={`text-4xl font-black font-mono ${statusColor} ${pattern === 'normal' ? 'animate-heartbeat' : ''}`}>
            {displayBpm}<span className="text-xs font-normal opacity-50 ml-1">BPM</span>
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{
          background: 'rgba(0,3,8,0.6)',
          height: 88,
          display: 'block',
        }}
      />

      {/* Bottom bar */}
      <div className="px-5 py-2 flex items-center justify-between">
        <div className="flex gap-3">
          {['II', 'V1', 'aVF'].map(lead => (
            <span key={lead} className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${lead === 'II' ? 'border-cyan-500/20 text-cyan-500/50' : 'border-cyan-900/10 text-cyan-400/35'}`}>
              {lead}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isCritical && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-[8px] font-mono text-red-400 tracking-wider"
            >
              ⚠ ALERT
            </motion.span>
          )}
          <span className="text-[8px] font-mono text-cyan-400/35 tracking-wider">25mm/s  10mm/mV</span>
        </div>
      </div>
    </motion.div>
  );
}
