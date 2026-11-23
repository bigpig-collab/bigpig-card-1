// BRASS BAZAAR — screenshot staging. One job: given ?shot=title|table|win|loss,
// drive the real rules forward from a fresh seeded game until the scene looks
// like a real game, then flag the page ready. Every frame is a real game state.
import { BEATS, STALL_ORDER } from './config.js';
import { createGame, nextDuel, playCard, startPlayerTurn } from './rules.js';
import { chooseTelegraph, runRivalTurn } from './ai.js';

// Score a card the way a sharp player would: Sells first (they win duels),
// Undercut and Stall Set bonuses counted in, Charms only when hurt, Haggles
// as cheap setup. The autopilot must actually win, or the win shot is a lie.
function scoreForAutopilot(game, card) {
  let score = card.value;
  if (card.kind === 'sell') score += 4;
  if (card.kind === 'charm') score = game.player.patrons <= 12 ? card.value : card.value * 0.4;
  if (card.kind === 'haggle') score = card.effect === 'draw' ? 3 : 2;
  if (BEATS[card.stall] === game.telegraph.stall) score += 3;
  if (game.stallsThisTurn.includes(card.stall)) score += 2;
  return score - card.cost * 0.5;
}

function bestAffordable(game) {
  const hand = game.player.hand.filter((c) => c.cost <= game.player.coins);
  if (hand.length === 0) return null;
  hand.sort((a, b) => scoreForAutopilot(game, b) - scoreForAutopilot(game, a));
  return hand[0];
}

// Play a full player turn with a simple autopilot: play the biggest affordable
// card, repeat while coins remain, then hand over to Zinnia.
function autopilotTurn(game) {
  let guard = 0;
  while (guard < 8 && !game.duelOver && !game.matchOver) {
    guard += 1;
    const card = bestAffordable(game);
    if (!card) break;
    playCard(game, 'player', card);
  }
  if (game.duelOver || game.matchOver) return;
  game.phase = 'rival';
  runRivalTurn(game);
  if (game.duelOver || game.matchOver) return;
  startPlayerTurn(game);
}

export function stageShot(kind, seed = 7) {
  const game = createGame(seed);
  chooseTelegraph(game);
  game.screen = 'table';

  if (kind === 'title') {
    game.screen = 'title';
    return game;
  }

  if (kind === 'win') {
    // Win duels 1 and 2 for real: autopilot until the match is won. If one
    // seed loses the match, retry with the next seed — the shot must show a
    // genuine victory, never a staged one.
    for (let seedTry = seed; seedTry < seed + 8; seedTry += 1) {
      const attempt = createGame(seedTry);
      chooseTelegraph(attempt);
      attempt.screen = 'table';
      let guard = 0;
      while (!attempt.matchOver && guard < 300) {
        guard += 1;
        if (attempt.duelOver) { nextDuel(attempt); continue; }
        if (attempt.phase === 'player') autopilotTurn(attempt);
        else { runRivalTurn(attempt); if (!attempt.duelOver && !attempt.matchOver) startPlayerTurn(attempt); }
      }
      if (attempt.matchOver && attempt.matchWinner === 'player') {
        attempt.screen = 'win';
        return attempt;
      }
    }
    const fallback = createGame(seed);
    fallback.screen = 'table';
    return fallback;
  }

  if (kind === 'loss') {
    // Let Zinnia win: the player passes every turn.
    let guard = 0;
    while (!game.matchOver && guard < 300) {
      guard += 1;
      if (game.duelOver) { nextDuel(game); continue; }
      if (game.phase === 'player') {
        game.phase = 'rival';
        runRivalTurn(game);
        if (!game.duelOver && !game.matchOver) startPlayerTurn(game);
      } else {
        runRivalTurn(game);
        if (!game.duelOver && !game.matchOver) startPlayerTurn(game);
      }
    }
    game.screen = game.matchOver ? (game.matchWinner === 'player' ? 'win' : 'loss') : 'table';
    return game;
  }

  // Table: a dense mid-duel. Play real turns, but stop while both sides are
  // still standing with a full counter — never on a duel-over screen. If a
  // duel ends mid-staging, start the next one and keep playing.
  let turns = 0;
  while (turns < 2 && !game.matchOver) {
    turns += 1;
    if (game.duelOver) { nextDuel(game); continue; }
    if (game.player.patrons <= 12 || game.rival.patrons <= 12) break;
    autopilotTurn(game);
  }
  if (game.duelOver && !game.matchOver) nextDuel(game);
  // Stage up to three more player plays so the counter shows fresh cards.
  // Cheapest first: three coins should buy a visible little exchange.
  if (!game.duelOver && !game.matchOver && game.phase === 'player') {
    for (let i = 0; i < 3; i += 1) {
      const affordable = game.player.hand.filter((c) => c.cost <= game.player.coins);
      if (affordable.length === 0) break;
      affordable.sort((a, b) => a.cost - b.cost || scoreForAutopilot(game, b) - scoreForAutopilot(game, a));
      playCard(game, 'player', affordable[0]);
    }
  }
  if (game.stats.combos > 0) game.announcement = { text: 'STALL SET +2', big: true, t: 0 };
  else if (game.rushHour) game.announcement = { text: 'RUSH HOUR! Next Sell +4', big: true, t: 0 };
  // A still frame never advances floater clocks, so keep only the latest
  // floating number, mid-rise, instead of a pile of stale ones.
  game.floaters = game.floaters.slice(-1);
  if (game.floaters[0]) game.floaters[0].t = 0.35;
  game.screen = 'table';
  return game;
}
