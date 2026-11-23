// BRASS BAZAAR — shared constants for the whole game.
// One job: every number the rules, AI and renderer agree on lives here.
export const GAME_TITLE = 'BRASS BAZAAR';
export const GAME_SUBTITLE = 'Duel of the Coinmarket';
export const CANVAS_W = 1280;
export const CANVAS_H = 800;

export const START_PATRONS = 30;
export const DUELS_TO_WIN_MATCH = 2;
export const START_HAND = 5;
export const DRAW_PER_TURN = 2;
export const MAX_HAND = 7;
export const START_COINS = 1;
export const MAX_COINS = 10;

export const COMBO_SET_BONUS = 2; // second card of the same stall in one turn
export const COMBO_UNDERCUT_BONUS = 3; // playing the stall that beats the telegraph
export const COMBO_BAZAAR_DRAW = 1; // three different stalls in one turn
export const COMBO_BAZAAR_REFUND = 1;
export const CROWD_RUSH_AT = 8; // cards played until Rush Hour
export const RUSH_HOUR_BONUS = 4; // bonus on the next Sell after Rush Hour

// The four market stalls. Colour AND shape carry the identity, never text alone.
export const STALLS = {
  spice: { name: 'Spice', color: '#e5484d', dark: '#8f1d20', shape: 'star' },
  silk: { name: 'Silk', color: '#9b6dd6', dark: '#4c2a7a', shape: 'diamond' },
  brass: { name: 'Brass', color: '#e0a83c', dark: '#7a5510', shape: 'cog' },
  leaf: { name: 'Leaf', color: '#58b368', dark: '#1f5c2e', shape: 'leaf' },
};
export const STALL_ORDER = ['spice', 'silk', 'brass', 'leaf'];

// The haggling cycle: each stall undercuts exactly one other.
export const BEATS = {
  spice: 'silk',
  silk: 'brass',
  brass: 'leaf',
  leaf: 'spice',
};

export const KINDS = {
  sell: { name: 'Sell', verb: 'sells' },
  charm: { name: 'Charm', verb: 'charms' },
  haggle: { name: 'Haggle', verb: 'haggles' },
};

// Madame Zinnia grows grander with every duel she survives.
export const RIVAL_PHASES = [
  { duel: 1, title: 'Peddler Zinnia', bonus: 0, taunt: 'A small stall, but sharp prices.' },
  { duel: 2, title: 'Merchant Zinnia', bonus: 1, taunt: 'Her awning doubles. Her prices bite.' },
  { duel: 3, title: 'Baroness Zinnia', bonus: 2, taunt: 'The whole market is hers now. Almost.' },
];

export const PLAYER_NAME = 'Pip the Peddler';
export const RIVAL_NAME = 'Madame Zinnia';
