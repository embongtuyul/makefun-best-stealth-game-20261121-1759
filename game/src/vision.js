// vision.js — line-of-sight and vision-cone math.
// Walls and crates are axis-aligned rectangles; a ray from a guard to the
// player is blocked if it crosses any of them. Pure functions, no state.

export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Do segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) intersect?
export function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d2 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  const d3 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d4 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Does the segment from (x1,y1) to (x2,y2) cross rectangle r?
export function segmentHitsRect(x1, y1, x2, y2, r) {
  // Endpoint inside the rect counts as a hit (target behind cover).
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const x3 = r.x, y3 = r.y, x4 = r.x + r.w, y4 = r.y + r.h;
  return segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y3) ||
         segmentsIntersect(x1, y1, x2, y2, x4, y3, x4, y4) ||
         segmentsIntersect(x1, y1, x2, y2, x4, y4, x3, y4) ||
         segmentsIntersect(x1, y1, x2, y2, x3, y4, x3, y3);
}

// True when nothing solid stands between (ax,ay) and (bx,by).
export function hasLineOfSight(ax, ay, bx, by, blockers) {
  for (const r of blockers) {
    if (segmentHitsRect(ax, ay, bx, by, r)) return false;
  }
  return true;
}

// Is point (px,py) inside the cone from (gx,gy) facing `facing` radians,
// with half-angle `halfAngle` and range `range`? Returns the distance when
// inside (for detection falloff), or -1 when outside.
export function inCone(gx, gy, facing, halfAngle, range, px, py) {
  const dx = px - gx;
  const dy = py - gy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return -1;
  if (dist < 4) return dist;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, facing)) > halfAngle) return -1;
  return dist;
}

// Is point (px,py) inside any bush circle?
export function inBush(px, py, bushes) {
  for (const b of bushes) {
    if (Math.hypot(px - b.x, py - b.y) < b.r) return true;
  }
  return false;
}

// Is point (px,py) inside any lamp pool?
export function inLight(px, py, lamps) {
  for (const l of lamps) {
    if (Math.hypot(px - l.x, py - l.y) < l.r) return true;
  }
  return false;
}

// Push a circle (px,py,r) out of rectangle r; returns corrected [x, y].
export function collideCircleRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [px, py];
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    return [cx + (dx / d) * r, cy + (dy / d) * r];
  }
  // Center inside the rect: push out along the smallest penetration.
  const left = px - rect.x, right = rect.x + rect.w - px;
  const top = py - rect.y, bottom = rect.y + rect.h - py;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return [rect.x - r, py];
  if (m === right) return [rect.x + rect.w + r, py];
  if (m === top) return [px, rect.y - r];
  return [px, rect.y + rect.h + r];
}
