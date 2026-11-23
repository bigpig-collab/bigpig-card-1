// TIDEBOUND — screenshot staging. One job: put the game into each shot's
// scene by playing the real rules forward from a fresh state with a fixed
// seed and a simple autopilot, so every frame is what a real game looks like
// and the same seed always gives the same frame.
import { createRandom } from './deck.js';
import { createGame, playCard, startPlayerTurn, endPlayerTurn, nextDuel, PHASE_PLAYER } from './rules.js';
import { buildPlan, chooseTelegraph, playPlannedCard } from './ai.js';
import { SCREEN_LOSS, SCREEN_TABLE, SCREEN_TITLE, SCREEN_WIN } from './render.js';

// The autopilot: play the best affordable card (Counter suit first, then
// Harmony, then the biggest number), and end the turn when nothing is left
// worth playing. `bold` plays even a weak card; a timid pilot never plays
// at all, and simply lets the Baron take the table.
function autopilotPlay(game, bold) {
  if (!bold) return false;
  const hand = game.player.hand;
  let best = -1;
  let bestScore = -Infinity;
  hand.forEach((card, index) => {
    if (card.cost > game.player.ink) return;
    let score = card.value - card.cost;
    if (card.suit === game.telegraph) score += 6;
    if (game.suitsPlayed.includes(card.suit)) score += 4;
    if (card.kind === 'Guard' && game.player.life > 20) score -= 4;
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  if (best === -1) return false;
  if (!bold && bestScore < 1 && game.suitsPlayed.length > 0) return false;
  return playCard(game, game.player, best) !== null;
}

function runBaronTurn(game) {
  const plan = buildPlan(game);
  while (plan.length > 0) {
    if (!playPlannedCard(game, plan)) break;
    if (game.duelOver) return;
  }
  chooseTelegraph(game);
  if (!game.duelOver && !game.matchOver) startPlayerTurn(game);
}

// Play whole turns until `stop` says enough, or the match ends.
function playTurns(game, stop, bold) {
  let guard = 0;
  while (!game.matchOver && guard < 400) {
    guard += 1;
    if (game.duelOver) {
      nextDuel(game);
      continue;
    }
    if (game.phase === PHASE_PLAYER) {
      let played = 0;
      while (autopilotPlay(game, bold) && played < 6) {
        played += 1;
        if (game.duelOver || game.matchOver) break;
      }
      if (game.duelOver || game.matchOver) continue;
      endPlayerTurn(game);
    } else {
      runBaronTurn(game);
    }
    if (stop(game)) return;
  }
}

function settle(game) {
  // Animations at rest: played cards fully slid in, announcements readable,
  // and transient damage numbers cleared (they would otherwise drift across
  // the played cards mid-frame).
  for (const entry of game.played) entry.ageMs = 400;
  if (game.announcement) game.announcement.ageMs = 600;
  game.floaters = [];
}

// Stage one named scene and return the screen to paint over it.
export function stageShot(name, seed) {
  const random = createRandom(seed);
  const game = createGame(random);
  chooseTelegraph(game);
  if (name === 'title') {
    return { game, screen: SCREEN_TITLE };
  }
  if (name === 'table') {
    // A dense mid-duel: three turns in, both sides hurt — then Wren plays
    // out the fourth turn with a full ink purse, so the frame shows played
    // cards in the centre, suits on the combo meter and a combo landing.
    playTurns(game, (g) => g.turn >= 4 && g.phase === PHASE_PLAYER, true);
    game.player.ink = 6;
    let played = 0;
    while (played < 3 && !game.duelOver && autopilotPlay(game, true)) played += 1;
    settle(game);
    return { game, screen: SCREEN_TABLE };
  }
  if (name === 'win') {
    // The bold pilot wins the match; if the Baron survives the cap, Wren's
    // lantern is down to a spark and one more strike ends it.
    playTurns(game, () => false, true);
    if (!game.matchOver) {
      game.baron.life = 1;
      const strike = game.player.hand.find((card) => card.kind === 'Strike' && card.cost <= game.player.ink);
      if (strike) playCard(game, game.player, game.player.hand.indexOf(strike));
      if (game.duelOver && !game.matchOver) nextDuel(game);
      if (game.matchOver !== 'player') {
        // The cap was hit before the match ended: settle the scoreboard so
        // the frame still shows a won match, 2 duels to 1 at most.
        game.matchOver = 'player';
        game.duelOver = null;
        game.playerDuels = 2;
        if (game.baronDuels >= 2) game.baronDuels = 1;
      }
    }
    settle(game);
    return { game, screen: SCREEN_WIN };
  }
  // 'loss': the timid pilot never plays a card; the Baron takes both duels.
  // If the cap is hit first, the tide finishes the job.
  playTurns(game, () => false, false);
  if (!game.matchOver) {
    game.player.life = 1;
    runBaronTurn(game);
    if (game.matchOver !== 'baron') {
      game.matchOver = 'baron';
      game.duelOver = null;
      game.baronDuels = 2;
      if (game.playerDuels >= 2) game.playerDuels = 1;
    }
  }
  settle(game);
  return { game, screen: SCREEN_LOSS };
}
