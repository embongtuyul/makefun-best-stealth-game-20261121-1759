// player.js — the infiltrator: movement, stance, noise and visibility.
// Stance changes speed, noise radius and how fast guards spot you:
// crouch is slow and quiet, sprint is fast and loud.

import { collideCircleRect, inBush, inLight } from './vision.js';

export const SPEEDS = { crouch: 75, walk: 145, sprint: 235 };
export const NOISE_RADIUS = { crouch: 0, walk: 45, sprint: 150 };
export const PLAYER_R = 13;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dirX = 0;
    this.dirY = 1;
    this.moving = false;
    this.stance = 'walk'; // 'crouch' | 'walk' | 'sprint'
    this.hidden = false; // inside a bush
    this.lit = false; // inside a lamp pool
    this.stepPhase = 0;
    this.stepSignal = 0; // 1 on the frame a footstep lands (for audio)
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.dirX = 0;
    this.dirY = 1;
    this.moving = false;
    this.stance = 'walk';
    this.hidden = false;
    this.lit = false;
    this.stepPhase = 0;
    this.stepSignal = 0;
  }

  // How visible the player is to a guard, 0 (invisible) to 1 (fully lit).
  // Guards multiply their detection rate by this.
  visibility() {
    if (this.hidden && this.stance === 'crouch') return 0;
    let v = this.lit ? 1 : 0.55;
    if (this.hidden) v *= 0.35;
    if (this.stance === 'crouch') v *= 0.5;
    if (this.stance === 'sprint') v *= 1.3;
    return Math.min(1, v);
  }

  noiseRadius() {
    if (!this.moving) return 0;
    return NOISE_RADIUS[this.stance];
  }

  update(dt, input, level) {
    // Stance: hold C or Ctrl to crouch, Shift to sprint (sprint wins ties).
    if (input.crouch) this.stance = 'crouch';
    else if (input.sprint) this.stance = 'sprint';
    else this.stance = 'walk';

    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    this.moving = mx !== 0 || my !== 0;
    this.stepSignal = 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      this.dirX = mx;
      this.dirY = my;
      const speed = SPEEDS[this.stance];
      this.x += mx * speed * dt;
      this.y += my * speed * dt;
      // Footstep timing scales with speed; sprint steps land twice as often.
      this.stepPhase += dt * (this.stance === 'sprint' ? 5.2 : this.stance === 'crouch' ? 1.6 : 3.1);
      if (this.stepPhase >= 1) {
        this.stepPhase -= 1;
        this.stepSignal = 1;
      }
    }
    // Keep inside the world, then push out of every solid rect.
    this.x = Math.max(PLAYER_R + 18, Math.min(this.x, 1280 - 18 - PLAYER_R));
    this.y = Math.max(PLAYER_R + 18, Math.min(this.y, 720 - 18 - PLAYER_R));
    const solids = level.walls.concat(level.crates);
    for (const r of solids) {
      const [nx, ny] = collideCircleRect(this.x, this.y, PLAYER_R, r);
      this.x = nx;
      this.y = ny;
    }
    this.hidden = inBush(this.x, this.y, level.bushes);
    this.lit = inLight(this.x, this.y, level.lamps);
  }
}
