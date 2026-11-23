// BRASS BAZAAR — the rules engine. One job: turns, playing cards, combos,
// damage, guard, duels and the match. No drawing here, no input here.
import {
  BEATS,
  COMBO_BAZAAR_DRAW,
  COMBO_BAZAAR_REFUND,
  COMBO_SET_BONUS,
  COMBO_UNDERCUT_BONUS,
  CROWD_RUSH_AT,
  DRAW_PER_TURN,
  DUELS_TO_WIN_MATCH,
  MAX_COINS,
  MAX_HAND,
  RIVAL_PHASES,
  RUSH_HOUR_BONUS,
  START_COINS,
  START_HAND,
  START_PATRONS,
} from './config.js';
import { buildDeckList } from './cards.js';
import { createRandom, drawFrom, makePile, mintUid } from './deck.js';

export const PHASE_PLAYER = 'player';
export const PHASE_RIVAL = 'rival';

function freshSide(random) {
  const pile = makePile(buildDeckList(), random);
  const hand = drawFrom(pile, random, START_HAND).map((c) => ({ ...c, uid: mintUid() }));
  return {
    patrons: START_PATRONS,
    coins: START_COINS,
    maxCoins: START_COINS,
    hand,
    pile,
    guard: 0,
    reflect: false,
  };
}

export function createGame(seed = 7) {
  const random = createRandom(seed);
  const game = {
    seed,
    random,
    screen: 'title',
    duel: 1,
    turn: 1,
    phase: PHASE_PLAYER,
    player: freshSide(random),
    rival: freshSide(random),
    played: [], // cards on the table this turn, face up
    stallsThisTurn: [],
    bazaarDone: false,
    crowd: 0,
    rushHour: false,
    chain: 0,
    telegraph: { stall: 'spice', text: '' },
    announcement: null,
    floaters: [],
    log: [],
    playerDuels: 0,
    rivalDuels: 0,
    duelOver: false,
    duelWinner: null,
    matchOver: false,
    matchWinner: null,
    paused: false,
    stats: { cardsPlayed: 0, combos: 0, bestChain: 0, sells: 0, charms: 0, haggles: 0, coinsStolen: 0 },
  };
  return game;
}

export function rivalPhase(game) {
  const idx = Math.min(game.duel - 1, RIVAL_PHASES.length - 1);
  return RIVAL_PHASES[idx];
}

export function announce(game, text, big = false) {
  game.announcement = { text, big, t: 0 };
}

export function addFloater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color, t: 0 });
  if (game.floaters.length > 24) game.floaters.shift();
}

export function addLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 6) game.log.pop();
}

export function canPlay(game, card) {
  if (game.screen !== 'table') return false;
  if (game.phase !== PHASE_PLAYER) return false;
  if (game.duelOver || game.matchOver) return false;
  return game.player.coins >= card.cost;
}

// Deal damage to a side, honouring guard first and reflect second.
// Returns the patrons actually lost.
export function dealDamage(game, target, amount, from) {
  if (amount <= 0) return 0;
  const side = target === 'player' ? game.player : game.rival;
  if (side.reflect) {
    side.reflect = false;
    const back = target === 'player' ? 'rival' : 'player';
    addLog(game, `Mirror Scarf! The hit bounces back.`);
    return dealDamage(game, back, amount, target);
  }
  let left = amount;
  if (side.guard > 0) {
    const blocked = Math.min(side.guard, left);
    side.guard -= blocked;
    left -= blocked;
    if (blocked > 0) addLog(game, `${blocked} blocked by guard.`);
  }
  if (left > 0) {
    side.patrons = Math.max(0, side.patrons - left);
    // Floaters sit beside the patron totals, clear of the card backs.
    const x = target === 'player' ? 300 : 980;
    addFloater(game, x, 200, `-${left}`, '#ffd166');
  }
  if (side.patrons <= 0) endDuel(game, from);
  return left;
}

function endDuel(game, winner) {
  if (game.duelOver) return;
  game.duelOver = true;
  game.duelWinner = winner;
  if (winner === 'player') {
    game.playerDuels += 1;
    announce(game, 'DUEL WON!', true);
    addLog(game, 'You win the duel — her patrons come to you.');
  } else {
    game.rivalDuels += 1;
    announce(game, 'DUEL LOST', true);
    addLog(game, 'Zinnia wins the duel — your patrons drift away.');
  }
  if (game.playerDuels >= DUELS_TO_WIN_MATCH || game.rivalDuels >= DUELS_TO_WIN_MATCH) {
    game.matchOver = true;
    game.matchWinner = winner;
    game.screen = winner === 'player' ? 'win' : 'loss';
  }
}

export function nextDuel(game) {
  game.duel += 1;
  game.turn = 1;
  game.phase = PHASE_PLAYER;
  game.player = freshSide(game.random);
  game.rival = freshSide(game.random);
  game.played = [];
  game.stallsThisTurn = [];
  game.bazaarDone = false;
  game.crowd = 0;
  game.rushHour = false;
  game.chain = 0;
  game.duelOver = false;
  game.duelWinner = null;
  game.floaters = [];
  game.log = [];
  announce(game, `DUEL ${game.duel} — ${rivalPhase(game).title}`, true);
  addLog(game, rivalPhase(game).taunt);
}

export function startPlayerTurn(game) {
  game.phase = PHASE_PLAYER;
  game.turn += 1;
  const p = game.player;
  p.maxCoins = Math.min(MAX_COINS, p.maxCoins + 1);
  p.coins = p.maxCoins;
  p.guard = 0;
  // The counter is NOT cleared here: Zinnia's cards stay visible while the
  // player answers them, so the table always shows the last exchange.
  game.stallsThisTurn = [];
  game.bazaarDone = false;
  game.chain = 0;
  const drawn = drawFrom(p.pile, game.random, DRAW_PER_TURN).map((c) => ({ ...c, uid: mintUid() }));
  for (const c of drawn) {
    if (p.hand.length < MAX_HAND) p.hand.push(c);
    else p.pile.discard.push(c);
  }
  addLog(game, `Turn ${game.turn}: you draw ${drawn.length}, ${p.coins} coins.`);
}

// Play one card from a side's hand. Returns true when the card was played.
export function playCard(game, who, card) {
  const side = who === 'player' ? game.player : game.rival;
  const foe = who === 'player' ? game.rival : game.player;
  const idx = side.hand.findIndex((c) => c.uid === card.uid);
  if (idx < 0) return false;
  if (side.coins < card.cost) return false;
  side.coins -= card.cost;
  side.hand.splice(idx, 1);
  side.pile.discard.push(card);
  game.played.push({ ...card, who });
  game.stats.cardsPlayed += 1;
  game.chain += 1;
  game.stats.bestChain = Math.max(game.stats.bestChain, game.chain);

  let bonus = 0;
  const comboNames = [];

  if (who === 'player') {
    // Stall Set: second card of the same stall in one turn.
    const sameStall = game.stallsThisTurn.filter((s) => s === card.stall).length;
    if (sameStall === 1) {
      bonus += COMBO_SET_BONUS;
      comboNames.push('STALL SET +2');
    }
    // Undercut: the stall that beats what Zinnia telegraphed.
    if (BEATS[card.stall] === game.telegraph.stall) {
      bonus += COMBO_UNDERCUT_BONUS;
      comboNames.push('UNDERCUT +3');
    }
    // Grand Bazaar: three different stalls in one turn.
    const distinct = new Set([...game.stallsThisTurn, card.stall]).size;
    if (distinct >= 3 && !game.bazaarDone) {
      game.bazaarDone = true;
      comboNames.push('GRAND BAZAAR!');
      const drawn = drawFrom(side.pile, game.random, COMBO_BAZAAR_DRAW).map((c) => ({ ...c, uid: mintUid() }));
      for (const c of drawn) if (side.hand.length < MAX_HAND) side.hand.push(c);
      side.coins = Math.min(side.maxCoins, side.coins + COMBO_BAZAAR_REFUND);
      addLog(game, 'Grand Bazaar! Draw 1, refund 1 coin.');
    }
    game.stallsThisTurn.push(card.stall);
    // The crowd gathers: every card you play fills the square.
    game.crowd += 1;
    if (game.crowd >= CROWD_RUSH_AT) {
      game.crowd = 0;
      game.rushHour = true;
      comboNames.push('RUSH HOUR!');
      announce(game, 'RUSH HOUR! Next Sell +4', true);
      addLog(game, 'Rush Hour! The square is packed — next Sell +4.');
    }
    if (comboNames.length > 0) {
      game.stats.combos += 1;
      announce(game, comboNames.join('  '), comboNames.length > 1);
    }
  } else {
    // Zinnia's phase bonus: her Sells hit harder as she climbs.
    if (card.kind === 'sell') bonus += rivalPhase(game).bonus;
  }

  if (card.kind === 'sell') {
    let dmg = card.value + bonus;
    if (who === 'player' && game.rushHour) {
      dmg += RUSH_HOUR_BONUS;
      game.rushHour = false;
      addLog(game, `Rush Hour spends: +${RUSH_HOUR_BONUS} damage.`);
    }
    game.stats.sells += 1;
    addLog(game, `${who === 'player' ? 'You sell' : 'Zinnia sells'} ${card.name} for ${dmg}.`);
    dealDamage(game, who === 'player' ? 'rival' : 'player', dmg, who);
  } else if (card.kind === 'charm') {
    const guard = card.value + bonus;
    side.guard += guard;
    game.stats.charms += 1;
    addFloater(game, who === 'player' ? 300 : 980, 220, `+${guard} guard`, '#8fd6a0');
    addLog(game, `${who === 'player' ? 'You charm' : 'Zinnia charms'} ${card.name}: +${guard} guard.`);
  } else if (card.kind === 'haggle') {
    game.stats.haggles += 1;
    if (card.effect === 'draw') {
      const drawn = drawFrom(side.pile, game.random, card.value).map((c) => ({ ...c, uid: mintUid() }));
      for (const c of drawn) if (side.hand.length < MAX_HAND) side.hand.push(c);
      addLog(game, `${card.name}: draw ${drawn.length}.`);
    } else if (card.effect === 'steal') {
      const taken = Math.min(card.value, foe.coins);
      foe.coins -= taken;
      side.coins = Math.min(side.maxCoins, side.coins + taken);
      if (who === 'player') game.stats.coinsStolen += taken;
      addFloater(game, who === 'player' ? 980 : 300, 220, `-${taken} coins`, '#ffd166');
      addLog(game, `${card.name}: steal ${taken} coin${taken === 1 ? '' : 's'}.`);
    } else if (card.effect === 'reflect') {
      side.reflect = true;
      addLog(game, `${card.name}: the next hit bounces back.`);
    }
  }
  return true;
}

export function endPlayerTurn(game) {
  if (game.phase !== PHASE_PLAYER || game.duelOver || game.matchOver) return;
  game.played = [];
  game.phase = PHASE_RIVAL;
}
