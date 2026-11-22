// guard.js — patrol guards with vision cones and a detection meter.
// States: patrol (walk waypoints, pause + scan at each) -> suspicious
// (meter rising, turns toward the glimpse) -> investigate (walks to the
// last-seen point, looks around) -> alert (runs at the player; touch the
// player and the run ends). Losing the player cools the guard back down.

import { angleDiff, collideCircleRect, hasLineOfSight, inCone } from './vision.js';

export const CONE_RANGE = 230;
export const CONE_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_R = 13;
export const CATCH_DIST = 20;

const DETECT_BASE = 1.15; // meter per second at point blank, fully visible
const CHASE_SPEED = 185;

export class Guard {
  constructor(def) {
    this.path = def.path;
    this.patrolSpeed = def.speed;
    this.pauseTime = def.pause;
    this.wp = 0;
    this.x = def.path[0][0];
    this.y = def.path[0][1];
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | investigate | alert
    this.meter = 0; // 0..1 detection; 1 = spotted
    this.pauseLeft = 0;
    this.scanDir = 1;
    this.lastSeen = null; // {x, y} of the last glimpse / noise
    this.lookLeft = 0; // investigate look-around timer
    this.calmLeft = 0; // time since the player was last seen
    this.stepPhase = 0;
    this.stepSignal = 0; // 1 on the frame a footstep lands (for audio)
    this.alertedOnce = false;
    this.faceTarget();
  }

  faceTarget() {
    const t = this.path[(this.wp + 1) % this.path.length];
    this.facing = Math.atan2(t[1] - this.y, t[0] - this.x);
  }

  // Can this guard see the player right now? Needs cone + line of sight.
  // Returns the range-adjusted detection strength (0 when unseen).
  seesPlayer(player, blockers) {
    const dist = inCone(this.x, this.y, this.facing, CONE_HALF_ANGLE, CONE_RANGE, player.x, player.y);
    if (dist < 0) return 0;
    if (!hasLineOfSight(this.x, this.y, player.x, player.y, blockers)) return 0;
    const vis = player.visibility();
    if (vis <= 0) return 0;
    // Closer = faster detection; beyond half range it fades out.
    const falloff = 1 - Math.max(0, (dist - CONE_RANGE * 0.5) / CONE_RANGE);
    return vis * (0.55 + 0.45 * falloff);
  }

  hearNoise(nx, ny, radius) {
    if (this.state === 'alert') return;
    if (Math.hypot(nx - this.x, ny - this.y) > radius) return;
    // A heard noise sends the guard to investigate the spot.
    if (!this.lastSeen || this.state === 'patrol') {
      this.lastSeen = { x: nx, y: ny };
      this.state = 'investigate';
      this.lookLeft = 0;
    }
  }

  update(dt, player, level) {
    const blockers = level.walls.concat(level.crates);
    this.stepSignal = 0;
    const seen = this.seesPlayer(player, blockers);

    if (seen > 0) {
      this.lastSeen = { x: player.x, y: player.y };
      this.calmLeft = 0;
      // Turn toward the player while the meter climbs.
      const want = Math.atan2(player.y - this.y, player.x - this.x);
      this.facing += angleDiff(want, this.facing) * Math.min(1, 6 * dt);
      if (this.state !== 'alert') {
        this.meter += DETECT_BASE * seen * dt;
        if (this.meter >= 1) {
          this.meter = 1;
          this.state = 'alert';
          this.alertedOnce = true;
        } else if (this.meter > 0.05 && this.state === 'patrol') {
          this.state = 'suspicious';
        }
      }
    } else {
      this.calmLeft += dt;
      if (this.state === 'alert') {
        // Keep chasing the last-seen point; give up after 4 s of nothing.
        if (this.calmLeft > 4) {
          this.state = 'investigate';
          this.lookLeft = 0;
        }
      } else {
        // The meter must decay in EVERY non-alert state when the player is
        // unseen — including patrol. (It used to decay only in suspicious /
        // investigate, so a guard returning to patrol from investigate kept
        // a frozen 0.23 meter forever and stayed permanently "warm".)
        this.meter = Math.max(0, this.meter - 0.35 * dt);
        if (this.meter <= 0 && this.state === 'suspicious') this.state = 'patrol';
      }
    }

    if (this.state === 'alert') {
      this.chase(dt, player, level);
    } else if (this.state === 'investigate' && this.lastSeen) {
      this.investigate(dt, level);
    } else if (this.state !== 'suspicious') {
      this.patrol(dt, level);
    }
    // Suspicious guards stand still and stare; their meter decays in update.
  }

  // Move toward (tx, ty), sliding along obstacles instead of wedging on
  // corners: if the diagonal step is mostly cancelled by collision, retry
  // along one axis and take whichever actually moves us. Without this a
  // chasing guard cuts a corner into the 16px gap between the L1 crates
  // (26px wide) and gets stuck there for ~30 s.
  moveToward(dt, tx, ty, speed, level) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const step = Math.min(dist, speed * dt);
    const ux = dx / dist, uy = dy / dist;
    const blockers = level.walls.concat(level.crates);
    const collide = (x, y) => {
      for (const r of blockers) {
        [x, y] = collideCircleRect(x, y, GUARD_R, r);
      }
      return [x, y];
    };
    let [nx, ny] = collide(this.x + ux * step, this.y + uy * step);
    let moved = Math.hypot(nx - this.x, ny - this.y);
    if (moved < step * 0.5 && Math.abs(ux) > 0.01 && Math.abs(uy) > 0.01) {
      const [ax, ay] = collide(this.x + ux * step, this.y);
      const [bx, by] = collide(this.x, this.y + uy * step);
      const da = Math.hypot(ax - this.x, ay - this.y);
      const db = Math.hypot(bx - this.x, by - this.y);
      if (da >= db && da > moved) { nx = ax; ny = ay; moved = da; }
      else if (db > moved) { nx = bx; ny = by; moved = db; }
    }
    this.x = nx;
    this.y = ny;
    this.facing = Math.atan2(dy, dx);
    this.stepPhase += dt * (speed > 120 ? 5.0 : 2.6);
    if (this.stepPhase >= 1) {
      this.stepPhase -= 1;
      this.stepSignal = 1;
    }
    return dist - step < 1;
  }

  patrol(dt, level) {
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      // Scan: sweep the cone back and forth while paused at a waypoint.
      this.facing += this.scanDir * 1.1 * dt;
      if (this.pauseLeft <= 0) this.faceTarget();
      return;
    }
    const t = this.path[(this.wp + 1) % this.path.length];
    if (this.moveToward(dt, t[0], t[1], this.patrolSpeed, level)) {
      this.wp = (this.wp + 1) % this.path.length;
      this.pauseLeft = this.pauseTime;
      this.scanDir = -this.scanDir;
    }
  }

  investigate(dt, level) {
    const arrived = this.moveToward(dt, this.lastSeen.x, this.lastSeen.y, this.patrolSpeed * 1.25, level);
    if (arrived) {
      this.lookLeft += dt;
      this.facing += 1.4 * dt; // look around the spot
      if (this.lookLeft > 2.2) {
        this.state = 'patrol';
        this.lastSeen = null;
        this.faceTarget();
      }
    }
  }

  chase(dt, player, level) {
    // Run at the player's live position while seen, else the last-seen spot.
    const tx = this.calmLeft < 0.5 ? player.x : this.lastSeen.x;
    const ty = this.calmLeft < 0.5 ? player.y : this.lastSeen.y;
    this.moveToward(dt, tx, ty, CHASE_SPEED, level);
  }

  // True when this guard has caught the player.
  caught(player) {
    return this.state === 'alert' && Math.hypot(player.x - this.x, player.y - this.y) < CATCH_DIST;
  }
}
