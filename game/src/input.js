// TIDEBOUND — mouse and keyboard. One job: turn presses into actions.
// The renderer owns the hitboxes; input only reports what was clicked or
// pressed, and main.js decides what it means.
export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;

export function createInput(canvas) {
  const state = {
    mouse: { x: -1, y: -1, clicked: false, down: false },
    keys: new Set(),
    actions: 0,
    cardKey: -1,
  };

  function toLocal(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toLocal(event);
    state.mouse.x = point.x;
    state.mouse.y = point.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toLocal(event);
    state.mouse.x = point.x;
    state.mouse.y = point.y;
    state.mouse.down = true;
    state.mouse.clicked = true;
  });
  canvas.addEventListener('pointerup', () => {
    state.mouse.down = false;
  });
  canvas.addEventListener('pointerleave', () => {
    state.mouse.x = -1;
    state.mouse.y = -1;
    state.mouse.down = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '7') state.cardKey = Number(key) - 1;
    else if (key === ' ') state.actions |= ACTION_END_TURN;
    else if (key === 'enter') state.actions |= ACTION_CONFIRM;
    else if (key === 'p') state.actions |= ACTION_PAUSE;
    else if (key === 'r') state.actions |= ACTION_RESTART;
    else if (key === 'm') state.actions |= ACTION_MUTE;
    state.keys.add(key);
    if (key === ' ' || key.startsWith('arrow')) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    state.keys.delete(event.key.toLowerCase());
  });

  return {
    mouse: state.mouse,
    takeActions() {
      const actions = state.actions;
      state.actions = 0;
      return actions;
    },
    takeCardKey() {
      const key = state.cardKey;
      state.cardKey = -1;
      return key;
    },
    takeClick() {
      const clicked = state.mouse.clicked;
      state.mouse.clicked = false;
      return clicked;
    },
  };
}
