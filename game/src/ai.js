// BRASS BAZAAR — Madame Zinnia's brain. One job: decide what she plays and
// what she telegraphs, so the player can read her and counter her.
// She is readable by design: her next stall is always announced a turn ahead.
import { BEATS, STALL_ORDER } from './config.js';
import { drawFrom, mintUid } from './deck.js';
import { addLog, playCard } from './rules.js';

const TELEGRAPH_LINES = {
  spice: 'Zinnia reaches for the spice jars…',
  silk: 'Zinnia fingers a bolt of silk…',
  brass: 'Zinnia polishes a brass bell…',
  leaf: 'Zinnia sniffs a sprig of mint…',
};

// Pick the stall she will favour next turn. She leans toward the stall that
// beats the stall the player played most this turn — a tell the player can use.
export function chooseTelegraph(game) {
  const counts = {};
  for (const s of game.stallsThisTurn) counts[s] = (counts[s] || 0) + 1;
  let favourite = null;
  let best = 0;
  for (const s of STALL_ORDER) {
    if ((counts[s] || 0) > best) { best = counts[s]; favourite = s; }
  }
  let stall;
  if (favourite) {
    stall = STALL_ORDER.find((s) => BEATS[s] === favourite) || 'spice';
  } else {
    stall = STALL_ORDER[Math.floor(game.random() * STALL_ORDER.length)];
  }
  game.telegraph = { stall, text: TELEGRAPH_LINES[stall] };
  return game.telegraph;
}

// Score one of her cards for this turn. Sells that finish the duel win,
// Undercut answers beat the player's last stall, cheap cards fill gaps.
function scoreCard(game, card) {
  let score = card.value;
  if (card.kind === 'sell') {
    score += 3;
    if (card.value >= game.player.patrons) score += 50; // the killing blow
    if (game.player.guard > 0) score -= 1;
  }
  if (card.kind === 'charm' && game.rival.patrons <= 12) score += 4;
  if (card.kind === 'haggle' && card.effect === 'reflect' && game.player.hand.length >= 3) score += 3;
  if (card.kind === 'haggle' && card.effect === 'steal') score += 2;
  if (card.cost <= game.rival.coins - 2) score += 0.5; // keep a coin spare when cheap
  // She answers the player's last stall with its counter.
  const last = game.stallsThisTurn[game.stallsThisTurn.length - 1];
  if (last && BEATS[card.stall] === last) score += 2;
  return score - card.cost * 0.4;
}

// Play her whole turn at once: coins rise, she draws, then she plays her
// best affordable cards (at most four), and telegraphs her next stall.
export function runRivalTurn(game) {
  const r = game.rival;
  r.maxCoins = Math.min(10, r.maxCoins + 1);
  r.coins = r.maxCoins;
  r.guard = 0;
  game.played = [];
  game.stallsThisTurn = [];
  game.chain = 0;
  const drawn = drawFrom(r.pile, game.random, 2).map((c) => ({ ...c, uid: mintUid() }));
  for (const c of drawn) {
    if (r.hand.length < 7) r.hand.push(c);
    else r.pile.discard.push(c);
  }
  addLog(game, `Zinnia draws ${drawn.length}, ${r.coins} coins.`);

  let plays = 0;
  while (plays < 4 && !game.duelOver && !game.matchOver) {
    const affordable = r.hand.filter((c) => c.cost <= r.coins);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => scoreCard(game, b) - scoreCard(game, a));
    const pick = affordable[0];
    if (scoreCard(game, pick) < 1.5 && plays > 0) break; // she keeps a bad hand
    if (!playCard(game, 'rival', pick)) break;
    plays += 1;
  }
  if (plays === 0) addLog(game, 'Zinnia passes — nothing worth selling.');
  chooseTelegraph(game);
  return plays;
}
