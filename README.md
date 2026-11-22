# GHOSTSHIFT — Night Infiltration

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/embongtuyul/makefun-best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/embongtuyul/makefun-best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down 2D stealth game for the [best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).
Sneak through three night-shift floors, slip past patrolling guards and their
vision cones, hide behind crates and in bushes, stay out of the lamplight —
and reach the exit unseen.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` from any static
server). No network, no build step.

- **WASD / Arrows** — move
- **Shift** — sprint (fast, loud)
- **C** — crouch (slow, silent, harder to spot)
- **Esc** — pause · **R** — retry level · **M** — mute

## What's in the game

- 3 levels of rising difficulty (Warehouse, Office, Vault)
- Guards with drawn vision cones, patrol paths, pauses and scanning
- A detection meter: glimpses raise suspicion, full meter means a chase —
  break line of sight and the guard investigates your last-seen spot
- Cover that breaks line of sight (crates, walls) and bushes to hide in
- Light and shadow: lamplight makes you easier to spot, darkness hides you
- Noise: sprinting rings guards can hear; crouching is silent
- Footstep audio (WebAudio synth — no audio files)
- Collectible intel (optional), score, timer, start / pause / caught /
  level-clear / win screens

## Layout

- `game/index.html` — page shell, HUD, overlays
- `game/css/style.css` — presentation
- `game/src/main.js` — boot, game loop, state machine, scoring
- `game/src/levels.js` — the three level definitions
- `game/src/player.js` — movement, stance, noise, visibility
- `game/src/guard.js` — patrol, detection, investigate, chase
- `game/src/vision.js` — line-of-sight and cone math
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — WebAudio synth
- `game/src/input.js` — keyboard state
- `game/src/shots.js` — deterministic poses for screenshots
- `main.ts` — the hand-in program (copies `game/` + `screenshots/`, writes
  `dossier.json` with the kit's `buildDossier`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
