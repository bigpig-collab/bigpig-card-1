// TIDEBOUND — the turn and combat engine. One job: the rules.
// It owns the match state, playing a card, combos, damage, block, reflects,
// duels and the match result. It draws nothing and hears no input.
import {
  COUNTER_BONUS, DRAW_PER_TURN, DUELS_TO_WIN_MATCH, HARMONY_BONUS, MAX_HAND,
  MAX_INK, MAX_LIFE, PRISM_BONUS_DRAW, PRISM_BONUS_INK, STARTING_HAND, START_INK,
  SUITS,
} from './config.js';
import { buildDeck, drawCards } from './deck.js';

export const PHASE_PLAYER = 'player';
export const PHASE_BARON = 'baron';

export function suitBeats(attacker, defender) {
  if (!attacker || !defender) return false;
  return SUITS[attacker]?.beats === defender;
}

export function createSide(random) {
  return {
    life: MAX_LIFE,
    ink: START_INK,
    block: 0,
    reflect: false,
    deck: buildDeck(random),
    hand: [],
    discard: [],
  };
}

export function createGame(random) {
  const game = {
    random,
    turn: 1,
    phase: PHASE_PLAYER,
    duel: 1,
    playerDuels: 0,
    baronDuels: 0,
    player: createSide(random),
    baron: createSide(random),
    telegraph: null,
    suitsPlayed: [],
    played: [],
    log: [],
    announcement: null,
    floaters: [],
    stats: { cardsPlayed: 0, damageDealt: 0, combos: 0, bestChain: 0, duelsPlayed: 0, comboTypes: { harmony: 0, prism: 0, counter: 0 } },
    duelOver: null,
    matchOver: null,
    baronPlan: [],
    baronWaitMs: 0,
  };
  game.player.hand = [];
  game.baron.hand = [];
  drawToHand(game, game.player, STARTING_HAND);
  drawToHand(game, game.baron, STARTING_HAND);
  return game;
}

export function addLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 6) game.log.length = 6;
}

export function announce(game, text, sub = '') {
  game.announcement = { text, sub, ageMs: 0 };
}

export function addFloater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color, ageMs: 0 });
}

// Draw `count` cards into a side's hand (up to MAX_HAND); any card that
// does not fit goes to the discard pile, never vanishes. Returns the number
// actually drawn.
export function drawToHand(game, side, count) {
  const drawn = drawCards(side.deck, side.discard, count, game.random);
  const room = Math.max(0, MAX_HAND - side.hand.length);
  side.hand.push(...drawn.slice(0, room));
  side.discard.push(...drawn.slice(room));
  return drawn.length;
}
function dealDamage(game, attacker, defender, amount, x, y) {
  let left = amount;
  if (defender.reflect && left > 0) {
    defender.reflect = false;
    addLog(game, 'Mirror! The hit bounces back.');
    dealDamage(game, defender, attacker, left, x, y);
    return;
  }
  if (defender.block > 0) {
    const absorbed = Math.min(defender.block, left);
    defender.block -= absorbed;
    left -= absorbed;
    if (absorbed > 0) addLog(game, `Block absorbs ${absorbed}.`);
  }
  if (left > 0) {
    defender.life = Math.max(0, defender.life - left);
    addFloater(game, x, y, `-${left}`, '#ffd166');
    if (attacker === game.player) game.stats.damageDealt += left;
  }
}

// --- combos -----------------------------------------------------------------
function comboBonuses(game, card) {
  let bonus = 0;
  const notes = [];
  const sameSuit = game.suitsPlayed.filter((suit) => suit === card.suit).length;
  if (sameSuit >= 1) {
    bonus += HARMONY_BONUS;
    notes.push(`HARMONY +${HARMONY_BONUS}`);
  }
  const distinct = new Set([...game.suitsPlayed, card.suit]).size;
  if (game.suitsPlayed.length >= 2 && distinct >= 3) {
    notes.push(`PRISM +${PRISM_BONUS_DRAW} card, +${PRISM_BONUS_INK} ink`);
  }
  if (game.telegraph && suitBeats(card.suit, game.telegraph)) {
    bonus += COUNTER_BONUS;
    notes.push(`COUNTER +${COUNTER_BONUS}`);
  }
  return { bonus, notes, prism: game.suitsPlayed.length >= 2 && distinct >= 3 };
}

// --- playing a card ---------------------------------------------------------
export function canPlay(game, side, card) {
  return game.phase === PHASE_PLAYER && side === game.player && card && side.ink >= card.cost;
}

export function playCard(game, side, handIndex) {
  const card = side.hand[handIndex];
  if (!card || side.ink < card.cost) return null;
  side.ink -= card.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(card);

  const isPlayer = side === game.player;
  const foe = isPlayer ? game.baron : game.player;
  const { bonus, notes, prism } = isPlayer ? comboBonuses(game, card) : { bonus: 0, notes: [], prism: false };
  if (isPlayer) {
    game.suitsPlayed.push(card.suit);
    const chain = game.suitsPlayed.length;
    if (chain > game.stats.bestChain) game.stats.bestChain = chain;
  }

  let effectText = '';
  if (card.kind === 'Strike') {
    const damage = card.value + bonus;
    dealDamage(game, side, foe, damage, 640, 470);
    effectText = `${card.name} deals ${damage}.`;
  } else if (card.kind === 'Guard') {
    side.block += card.value + bonus;
    effectText = `${card.name} gains ${card.value + bonus} block.`;
  } else if (card.kind === 'Trick') {
    if (card.id.includes('thief') || card.id.includes('snatch')) {
      const stolen = Math.min(1, foe.ink);
      foe.ink -= stolen;
      effectText = `${card.name} steals ${stolen} ink.`;
    } else if (card.id.includes('undertow') || card.id.includes('keystone')) {
      side.reflect = true;
      effectText = `${card.name}: the next hit is reflected.`;
    } else {
      const count = drawToHand(game, side, card.value);
      effectText = `${card.name} draws ${count}.`;
    }
  }

  if (prism && isPlayer) {
    side.ink = Math.min(MAX_INK, side.ink + PRISM_BONUS_INK);
    drawToHand(game, side, PRISM_BONUS_DRAW);
  }
  if (notes.length > 0) {
    game.stats.combos += notes.length;
    for (const note of notes) {
      if (note.startsWith('HARMONY')) game.stats.comboTypes.harmony += 1;
      else if (note.startsWith('PRISM')) game.stats.comboTypes.prism += 1;
      else if (note.startsWith('COUNTER')) game.stats.comboTypes.counter += 1;
    }
    announce(game, notes.join('  ·  '), effectText);
  }
  addLog(game, effectText);
  game.played.push({ card, by: isPlayer ? 'player' : 'baron', bonus, ageMs: 0 });
  if (game.played.length > 4) game.played.shift();
  game.stats.cardsPlayed += 1;
  checkDuelEnd(game);
  return { card, bonus, notes, prism };
}

// --- turns ------------------------------------------------------------------
export function startPlayerTurn(game) {
  game.phase = PHASE_PLAYER;
  game.turn += 1;
  const side = game.player;
  side.ink = Math.min(MAX_INK, side.ink + 1);
  side.block = 0;
  const drawn = drawToHand(game, side, DRAW_PER_TURN);
  game.suitsPlayed = [];
  game.played = [];
  addLog(game, `Turn ${game.turn}: you draw ${drawn}, ink ${side.ink}.`);
}

export function endPlayerTurn(game) {
  if (game.phase !== PHASE_PLAYER || game.matchOver) return;
  game.phase = PHASE_BARON;
  game.baronWaitMs = 500;
  game.baronPlan = null;
}

export function baronDrawAndStart(game) {
  const side = game.baron;
  side.ink = Math.min(MAX_INK, side.ink + 1);
  side.block = 0;
  drawToHand(game, side, DRAW_PER_TURN);
}

// --- duel and match end -----------------------------------------------------
export function checkDuelEnd(game) {
  if (game.duelOver || game.matchOver) return;
  if (game.player.life <= 0 || game.baron.life <= 0) {
    const playerWon = game.baron.life <= 0;
    game.duelOver = playerWon ? 'player' : 'baron';
    if (playerWon) game.playerDuels += 1;
    else game.baronDuels += 1;
    game.stats.duelsPlayed += 1;
    announce(game, playerWon ? 'DUEL WON' : 'DUEL LOST', playerWon ? 'The Baron’s lantern dims.' : 'Your light falters.');
  }
}

export function nextDuel(game) {
  if (game.playerDuels >= DUELS_TO_WIN_MATCH) {
    game.matchOver = 'player';
    return;
  }
  if (game.baronDuels >= DUELS_TO_WIN_MATCH) {
    game.matchOver = 'baron';
    return;
  }
  game.duel += 1;
  const fresh = createGame(game.random);
  game.player = fresh.player;
  game.baron = fresh.baron;
  game.turn = 1;
  game.phase = PHASE_PLAYER;
  game.duelOver = null;
  game.suitsPlayed = [];
  game.played = [];
  game.log = [];
  addLog(game, `Duel ${game.duel} begins — first to ${DUELS_TO_WIN_MATCH} duels takes the match.`);
}

export function restartMatch(game) {
  const fresh = createGame(game.random);
  Object.assign(game, fresh, { playerDuels: 0, baronDuels: 0, duel: 1, matchOver: null });
}
