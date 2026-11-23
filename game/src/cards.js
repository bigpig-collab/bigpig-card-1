// BRASS BAZAAR — the card list. One job: every ware in the market, named once.
// Each card: id, name, stall (one of the four market stalls), kind,
// cost in coins, value (damage / guard / haggle strength), a one-line flavour
// rule, and for Haggle cards an effect: 'draw' | 'steal' | 'reflect'.
export const CARDS = [
  { id: 'saffron-shout', name: 'Saffron Shout', stall: 'spice', kind: 'sell', cost: 1, value: 3, text: 'A cry that pulls three patrons over.' },
  { id: 'chilli-ember', name: 'Chilli Ember', stall: 'spice', kind: 'sell', cost: 2, value: 5, text: 'Hot enough to steal a whole queue.' },
  { id: 'pepper-storm', name: 'Pepper Storm', stall: 'spice', kind: 'sell', cost: 4, value: 9, text: 'The whole square sneezes at once.' },
  { id: 'cinnamon-warmth', name: 'Cinnamon Warmth', stall: 'spice', kind: 'charm', cost: 2, value: 5, text: 'Guard 5. Smells like coming home.' },
  { id: 'paprika-promise', name: 'Paprika Promise', stall: 'spice', kind: 'haggle', cost: 1, value: 1, effect: 'draw', text: 'Draw 1. A promise kept in red.' },
  { id: 'smoke-signal', name: 'Smoke Signal', stall: 'spice', kind: 'haggle', cost: 2, value: 1, effect: 'steal', text: 'Steal 1 coin from the rival till.' },
  { id: 'silk-ribbon', name: 'Silk Ribbon', stall: 'silk', kind: 'sell', cost: 1, value: 3, text: 'It shimmers. They follow.' },
  { id: 'velvet-veil', name: 'Velvet Veil', stall: 'silk', kind: 'sell', cost: 3, value: 7, text: 'Seven patrons, veiled and won.' },
  { id: 'brocade-banner', name: 'Brocade Banner', stall: 'silk', kind: 'sell', cost: 5, value: 11, text: 'A banner the whole market can read.' },
  { id: 'satin-screen', name: 'Satin Screen', stall: 'silk', kind: 'charm', cost: 2, value: 6, text: 'Guard 6. Soft, but it holds.' },
  { id: 'thread-bargain', name: 'Thread Bargain', stall: 'silk', kind: 'haggle', cost: 1, value: 1, effect: 'draw', text: 'Draw 1. One thread, one deal.' },
  { id: 'mirror-scarf', name: 'Mirror Scarf', stall: 'silk', kind: 'haggle', cost: 3, value: 0, effect: 'reflect', text: 'Reflect the next hit back at her.' },
  { id: 'brass-bell', name: 'Brass Bell', stall: 'brass', kind: 'sell', cost: 1, value: 4, text: 'One ring, four patrons turn.' },
  { id: 'copper-kettle', name: 'Copper Kettle', stall: 'brass', kind: 'sell', cost: 2, value: 5, text: 'Whistles a queue into being.' },
  { id: 'gilded-gong', name: 'Gilded Gong', stall: 'brass', kind: 'sell', cost: 4, value: 10, text: 'The gong empties her stall.' },
  { id: 'iron-shutter', name: 'Iron Shutter', stall: 'brass', kind: 'charm', cost: 3, value: 8, text: 'Guard 8. Nothing gets through.' },
  { id: 'coin-count', name: 'Coin Count', stall: 'brass', kind: 'haggle', cost: 1, value: 1, effect: 'draw', text: 'Draw 1. Count twice, deal once.' },
  { id: 'brass-knuckles', name: 'Brass Knuckles', stall: 'brass', kind: 'haggle', cost: 2, value: 2, effect: 'steal', text: 'Steal 2 coins from the rival till.' },
  { id: 'mint-sprig', name: 'Mint Sprig', stall: 'leaf', kind: 'sell', cost: 1, value: 3, text: 'Fresh as morning, sharp as noon.' },
  { id: 'tea-ceremony', name: 'Tea Ceremony', stall: 'leaf', kind: 'sell', cost: 3, value: 7, text: 'Slow pour, seven patrons stay.' },
  { id: 'herb-garden', name: 'Herb Garden', stall: 'leaf', kind: 'sell', cost: 5, value: 12, text: 'Twelve patrons, grown not bought.' },
  { id: 'hedge-wall', name: 'Hedge Wall', stall: 'leaf', kind: 'charm', cost: 2, value: 6, text: 'Guard 6. Green and stubborn.' },
  { id: 'seed-packet', name: 'Seed Packet', stall: 'leaf', kind: 'haggle', cost: 1, value: 1, effect: 'draw', text: 'Draw 1. Plant it, watch it grow.' },
  { id: 'basil-bluff', name: 'Basil Bluff', stall: 'leaf', kind: 'haggle', cost: 2, value: 1, effect: 'steal', text: 'Steal 1 coin. She never notices.' },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id) ?? null;
}

// A deck is two copies of the whole market, shuffled at duel start.
export function buildDeckList() {
  return [...CARDS, ...CARDS];
}
