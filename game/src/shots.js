// shots.js — deterministic poses for screenshots and playtests.
// ?pose=cover  — level 1, player crouched behind the crates while a guard's
//                cone sweeps past (the cover shot).
// ?pose=alert  — level 1, a guard fully alerted and chasing (red cone).
// ?pose=level2 — level 2 mid-play, player crossing the office floor.
// ?pose=start  — the start screen (default when no pose is given).
// ?autostart=1 — skip the menu and start playing immediately.
// Poses only set up state; the game then runs its real code from there.

export function applyPose(game) {
  const params = new URLSearchParams(window.location.search);
  const pose = params.get('pose') || '';
  const autostart = params.get('autostart') === '1';

  if (pose === 'cover') {
    game.state = 'playing';
    game.showOverlay(null);
    // Player crouched behind the crate pair at (470, 300); the first guard
    // walks its patrol so its cone sweeps the crates.
    game.player.x = 440;
    game.player.y = 355;
    game.player.dirX = 1;
    game.player.dirY = 0;
    game.player.stance = 'crouch';
    const g = game.guards[0];
    g.x = 470;
    g.y = 230;
    g.facing = Math.PI / 2; // looking down toward the crates
    g.wp = 0;
    g.pauseLeft = 3;
    const g2 = game.guards[1];
    g2.x = 1060;
    g2.y = 480;
    g2.facing = Math.PI;
    g2.wp = 0;
    g2.pauseLeft = 3;
  } else if (pose === 'alert') {
    game.state = 'playing';
    game.showOverlay(null);
    // Player caught in the open under a lamp; the guard is mid-chase.
    game.player.x = 640;
    game.player.y = 420;
    game.player.dirX = -1;
    game.player.dirY = 0;
    game.player.stance = 'walk';
    const g = game.guards[0];
    g.x = 640;
    g.y = 300;
    g.facing = Math.PI / 2;
    g.state = 'alert';
    g.meter = 1;
    g.lastSeen = { x: 640, y: 420 };
    g.alertedOnce = true;
    game.timesSpotted = 1;
  } else if (pose === 'level2') {
    game.loadLevel(1);
    game.state = 'playing';
    game.showOverlay(null);
    game.player.x = 420;
    game.player.y = 380;
    game.player.dirX = 1;
    game.player.dirY = 0;
    game.player.stance = 'crouch';
    const g = game.guards[0];
    g.x = 540;
    g.y = 300;
    g.facing = Math.PI;
    g.pauseLeft = 3;
    const g2 = game.guards[1];
    g2.x = 820;
    g2.y = 500;
    g2.facing = -Math.PI / 2;
    g2.pauseLeft = 3;
  } else if (autostart) {
    game.startGame();
  }
  game.updateHud();
}
