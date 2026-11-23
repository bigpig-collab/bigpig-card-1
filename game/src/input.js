// BRASS BAZAAR — mouse and keyboard. One job: turn clicks and keys into
// game actions, and report what the pointer is hovering for the renderer.
import { canPlay, playCard } from './rules.js';
import { sfx, setMuted, isMuted } from './audio.js';

export function createInput(canvas, getGame, hooks) {
  const input = { hover: null, mouse: { x: -1, y: -1 } };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    input.mouse = canvasPos(event);
    input.hover = hooks.hitTest(input.mouse.x, input.mouse.y);
  });

  canvas.addEventListener('click', (event) => {
    const pos = canvasPos(event);
    const hit = hooks.hitTest(pos.x, pos.y);
    if (!hit) return;
    if (hit.type === 'card') {
      const game = getGame();
      const card = hit.card;
      if (canPlay(game, card)) {
        playCard(game, 'player', card);
        sfx.play();
        hooks.afterPlay();
      }
    } else if (hit.type === 'button') {
      hooks.onButton(hit.id);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const game = getGame();
    const key = event.key;
    if (key === 'm' || key === 'M') {
      setMuted(!isMuted());
      return;
    }
    if (key === 'p' || key === 'P') {
      game.paused = !game.paused;
      return;
    }
    if (game.screen === 'title' && (key === 'Enter' || key === ' ')) {
      hooks.onButton('play');
      return;
    }
    if ((game.screen === 'win' || game.screen === 'loss') && key === 'Enter') {
      hooks.onButton('again');
      return;
    }
    if (game.screen !== 'table' || game.paused) return;
    if (key === 'Enter' && game.duelOver && !game.matchOver) {
      hooks.onButton('next');
      return;
    }
    if (key >= '1' && key <= '7') {
      const idx = Number(key) - 1;
      const card = game.player.hand[idx];
      if (card && canPlay(game, card)) {
        playCard(game, 'player', card);
        sfx.play();
        hooks.afterPlay();
      }
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      // Route through the End Turn button path so Zinnia's timer starts.
      hooks.onButton('end');
      return;
    }
    if (key === 'r' || key === 'R') {
      hooks.onButton('restart');
    }
  });

  return input;
}
