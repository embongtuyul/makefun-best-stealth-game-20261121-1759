// input.js — keyboard state for movement, stance and menus.
// WASD or arrows move; Shift sprints; C or Ctrl crouches; Enter confirms;
// M mutes; R restarts the current level; Esc pauses.

export class Input {
  constructor() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.sprint = false;
    this.crouch = false;
    this.pressed = new Set(); // keys pressed this frame (edge-triggered)
    this.anyKey = false;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.pressed.add(e.code);
        this.anyKey = true;
      }
      this.apply(e.code, true);
    });
    window.addEventListener('keyup', (e) => this.apply(e.code, false));
    window.addEventListener('blur', () => {
      this.up = this.down = this.left = this.right = false;
      this.sprint = this.crouch = false;
    });
  }

  apply(code, down) {
    switch (code) {
      case 'KeyW': case 'ArrowUp': this.up = down; break;
      case 'KeyS': case 'ArrowDown': this.down = down; break;
      case 'KeyA': case 'ArrowLeft': this.left = down; break;
      case 'KeyD': case 'ArrowRight': this.right = down; break;
      case 'ShiftLeft': case 'ShiftRight': this.sprint = down; break;
      case 'KeyC': case 'ControlLeft': case 'ControlRight': this.crouch = down; break;
    }
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  endFrame() {
    this.pressed.clear();
    this.anyKey = false;
  }
}
