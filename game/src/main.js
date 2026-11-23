// TIDEBOUND — boot and the one loop. One job: screens, timing and wiring.
// ?seed=N fixes the shuffle. ?shot=title|table|win|loss stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady.
import { BARON_PLAY_DELAY_MS } from './config.js';
import { createRandom } from './deck.js';
import {
  PHASE_BARON, PHASE_PLAYER, canPlay, checkDuelEnd, createGame, endPlayerTurn,
  nextDuel, playCard, restartMatch, startPlayerTurn,
} from './rules.js';
import { buildPlan, chooseTelegraph, playPlannedCard } from './ai.js';
import {
  ACTION_CONFIRM, ACTION_END_TURN, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART,
  createInput,
} from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_LOSS, SCREEN_PAUSED, SCREEN_TABLE, SCREEN_TITLE, SCREEN_WIN,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);

function announce(message) {
  status.textContent = message;
}

function inBox(mouse, box) {
  return !!box && mouse.x >= box.x && mouse.x <= box.x + box.w && mouse.y >= box.y && mouse.y <= box.y + box.h;
}

function runShot(name) {
  const staged = stageShot(name, seed);
  const game = staged.game;
  window.__shotGame = game;
  window.__shotScreen = staged.screen;
  let painted = 0;
  function paint() {
    renderer.draw(game, staged.screen, { mouse: { x: -1, y: -1 }, timeMs: 1200 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const game = createGame(random);
  window.__game = game;
  window.__screen = () => screen;
  chooseTelegraph(game);
  let screen = SCREEN_TITLE;
  let pausedFrom = SCREEN_TABLE;
  let baronPlan = null;
  let baronTimerMs = 0;
  let duelPauseMs = 0;
  let last = performance.now();

  function startMatch() {
    restartMatch(game);
    chooseTelegraph(game);
    screen = SCREEN_TABLE;
    announce('Playing. Win 2 duels to take the match.');
  }

  function beginBaronTurn() {
    baronPlan = buildPlan(game);
    baronTimerMs = BARON_PLAY_DELAY_MS;
  }

  function finishBaronTurn() {
    baronPlan = null;
    if (game.duelOver) return;
    chooseTelegraph(game);
    startPlayerTurn(game);
    audio.turn();
  }

  function handleDuelEnd(dtMs) {
    if (!game.duelOver) return;
    duelPauseMs += dtMs;
    if (duelPauseMs < 2200) return;
    duelPauseMs = 0;
    const over = game.duelOver;
    game.duelOver = null;
    if (over === 'player' && game.playerDuels >= 2) {
      game.matchOver = 'player';
      screen = SCREEN_WIN;
      audio.win();
      announce('Victory. The Lantern Isles keep their light.');
    } else if (over === 'baron' && game.baronDuels >= 2) {
      game.matchOver = 'baron';
      screen = SCREEN_LOSS;
      audio.lose();
      announce('Defeat. The Baron keeps the tide.');
    } else {
      nextDuel(game);
      chooseTelegraph(game);
      announce(`Duel ${game.duel} begins.`);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const cardKey = input.takeCardKey();
    const clicked = input.takeClick();
    const mouse = input.mouse;

    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_TABLE || screen === SCREEN_PAUSED)) {
      startMatch();
      return;
    }
    if (screen === SCREEN_TITLE) {
      if ((actions & ACTION_CONFIRM) || (clicked && inBox(mouse, renderer.layout.playButton))) {
        audio.unlock();
        audio.playCard();
        startMatch();
      }
      return;
    }
    if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      if ((actions & ACTION_CONFIRM) || (clicked && inBox(mouse, renderer.layout.retryButton))) {
        audio.unlock();
        startMatch();
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if ((actions & ACTION_PAUSE) || clicked) {
        screen = pausedFrom;
        announce('Playing.');
      }
      return;
    }
    // Table screen.
    if (actions & ACTION_PAUSE) {
      pausedFrom = screen;
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (game.phase !== PHASE_PLAYER || game.duelOver || game.matchOver) return;
    if (clicked && inBox(mouse, renderer.layout.endTurn)) {
      endPlayerTurn(game);
      beginBaronTurn();
      audio.turn();
      return;
    }
    if (actions & ACTION_END_TURN) {
      endPlayerTurn(game);
      beginBaronTurn();
      audio.turn();
      return;
    }
    let cardIndex = -1;
    if (cardKey >= 0) cardIndex = cardKey;
    else if (clicked) {
      for (const hit of renderer.layout.handCards) {
        if (inBox(mouse, hit)) {
          cardIndex = hit.index;
          break;
        }
      }
    }
    if (cardIndex >= 0 && cardIndex < game.player.hand.length) {
      const card = game.player.hand[cardIndex];
      if (canPlay(game, game.player, card)) {
        audio.unlock();
        const result = playCard(game, game.player, cardIndex);
        if (result) {
          audio.playCard();
          if (card.kind === 'Strike') audio.strike();
          if (card.kind === 'Guard') audio.guard();
          if (card.kind === 'Trick') audio.trick();
          if (result.notes.length > 0) audio.combo();
          if (game.duelOver) checkDuelEnd(game);
        }
      }
    }
  }

  function stepBaron(dtMs) {
    if (game.phase !== PHASE_BARON || game.duelOver || game.matchOver) return;
    if (baronPlan === null) {
      beginBaronTurn();
      return;
    }
    baronTimerMs -= dtMs;
    if (baronTimerMs > 0) return;
    baronTimerMs = BARON_PLAY_DELAY_MS;
    if (baronPlan.length === 0) {
      finishBaronTurn();
      return;
    }
    if (playPlannedCard(game, baronPlan)) audio.playCard();
    if (game.duelOver) baronPlan = [];
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dtMs = Math.min(250, Math.max(0, now - last));
    last = now;
    handleActions();
    // Age the transient visuals.
    if (game.announcement) game.announcement.ageMs += dtMs;
    for (const entry of game.played) entry.ageMs += dtMs;
    for (const floater of game.floaters) floater.ageMs += dtMs;
    game.floaters = game.floaters.filter((floater) => floater.ageMs < 1100);
    if (game.announcement && game.announcement.ageMs > 2200) game.announcement = null;
    stepBaron(dtMs);
    handleDuelEnd(dtMs);
    renderer.draw(game, screen, { mouse: input.mouse, timeMs: now });
  }

  announce('TIDEBOUND. Press Enter or click Play to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
