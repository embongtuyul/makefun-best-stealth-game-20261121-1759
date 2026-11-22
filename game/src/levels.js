// levels.js — level definitions for GHOSTSHIFT.
// Each level is data: walls (block sight + movement), crates (solid cover),
// bushes (hide zones, no collision), lamps (light pools), guards (patrol
// paths), intel pickups, spawn and exit. Coordinates are world pixels;
// the world is exactly the 1280x720 canvas.

export const WORLD_W = 1280;
export const WORLD_H = 720;

export const LEVELS = [
  {
    name: 'LEVEL 1 — WAREHOUSE',
    brief: 'Slip past the night watch and reach the loading dock.',
    spawn: { x: 70, y: 640 },
    exit: { x: 1160, y: 40, w: 80, h: 70 },
    walls: [
      { x: 0, y: 0, w: 1280, h: 18 },
      { x: 0, y: 702, w: 1280, h: 18 },
      { x: 0, y: 0, w: 18, h: 720 },
      { x: 1262, y: 0, w: 18, h: 720 },
      { x: 300, y: 120, w: 220, h: 26 },
      { x: 300, y: 120, w: 26, h: 180 },
      { x: 760, y: 420, w: 26, h: 180 },
      { x: 760, y: 420, w: 240, h: 26 },
      { x: 980, y: 120, w: 26, h: 150 },
    ],
    crates: [
      { x: 200, y: 480, w: 64, h: 64 },
      { x: 280, y: 480, w: 64, h: 64 },
      { x: 470, y: 300, w: 64, h: 64 },
      { x: 470, y: 380, w: 64, h: 64 },
      { x: 640, y: 540, w: 64, h: 64 },
      { x: 900, y: 220, w: 64, h: 64 },
      { x: 980, y: 220, w: 64, h: 64 },
      { x: 1080, y: 480, w: 64, h: 64 },
    ],
    bushes: [
      { x: 180, y: 300, r: 58 },
      { x: 620, y: 180, r: 62 },
      { x: 850, y: 600, r: 58 },
    ],
    lamps: [
      { x: 400, y: 120, r: 130 },
      { x: 900, y: 130, r: 130 },
      { x: 640, y: 420, r: 140 },
      { x: 180, y: 600, r: 120 },
    ],
    guards: [
      { path: [[430, 210], [430, 520], [700, 520], [700, 210]], speed: 62, pause: 1.2 },
      { path: [[980, 420], [1150, 420], [1150, 620], [980, 620]], speed: 70, pause: 0.9 },
    ],
    intel: [
      { x: 240, y: 90 },
      { x: 880, y: 330 },
      { x: 1130, y: 640 },
    ],
  },
  {
    name: 'LEVEL 2 — OFFICE',
    brief: 'The office never sleeps. Three guards, one lit corridor.',
    spawn: { x: 70, y: 70 },
    exit: { x: 1150, y: 620, w: 80, h: 70 },
    walls: [
      { x: 0, y: 0, w: 1280, h: 18 },
      { x: 0, y: 702, w: 1280, h: 18 },
      { x: 0, y: 0, w: 18, h: 720 },
      { x: 1262, y: 0, w: 18, h: 720 },
      { x: 240, y: 200, w: 26, h: 320 },
      { x: 240, y: 200, w: 200, h: 26 },
      { x: 600, y: 100, w: 26, h: 220 },
      { x: 600, y: 470, w: 26, h: 150 },
      { x: 880, y: 300, w: 260, h: 26 },
      { x: 880, y: 300, w: 26, h: 200 },
    ],
    crates: [
      { x: 330, y: 330, w: 64, h: 64 },
      { x: 330, y: 410, w: 64, h: 64 },
      { x: 500, y: 560, w: 64, h: 64 },
      { x: 580, y: 560, w: 64, h: 64 },
      { x: 700, y: 240, w: 64, h: 64 },
      { x: 1020, y: 120, w: 64, h: 64 },
      { x: 1100, y: 120, w: 64, h: 64 },
      { x: 1020, y: 560, w: 64, h: 64 },
    ],
    bushes: [
      { x: 150, y: 380, r: 60 },
      { x: 470, y: 160, r: 58 },
      { x: 760, y: 430, r: 62 },
      { x: 1150, y: 380, r: 56 },
    ],
    lamps: [
      { x: 160, y: 140, r: 125 },
      { x: 500, y: 360, r: 135 },
      { x: 900, y: 140, r: 130 },
      { x: 700, y: 620, r: 130 },
      { x: 1150, y: 500, r: 120 },
    ],
    guards: [
      { path: [[350, 120], [350, 470], [540, 470], [540, 120]], speed: 70, pause: 1.0 },
      { path: [[760, 180], [760, 560], [980, 560], [980, 180]], speed: 78, pause: 0.8 },
      { path: [[180, 600], [480, 600], [480, 660], [180, 660]], speed: 66, pause: 1.4 },
    ],
    intel: [
      { x: 120, y: 620 },
      { x: 660, y: 80 },
      { x: 1180, y: 250 },
    ],
  },
  {
    name: 'LEVEL 3 — VAULT',
    brief: 'Four guards, bright floors, nowhere to run. Be a ghost.',
    spawn: { x: 640, y: 650 },
    exit: { x: 600, y: 30, w: 80, h: 60 },
    walls: [
      { x: 0, y: 0, w: 1280, h: 18 },
      { x: 0, y: 702, w: 1280, h: 18 },
      { x: 0, y: 0, w: 18, h: 720 },
      { x: 1262, y: 0, w: 18, h: 720 },
      { x: 220, y: 140, w: 26, h: 440 },
      { x: 1034, y: 140, w: 26, h: 440 },
      { x: 460, y: 300, w: 360, h: 26 },
      { x: 460, y: 300, w: 26, h: 120 },
      { x: 794, y: 300, w: 26, h: 120 },
    ],
    crates: [
      { x: 330, y: 200, w: 64, h: 64 },
      { x: 330, y: 480, w: 64, h: 64 },
      { x: 890, y: 200, w: 64, h: 64 },
      { x: 890, y: 480, w: 64, h: 64 },
      { x: 560, y: 180, w: 64, h: 64 },
      { x: 660, y: 180, w: 64, h: 64 },
      { x: 560, y: 500, w: 64, h: 64 },
      { x: 660, y: 500, w: 64, h: 64 },
    ],
    bushes: [
      { x: 120, y: 360, r: 56 },
      { x: 1160, y: 360, r: 56 },
      { x: 640, y: 90, r: 52 },
    ],
    lamps: [
      { x: 330, y: 120, r: 135 },
      { x: 950, y: 120, r: 135 },
      { x: 330, y: 600, r: 135 },
      { x: 950, y: 600, r: 135 },
      { x: 640, y: 360, r: 150 },
    ],
    guards: [
      { path: [[120, 120], [120, 600], [220, 600], [220, 120]], speed: 82, pause: 0.7 },
      { path: [[1160, 120], [1160, 600], [1060, 600], [1060, 120]], speed: 82, pause: 0.7 },
      { path: [[380, 240], [900, 240], [900, 480], [380, 480]], speed: 76, pause: 0.8 },
      { path: [[560, 90], [720, 90], [720, 620], [560, 620]], speed: 70, pause: 1.1 },
    ],
    intel: [
      { x: 70, y: 90 },
      { x: 1210, y: 630 },
      { x: 640, y: 250 },
    ],
  },
];
