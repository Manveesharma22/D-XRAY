import { useEffect, useRef } from 'react';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  // Low ambient machine hum
  ambientHum(duration = 3) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, this.ctx.currentTime + 0.8);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
  }

  // Beep per fracture discovered
  fractureBeep() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.12);
  }

  // Flatline tone — sustained
  flatline() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.8);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 1.8);
  }

  // Tachycardia spike
  tachySpike() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.15);
  }

  // Certificate chime — C5 E5 G5
  certificateChime() {
    if (!this.ctx || !this.enabled) return;
    [523, 659, 784].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + i * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.18 + 0.9);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.18);
      osc.stop(this.ctx.currentTime + i * 0.18 + 0.9);
    });
  }

  // Heartbeat double-thump
  heartbeat() {
    if (!this.ctx || !this.enabled) return;
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 55;
    g1.gain.setValueAtTime(0.07, this.ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc1.connect(g1); g1.connect(this.ctx.destination);
    osc1.start(); osc1.stop(this.ctx.currentTime + 0.18);
    setTimeout(() => {
      if (!this.ctx || !this.enabled) return;
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'sine'; osc2.frequency.value = 45;
      g2.gain.setValueAtTime(0.04, this.ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc2.connect(g2); g2.connect(this.ctx.destination);
      osc2.start(); osc2.stop(this.ctx.currentTime + 0.14);
    }, 220);
  }

  // Scan sweep whoosh
  scanWhoosh() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.8);
  }

  // Ghost whisper
  ghostWhisper() {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.008;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass'; filter.frequency.value = 700; filter.Q.value = 3;
    gain.gain.setValueAtTime(0.018, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    source.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    source.start();
  }

  // Burnout spike — distorted sawtooth + feedback
  burnoutSpike() {
    if (!this.ctx || !this.enabled) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    const g2 = this.ctx.createGain();
    osc1.type = 'sawtooth'; osc1.frequency.value = 220;
    osc2.type = 'sawtooth'; osc2.frequency.value = 227; // slight detune for harsh beating
    g1.gain.setValueAtTime(0.04, this.ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    g2.gain.setValueAtTime(0.035, this.ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc1.connect(g1); g1.connect(this.ctx.destination);
    osc2.connect(g2); g2.connect(this.ctx.destination);
    osc1.start(); osc1.stop(this.ctx.currentTime + 0.5);
    osc2.start(); osc2.stop(this.ctx.currentTime + 0.5);
  }

  // Healing riser — ascending sine sweep, cathartic release
  healingRiser() {
    if (!this.ctx || !this.enabled) return;
    // Three layered ascending sweeps
    const freqs = [[200, 600], [240, 750], [180, 520]];
    freqs.forEach(([start, end], idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(start, this.ctx.currentTime + idx * 0.15);
      osc.frequency.exponentialRampToValueAtTime(end, this.ctx.currentTime + idx * 0.15 + 2.2);
      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.025, this.ctx.currentTime + idx * 0.15 + 0.3);
      gain.gain.linearRampToValueAtTime(0.018, this.ctx.currentTime + idx * 0.15 + 1.8);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + idx * 0.15 + 2.5);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.15);
      osc.stop(this.ctx.currentTime + idx * 0.15 + 2.6);
    });
    // Finale chime at peak
    setTimeout(() => this.certificateChime(), 1800);
  }

  // Mirror spectral hum — deep, ethereal resonance
  mirrorSpectralHum() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 42; // Deep bass
    filter.type = 'lowpass'; filter.frequency.value = 150;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 2);
    osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    osc.start();
    this.mirrorLoop = { osc, gain };
  }

  // Mirror rotation sound — mechanical friction + pitch shift
  mirrorRotationSound() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 2.5);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.5);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 2.5);
  }

  stopMirror() {
    if (this.mirrorLoop) {
      this.mirrorLoop.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      this.mirrorLoop.osc.stop(this.ctx.currentTime + 1.1);
      this.mirrorLoop = null;
    }
  }

  // Eternal Echo — Somber, resonant atmosphere
  eternalEcho() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 52;
    filter.type = 'lowpass'; filter.frequency.value = 100;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 4);
    osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    osc.start();
    this.mourningLoop = { osc, gain };
  }

  stopMourning() {
    if (this.mourningLoop) {
      this.mourningLoop.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
      this.mourningLoop.osc.stop(this.ctx.currentTime + 2.1);
      this.mourningLoop = null;
    }
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
}

export const soundEngine = new SoundEngine();

export default function SoundLayer({ currentAct, ekgPattern, trackResult, confessionProcessed, isMirrorActive, mode }) {
  const prevAct = useRef(0);
  const prevPattern = useRef('');
  const prevMirror = useRef(false);
  const prevMode = useRef('');
  const heartbeatInterval = useRef(null);

  // Init on first interaction
  useEffect(() => {
    const handler = () => { soundEngine.init(); window.removeEventListener('click', handler); window.removeEventListener('keydown', handler); };
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('click', handler); window.removeEventListener('keydown', handler); };
  }, []);

  // Mode transitions (Mourning)
  useEffect(() => {
    if (mode === 'mourning' && prevMode.current !== 'mourning') {
      soundEngine.eternalEcho();
    } else if (mode !== 'mourning' && prevMode.current === 'mourning') {
      soundEngine.stopMourning();
    }
    prevMode.current = mode;
  }, [mode]);

  // Mirror effects
  useEffect(() => {
    if (isMirrorActive && !prevMirror.current) {
      soundEngine.mirrorRotationSound();
      soundEngine.mirrorSpectralHum();
    } else if (!isMirrorActive && prevMirror.current) {
      soundEngine.stopMirror();
    }
    prevMirror.current = isMirrorActive;
  }, [isMirrorActive]);

  // Act transitions
  useEffect(() => {
    if (currentAct !== prevAct.current) {
      if (currentAct === 1) soundEngine.ambientHum(4);
      if (currentAct === 2) soundEngine.scanWhoosh();
      if (currentAct === 3) soundEngine.heartbeat();
      if (currentAct === 4) soundEngine.ghostWhisper();
      prevAct.current = currentAct;
    }
  }, [currentAct]);

  // EKG pattern changes
  useEffect(() => {
    if (ekgPattern !== prevPattern.current) {
      if (ekgPattern === 'flatline') soundEngine.flatline();
      if (ekgPattern === 'erratic') soundEngine.fractureBeep();
      if (ekgPattern === 'tachycardia') soundEngine.tachySpike();
      if (ekgPattern === 'healing') soundEngine.certificateChime();
      prevPattern.current = ekgPattern;
    }
  }, [ekgPattern]);

  // Fracture beep when critical findings arrive; burnout spike for burnout signals
  useEffect(() => {
    if (trackResult) {
      const hasCritical = trackResult?.issues?.some(i => i.severity === 'critical');
      const hasBurnout = trackResult?.burnoutSignals?.some(b => b.riskLevel === 'high');
      if (hasBurnout) {
        soundEngine.burnoutSpike();
      } else if (hasCritical) {
        soundEngine.fractureBeep();
      }
    }
  }, [trackResult]);

  // Certificate chime on confession
  useEffect(() => {
    if (confessionProcessed) soundEngine.certificateChime();
  }, [confessionProcessed]);

  // Heartbeat interval during Act 3 — stable, reads pattern from ref
  const patternRef = useRef(ekgPattern);
  patternRef.current = ekgPattern;

  useEffect(() => {
    if (currentAct === 3) {
      heartbeatInterval.current = setInterval(() => {
        if (patternRef.current === 'normal') soundEngine.heartbeat();
      }, 1400);
    } else {
      clearInterval(heartbeatInterval.current);
    }
    return () => clearInterval(heartbeatInterval.current);
  }, [currentAct]);

  return null;
}
