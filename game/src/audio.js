// audio.js — tiny WebAudio synth: no audio files, everything generated.
// Footsteps (soft ticks, louder when sprinting), a guard footstep pip
// when a guard steps near you, an alert sting, pickup blips and the
// win/lose stingers. Created lazily on the first user gesture.

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return !!this.ctx;
  }

  tone(freq, dur, type, gain, when = 0) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  footstep(loud) {
    this.tone(loud ? 140 : 95, 0.06, 'sine', loud ? 0.10 : 0.045);
  }

  guardStep(dist) {
    // A guard's step: audible only when the guard is close.
    const v = Math.max(0, 1 - dist / 260) * 0.05;
    if (v > 0.004) this.tone(180, 0.05, 'triangle', v);
  }

  alert() {
    this.tone(520, 0.16, 'square', 0.08);
    this.tone(392, 0.22, 'square', 0.08, 0.16);
  }

  suspicious() {
    this.tone(660, 0.08, 'triangle', 0.05);
  }

  pickup() {
    this.tone(880, 0.09, 'sine', 0.09);
    this.tone(1318, 0.14, 'sine', 0.09, 0.08);
  }

  levelClear() {
    this.tone(523, 0.12, 'sine', 0.09);
    this.tone(659, 0.12, 'sine', 0.09, 0.11);
    this.tone(784, 0.2, 'sine', 0.09, 0.22);
  }

  caught() {
    this.tone(220, 0.3, 'sawtooth', 0.09);
    this.tone(147, 0.45, 'sawtooth', 0.09, 0.25);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.09, i * 0.14));
  }
}
