// TIDEBOUND — the Ink Baron's brain. One job: decide what the Baron does.
// The Baron telegraphs his next suit so the player can read him and counter
// it, then plays like a patient collector: damage while ahead, guard while
// hurt, and a trick when it pays.
import { SUIT_NAMES } from './config.js';
import { baronDrawAndStart, playCard } from './rules.js';

// Pick the suit the Baron reaches for next. Weighted toward the suit he
// holds most of, so a watching player can guess it from his rhythm.
export function chooseTelegraph(game) {
  const counts = { Ember: 0, Tide: 0, Gale: 0, Stone: 0 };
  for (const card of game.baron.hand) counts[card.suit] += 1;
  const suits = [...SUIT_NAMES].sort((a, b) => counts[b] - counts[a]);
  const roll = game.random();
  const pick = roll < 0.55 ? suits[0] : roll < 0.8 ? suits[1] : suits[Math.floor(game.random() * 4)];
  game.telegraph = pick;
  return pick;
}

export function telegraphHint(game) {
  if (!game.telegraph) return 'The Baron watches you, ink dripping from his pen.';
  return `The Baron reaches for ${game.telegraph}…`;
}

// Build the Baron's plan for his turn: the hand indexes he will play, in
// order. He spends up to his ink, favouring telegraphed-suit strikes, then
// guards when his life is low, then tricks. Two disciplines keep him from
// stalling: he never spends ink on a draw trick when his hand is already
// full (the drawn cards would have nowhere to go), and when his hand holds
// a big Strike he cannot quite afford yet and nothing cheap is worth
// playing, he saves his ink for the next turn instead of frittering it.
export function planBaronTurn(game) {
  baronDrawAndStart(game);
  const hand = game.baron.hand;
  const handFull = hand.length >= 7;
  const scored = hand.map((card, index) => {
    let score = card.value;
    if (card.kind === 'Strike') score += 3;
    if (card.suit === game.telegraph) score += 4;
    if (card.kind === 'Guard' && game.baron.life <= 12) score += 6;
    if (card.kind === 'Guard' && game.baron.life > 20) score -= 3;
    if (card.kind === 'Trick') score += 1;
    if (card.kind === 'Trick' && handFull && (card.id.includes('sigil') || card.id.includes('charm') || card.id.includes('tailwind') || card.id.includes('quarry'))) score -= 5;
    score -= card.cost;
    return { index, score, card };
  });
  scored.sort((a, b) => b.score - a.score);
  // Save for a big Strike: if the best Strike in hand costs more than the
  // ink on hand, one more turn's ink buys it, and nothing affordable is
  // clearly worth playing, hold the ink.
  const bestStrike = hand
    .filter((card) => card.kind === 'Strike')
    .sort((a, b) => b.value - a.value)[0];
  const bestAffordable = scored.find((entry) => entry.card.cost <= game.baron.ink);
  if (
    bestStrike && bestStrike.cost > game.baron.ink && bestStrike.cost <= game.baron.ink + 1
    && (!bestAffordable || bestAffordable.score < 4)
  ) {
    return [];
  }
  const plan = [];
  let ink = game.baron.ink;
  for (const entry of scored) {
    if (plan.length >= 3) break;
    if (entry.score < 1) continue;
    if (entry.card.cost <= ink) {
      plan.push(entry.index);
      ink -= entry.card.cost;
    }
  }
  // Play at least one card when he can afford anything and has nothing
  // bigger to save for — even a weak one keeps the pressure on.
  if (plan.length === 0) {
    const savingForStrike = hand.some((card) => card.kind === 'Strike' && card.cost > game.baron.ink);
    if (!savingForStrike) {
      const cheapest = hand
        .map((card, index) => ({ index, card }))
        .filter((entry) => entry.card.cost <= game.baron.ink)
        .sort((a, b) => a.card.cost - b.card.cost)[0];
      if (cheapest) plan.push(cheapest.index);
    }
  }
  return plan;
}

// Play one planned card (hand indexes shift as cards leave the hand, so the
// plan is recomputed from the live hand each step by the caller).
export function playPlannedCard(game, plan) {
  if (!plan || plan.length === 0) return false;
  const wanted = plan[0];
  const hand = game.baron.hand;
  // The plan holds indexes into the hand as it was; find the same card by uid.
  const at = hand.findIndex((card) => card.uid === wanted.uid);
  if (at === -1) {
    plan.shift();
    return playPlannedCard(game, plan);
  }
  playCard(game, game.baron, at);
  plan.shift();
  return true;
}

// Rebuild the plan as { uid } entries so indexes stay valid as the hand
// shrinks. Called once per Baron turn by main.js.
export function buildPlan(game) {
  const indexes = planBaronTurn(game);
  return indexes.map((index) => ({ uid: game.baron.hand[index].uid }));
}
