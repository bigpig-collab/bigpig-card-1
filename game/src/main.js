// BRASS BAZAAR — the main loop. One job: own the canvas, the clock, the screen
// state, and the hand-off between the player's turn and Zinnia's.
import { CANVAS_H, CANVAS_W } from './config.js';
import { createGame, endPlayerTurn, nextDuel, startPlayerTurn } from './rules.js';
import { chooseTelegraph, runRivalTurn } from './ai.js';
import { createInput } from './input.js';
import { hitTest, render } from './render.js';
import { sfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const shotKind = params.get('shot');
const seed = Number(params.get('seed') || '7');

let game;
let input;
let rivalTimer = null; // ms left before Zinnia's turn resolves (lets her "think")

function freshGame() {
  game = createGame(seed);
  chooseTelegraph(game);
  game.screen = 'title';
  window.__game = game;
  return game;
}

function startMatch() {
  game.screen = 'table';
  game.announcement = { text: 'DUEL 1 — out-haggle her!', big: true, t: 0 };
  sfx.turn();
}

function onButton(id) {
  if (id === 'play') {
    sfx.click();
    startMatch();
    return;
  }
  if (id === 'again') {
    sfx.click();
    freshGame();
    startMatch();
    return;
  }
  if (id === 'restart') {
    sfx.click();
    freshGame();
    startMatch();
    return;
  }
  if (id === 'next') {
    sfx.click();
    nextDuel(game);
    return;
  }
  if (id === 'end') {
    if (game.phase === 'player' && !game.duelOver && !game.matchOver) {
      endPlayerTurn(game);
      sfx.turn();
      rivalTimer = 900; // Zinnia takes a breath before she haggles.
    }
  }
}

function afterPlay() {
  // After any player action, a finished duel waits for the Next Duel button;
  // an ended turn waits out the rival timer in the loop below.
  if (game.matchOver) {
    if (game.matchWinner === 'player') sfx.win();
    else sfx.lose();
  }
}

if (shotKind) {
  game = stageShot(shotKind, seed);
  window.__game = game;
  window.__shotGame = game;
  window.__shotScreen = game.screen;
  input = { hover: null, mouse: { x: -1, y: -1 } };
  render(ctx, game, input, performance.now());
  window.__shotReady = true;
} else {
  freshGame();
  input = createInput(canvas, () => game, {
    hitTest,
    onButton,
    afterPlay,
  });
  window.__screen = () => game.screen;
  window.__game = game;

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!game.paused) {
      if (game.announcement) {
        game.announcement.t += dt;
        if (game.announcement.t > 2.4) game.announcement = null;
      }
      for (const f of game.floaters) f.t += dt;
      game.floaters = game.floaters.filter((f) => f.t < 1.2);
      if (rivalTimer !== null) {
        rivalTimer -= dt * 1000;
        if (rivalTimer <= 0) {
          rivalTimer = null;
          if (game.phase === 'rival' && !game.duelOver && !game.matchOver) {
            runRivalTurn(game);
            if (!game.duelOver && !game.matchOver) startPlayerTurn(game);
            if (game.matchOver) {
              if (game.matchWinner === 'player') sfx.win();
              else sfx.lose();
            }
          }
        }
      }
    }
    render(ctx, game, input, now);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
