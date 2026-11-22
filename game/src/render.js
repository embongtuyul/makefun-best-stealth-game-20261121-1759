// render.js — all canvas drawing: the floor, walls, crates, bushes, lamp
// pools, guard vision cones (yellow sweeping, red when alerted), the
// player, intel, the exit, noise rings and the darkness overlay that
// shows which ground is safe.

import { CONE_RANGE, CONE_HALF_ANGLE } from './guard.js';

const FLOOR_A = '#20242c';
const FLOOR_B = '#1b1f26';

export class Render {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    // Offscreen layer for the night overlay: holes are punched here so the
    // scene underneath is never erased.
    this.dark = document.createElement('canvas');
    this.dark.width = canvas.width;
    this.dark.height = canvas.height;
  }

  draw(game) {
    const ctx = this.ctx;
    const level = game.level;
    ctx.clearRect(0, 0, this.w, this.h);
    this.drawFloor();
    this.drawExit(level.exit, game.time);
    for (const b of level.bushes) this.drawBush(b, game.time);
    for (const c of level.crates) this.drawCrate(c);
    for (const w of level.walls) this.drawWall(w);
    for (const it of game.intel) if (!it.taken) this.drawIntel(it, game.time);
    for (const g of game.guards) this.drawCone(g);
    for (const g of game.guards) this.drawGuard(g, game.time);
    this.drawPlayer(game.player, game.time);
    for (const ring of game.noiseRings) this.drawNoiseRing(ring);
    this.drawLights(level.lamps, game.time);
    this.drawDarkness(level.lamps);
  }

  drawFloor() {
    const ctx = this.ctx;
    ctx.fillStyle = FLOOR_A;
    ctx.fillRect(0, 0, this.w, this.h);
    // Checkerboard tiles + faint grid lines read as a building floor.
    const T = 80;
    ctx.fillStyle = FLOOR_B;
    for (let y = 0; y < this.h / T; y++) {
      for (let x = 0; x < this.w / T; x++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * T, y * T, T, T);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.w; x += T) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.h); ctx.stroke();
    }
    for (let y = 0; y <= this.h; y += T) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.w, y); ctx.stroke();
    }
  }

  drawWall(w) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3a4150';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4a5265';
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = '#14171d';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }

  drawCrate(c) {
    const ctx = this.ctx;
    ctx.fillStyle = '#6b5432';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#3d2f1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4);
    ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4);
    ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
  }

  drawBush(b, t) {
    const ctx = this.ctx;
    // A dark leafy patch: hiding ground, readable at a glance.
    ctx.fillStyle = 'rgba(24, 64, 32, 0.92)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(38, 96, 48, 0.9)';
    const sway = Math.sin(t * 1.4) * 3;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const rr = b.r * 0.55;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * rr + sway, b.y + Math.sin(a) * rr, b.r * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(180, 255, 190, 0.25)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE', b.x, b.y + 4);
  }

  drawExit(e, t) {
    const ctx = this.ctx;
    const pulse = 0.55 + 0.25 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(30, 220, 120, ${pulse})`;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = '#7dffb0';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#eafff2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 6);
  }

  drawIntel(it, t) {
    const ctx = this.ctx;
    const bob = Math.sin(t * 2.5 + it.x) * 3;
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(it.x, it.y + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5b00';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('i', it.x, it.y + bob + 4);
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(it.x, it.y + bob, 14 + Math.sin(t * 2.5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawCone(g) {
    const ctx = this.ctx;
    const alert = g.state === 'alert';
    const suspicious = g.state === 'suspicious' || g.state === 'investigate';
    const color = alert ? '255, 60, 60' : suspicious ? '255, 170, 40' : '255, 225, 90';
    const alpha = alert ? 0.34 : suspicious ? 0.26 : 0.20;
    ctx.fillStyle = `rgba(${color}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, CONE_RANGE, g.facing - CONE_HALF_ANGLE, g.facing + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${color}, 0.55)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y, CONE_RANGE, g.facing - CONE_HALF_ANGLE, g.facing + CONE_HALF_ANGLE);
    ctx.stroke();
  }

  drawGuard(g, t) {
    const ctx = this.ctx;
    const alert = g.state === 'alert';
    // Body: dark uniform with a red cap when alerted.
    ctx.fillStyle = alert ? '#7a1f1f' : '#2e3a55';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alert ? '#ff5555' : '#8fa3cc';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#e8ecf5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 15, g.y + Math.sin(g.facing) * 15);
    ctx.stroke();
    // State marker: ? while suspicious, ! while alerted.
    if (g.state === 'suspicious' || g.state === 'investigate') {
      ctx.fillStyle = '#ffb02e';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 20);
    } else if (alert) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 20);
    }
    // Detection meter arc above the guard.
    if (g.meter > 0.02 && g.meter < 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = g.meter > 0.6 ? '#ff5533' : '#ffcc33';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.meter);
      ctx.stroke();
    }
  }

  drawPlayer(p, t) {
    const ctx = this.ctx;
    const crouch = p.stance === 'crouch';
    // Shadow ring under the player: white when lit, dim when in shadow.
    ctx.fillStyle = p.lit ? 'rgba(255,255,255,0.10)' : 'rgba(120,200,255,0.10)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.fill();
    // Body: teal agent, smaller when crouched.
    const r = crouch ? 10 : 13;
    ctx.fillStyle = '#19c2a6';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9fff8';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#d9fff8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.dirX * (r + 5), p.y + p.dirY * (r + 5));
    ctx.stroke();
    // Hidden marker: a small leaf when crouched inside a bush.
    if (p.hidden && crouch) {
      ctx.fillStyle = '#8dff9e';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN', p.x, p.y - 22);
    }
  }

  drawNoiseRing(ring) {
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(255, 200, 80, ${0.5 * (1 - ring.age / ring.life)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (ring.age / ring.life), 0, Math.PI * 2);
    ctx.stroke();
  }

  drawLights(lamps, t) {
    const ctx = this.ctx;
    for (const l of lamps) {
      const flicker = 0.9 + 0.1 * Math.sin(t * 7 + l.x);
      const grad = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r);
      grad.addColorStop(0, `rgba(255, 230, 150, ${0.30 * flicker})`);
      grad.addColorStop(1, 'rgba(255, 230, 150, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe996';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDarkness(lamps) {
    // Night overlay on the offscreen layer: dark everywhere except inside
    // lamp pools, then composited over the scene.
    const dctx = this.dark.getContext('2d');
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, this.w, this.h);
    dctx.fillStyle = 'rgba(6, 8, 16, 0.42)';
    dctx.fillRect(0, 0, this.w, this.h);
    dctx.globalCompositeOperation = 'destination-out';
    for (const l of lamps) {
      const grad = dctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = grad;
      dctx.beginPath();
      dctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      dctx.fill();
    }
    this.ctx.drawImage(this.dark, 0, 0);
  }
}
