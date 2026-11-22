// main.js — GHOSTSHIFT: a top-down stealth game.
// Boot, game loop, state machine (menu -> playing -> level-clear / caught
// -> win), HUD updates, scoring, noise rings and the debug handle the
// playtest harness reads (window.__ghostshift).

import { LEVELS } from './levels.js';
import { Player } from './player.js';
import { Guard } from './guard.js';
import { Render } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { applyPose } from './shots.js';

const $ = (id) => document.getElementById(id);

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.render = new Render(canvas);
    this.input = new Input();
    this.audio = new Audio();
    this.state = 'menu'; // menu | playing | paused | caught | levelclear | win
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.player = new Player(0, 0);
    this.guards = [];
    this.intel = [];
    this.time = 0;
    this.levelTime = 0;
    this.noiseRings = [];
    this.noiseTimer = 0;
    this.intelGot = 0;
    this.intelTotal = LEVELS.reduce((n, l) => n + l.intel.length, 0);
    this.timesSpotted = 0;
    this.totalTime = 0;
    this.score = 0;
    this.alertFlash = 0;
    this.caughtBy = null;
    this.lastAlertState = false;
    this.loadLevel(0);
    this.bindMenus();
  }

  loadLevel(i) {
    this.levelIndex = i;
    this.level = LEVELS[i];
    this.player.reset(this.level.spawn.x, this.level.spawn.y);
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.intel = this.level.intel.map((p) => ({ x: p.x, y: p.y, taken: false }));
    this.noiseRings = [];
    this.levelTime = 0;
    this.alertFlash = 0;
    this.caughtBy = null;
    this.lastAlertState = false;
    $('level-name').textContent = this.level.name;
    $('level-brief').textContent = this.level.brief;
    this.updateHud();
  }

  bindMenus() {
    $('btn-start').addEventListener('click', () => this.startGame());
    $('btn-retry').addEventListener('click', () => this.retryLevel());
    $('btn-next').addEventListener('click', () => this.nextLevel());
    $('btn-again').addEventListener('click', () => this.startGame());
    $('btn-resume').addEventListener('click', () => this.resume());
    $('btn-restart').addEventListener('click', () => this.startGame());
  }

  showOverlay(id) {
    for (const el of document.querySelectorAll('.overlay')) el.classList.add('hidden');
    if (id) $(id).classList.remove('hidden');
  }

  startGame() {
    this.audio.ensure();
    this.intelGot = 0;
    this.timesSpotted = 0;
    this.totalTime = 0;
    this.score = 0;
    this.loadLevel(0);
    this.state = 'playing';
    this.showOverlay(null);
  }

  retryLevel() {
    this.audio.ensure();
    this.loadLevel(this.levelIndex);
    this.state = 'playing';
    this.showOverlay(null);
  }

  nextLevel() {
    this.audio.ensure();
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.finishGame();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.state = 'playing';
    this.showOverlay(null);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.showOverlay('overlay-pause');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.showOverlay(null);
  }

  finishGame() {
    // Score: intel is worth 500 each, time bonus up to 1500, each time a
    // guard fully spotted you costs 300.
    const timeBonus = Math.max(0, 1500 - Math.floor(this.totalTime) * 5);
    this.score = this.intelGot * 500 + timeBonus - this.timesSpotted * 300;
    this.state = 'win';
    $('win-intel').textContent = `${this.intelGot} / ${this.intelTotal}`;
    $('win-time').textContent = `${Math.floor(this.totalTime / 60)}:${String(Math.floor(this.totalTime % 60)).padStart(2, '0')}`;
    $('win-spotted').textContent = String(this.timesSpotted);
    $('win-score').textContent = String(this.score);
    $('win-title').textContent = this.timesSpotted === 0 ? 'GHOST — NEVER SEEN' : 'MISSION COMPLETE';
    this.audio.win();
    this.showOverlay('overlay-win');
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'menu') {
      // Idle animation behind the start screen: guards patrol the level.
      for (const g of this.guards) g.patrol(dt, this.level);
      if (this.input.wasPressed('Enter')) this.startGame();
      return;
    }
    if (this.state !== 'playing') {
      if (this.state === 'caught' && this.input.wasPressed('KeyR')) this.retryLevel();
      if (this.state === 'levelclear' && this.input.wasPressed('Enter')) this.nextLevel();
      if (this.state === 'win' && this.input.wasPressed('Enter')) this.startGame();
      if (this.state === 'paused' && this.input.wasPressed('Escape')) this.resume();
      return;
    }
    if (this.input.wasPressed('Escape')) { this.pause(); return; }
    if (this.input.wasPressed('KeyR')) { this.retryLevel(); return; }
    if (this.input.wasPressed('KeyM')) this.audio.muted = !this.audio.muted;

    this.levelTime += dt;
    this.totalTime += dt;
    this.player.update(dt, this.input, this.level);

    // Footstep audio + noise pulses.
    if (this.player.stepSignal) {
      this.audio.footstep(this.player.stance === 'sprint');
    }
    const nr = this.player.noiseRadius();
    if (nr > 0) {
      this.noiseTimer -= dt;
      if (this.noiseTimer <= 0) {
        this.noiseTimer = this.player.stance === 'sprint' ? 0.35 : 0.6;
        this.noiseRings.push({ x: this.player.x, y: this.player.y, radius: nr, age: 0, life: 0.7 });
        for (const g of this.guards) g.hearNoise(this.player.x, this.player.y, nr);
      }
    }
    for (const ring of this.noiseRings) ring.age += dt;
    this.noiseRings = this.noiseRings.filter((r) => r.age < r.life);

    // Guards: update, count new alerts, play their footsteps.
    let anyAlert = false;
    for (const g of this.guards) {
      const wasAlert = g.state === 'alert';
      g.update(dt, this.player, this.level);
      if (g.state === 'alert') {
        anyAlert = true;
        if (!wasAlert) {
          this.timesSpotted += 1;
          this.alertFlash = 1;
          this.audio.alert();
        }
      } else if (g.state === 'suspicious' && !wasAlert && g.meter > 0.05 && g.meter < 0.12) {
        this.audio.suspicious();
      }
      if (g.stepSignal) this.audio.guardStep(Math.hypot(g.x - this.player.x, g.y - this.player.y));
      if (g.caught(this.player)) this.caughtBy = g;
    }
    this.lastAlertState = anyAlert;
    if (this.alertFlash > 0) this.alertFlash = Math.max(0, this.alertFlash - dt * 1.5);

    if (this.caughtBy) {
      this.state = 'caught';
      this.audio.caught();
      this.showOverlay('overlay-caught');
      return;
    }

    // Intel pickups.
    for (const it of this.intel) {
      if (!it.taken && Math.hypot(it.x - this.player.x, it.y - this.player.y) < 26) {
        it.taken = true;
        this.intelGot += 1;
        this.audio.pickup();
      }
    }

    // Exit reached?
    const e = this.level.exit;
    if (this.player.x > e.x && this.player.x < e.x + e.w &&
        this.player.y > e.y && this.player.y < e.y + e.h) {
      this.audio.levelClear();
      if (this.levelIndex + 1 >= LEVELS.length) {
        this.finishGame();
      } else {
        this.state = 'levelclear';
        $('clear-level').textContent = this.level.name;
        $('clear-time').textContent = `${this.levelTime.toFixed(1)}s`;
        $('clear-intel').textContent = `${this.intel.filter((i) => i.taken).length} / ${this.intel.length}`;
        this.showOverlay('overlay-clear');
      }
      return;
    }
    this.updateHud();
  }

  updateHud() {
    const maxMeter = this.guards.reduce((m, g) => Math.max(m, g.meter), 0);
    const anyAlert = this.guards.some((g) => g.state === 'alert');
    const alertEl = $('alert-meter');
    alertEl.style.width = `${Math.round(maxMeter * 100)}%`;
    alertEl.className = 'meter-fill' + (anyAlert ? ' alert' : maxMeter > 0.5 ? ' warn' : '');
    $('alert-label').textContent = anyAlert ? 'SPOTTED!' : maxMeter > 0.05 ? 'SUSPICIOUS…' : 'UNSEEN';
    $('alert-label').className = anyAlert ? 'alert-text' : '';
    const vis = this.player.visibility();
    $('vis-state').textContent =
      vis === 0 ? 'INVISIBLE' : vis < 0.4 ? 'HIDDEN' : this.player.lit ? 'IN LIGHT' : 'IN SHADOW';
    $('stance-state').textContent = this.player.stance.toUpperCase();
    $('noise-state').textContent =
      this.player.stance === 'sprint' ? 'LOUD' : this.player.stance === 'crouch' ? 'SILENT' : 'QUIET';
    $('intel-count').textContent = `${this.intelGot} / ${this.intelTotal}`;
    $('timer').textContent = `${Math.floor(this.levelTime / 60)}:${String(Math.floor(this.levelTime % 60)).padStart(2, '0')}`;
    document.body.classList.toggle('alert-mode', anyAlert);
  }

  draw() {
    this.render.draw(this);
    if (this.alertFlash > 0) {
      const ctx = this.render.ctx;
      ctx.fillStyle = `rgba(255, 40, 40, ${0.14 * this.alertFlash})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.lastT) / 1000 || 0.016);
    this.lastT = now;
    this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  run() {
    this.lastT = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__ghostshift = { game, version: 'v1', ready: true };
applyPose(game);
game.run();
