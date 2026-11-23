// TIDEBOUND — the card list. Every name, suit, cost and power is original,
// written for this game. No card is borrowed from any published card game.
// A card: { id, name, suit, kind, cost, value, text }.
//   Strike: value = damage dealt to the other side.
//   Guard:  value = block gained (absorbs damage until your next turn).
//   Trick:  value = how strong the trick is; text says what it does.
export const CARDS = [
  // ---- Ember (red, flame): fast, hungry damage. ----
  { id: 'ember-fang', name: 'Cinder Fang', suit: 'Ember', kind: 'Strike', cost: 2, value: 4, text: 'Deal 4 damage.' },
  { id: 'ember-oath', name: 'Bonfire Oath', suit: 'Ember', kind: 'Strike', cost: 3, value: 6, text: 'Deal 6 damage.' },
  { id: 'ember-waltz', name: 'Wildfire Waltz', suit: 'Ember', kind: 'Strike', cost: 4, value: 8, text: 'Deal 8 damage.' },
  { id: 'ember-ward', name: 'Ember Ward', suit: 'Ember', kind: 'Guard', cost: 1, value: 4, text: 'Gain 4 block.' },
  { id: 'ember-thief', name: 'Spark Thief', suit: 'Ember', kind: 'Trick', cost: 2, value: 1, text: 'Steal 1 ink from the Baron.' },
  { id: 'ember-sigil', name: 'Flare Sigil', suit: 'Ember', kind: 'Trick', cost: 1, value: 1, text: 'Draw 1 card.' },
  // ---- Tide (blue, wave): deep, steady damage and deep guards. ----
  { id: 'tide-caller', name: 'Tidecaller', suit: 'Tide', kind: 'Strike', cost: 2, value: 4, text: 'Deal 4 damage.' },
  { id: 'tide-current', name: 'Deep Current', suit: 'Tide', kind: 'Strike', cost: 3, value: 5, text: 'Deal 5 damage.' },
  { id: 'tide-surge', name: 'Moonlit Surge', suit: 'Tide', kind: 'Strike', cost: 5, value: 9, text: 'Deal 9 damage.' },
  { id: 'tide-wall', name: 'Stillwater Wall', suit: 'Tide', kind: 'Guard', cost: 1, value: 5, text: 'Gain 5 block.' },
  { id: 'tide-undertow', name: 'Undertow', suit: 'Tide', kind: 'Trick', cost: 2, value: 1, text: 'Reflect the next hit back.' },
  { id: 'tide-charm', name: 'Driftwood Charm', suit: 'Tide', kind: 'Trick', cost: 1, value: 1, text: 'Draw 1 card.' },
  // ---- Gale (green, spiral): cheap strikes, quick tricks. ----
  { id: 'gale-rush', name: 'Gale Rush', suit: 'Gale', kind: 'Strike', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'gale-kite', name: 'Storm Kite', suit: 'Gale', kind: 'Strike', cost: 3, value: 6, text: 'Deal 6 damage.' },
  { id: 'gale-hymn', name: 'Hurricane Hymn', suit: 'Gale', kind: 'Strike', cost: 4, value: 7, text: 'Deal 7 damage.' },
  { id: 'gale-aegis', name: 'Windward Aegis', suit: 'Gale', kind: 'Guard', cost: 2, value: 5, text: 'Gain 5 block.' },
  { id: 'gale-snatch', name: 'Zephyr Snatch', suit: 'Gale', kind: 'Trick', cost: 2, value: 1, text: 'Steal 1 ink from the Baron.' },
  { id: 'gale-tailwind', name: 'Tailwind', suit: 'Gale', kind: 'Trick', cost: 2, value: 2, text: 'Draw 2 cards.' },
  // ---- Stone (amber, diamond): neutral, heavy, unhurried. ----
  { id: 'stone-pebble', name: 'Pebble Pact', suit: 'Stone', kind: 'Strike', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'stone-reply', name: "Mountain's Reply", suit: 'Stone', kind: 'Strike', cost: 3, value: 6, text: 'Deal 6 damage.' },
  { id: 'stone-avalanche', name: 'Avalanche Verse', suit: 'Stone', kind: 'Strike', cost: 5, value: 10, text: 'Deal 10 damage.' },
  { id: 'stone-bastion', name: 'Granite Bastion', suit: 'Stone', kind: 'Guard', cost: 2, value: 6, text: 'Gain 6 block.' },
  { id: 'stone-keystone', name: 'Keystone', suit: 'Stone', kind: 'Trick', cost: 2, value: 1, text: 'Reflect the next hit back.' },
  { id: 'stone-quarry', name: 'Quarry Song', suit: 'Stone', kind: 'Trick', cost: 1, value: 1, text: 'Draw 1 card.' },
];

// A fresh 30-card deck: one of every card, plus a second copy of the six
// cheapest strikes so early turns always have something to play.
export const DECK_RECIPE = [
  ...CARDS.map((card) => card.id),
  'ember-fang', 'tide-caller', 'gale-rush', 'stone-pebble', 'ember-ward', 'tide-wall',
];

export function cardById(id) {
  return CARDS.find((card) => card.id === id) ?? null;
}
