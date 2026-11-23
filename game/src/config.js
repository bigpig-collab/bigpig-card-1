// TIDEBOUND — Duel of the Lantern Isles: tuning constants.
// One job: every number the rules, the AI and the renderer agree on.
export const GAME_TITLE = 'TIDEBOUND';
export const GAME_SUBTITLE = 'Duel of the Lantern Isles';

export const MAX_LIFE = 30;
export const DUELS_TO_WIN_MATCH = 2;
export const MAX_DUELS = 3;
export const STARTING_HAND = 5;
export const DRAW_PER_TURN = 2;
export const MAX_HAND = 7;
export const START_INK = 1;
export const INK_PER_TURN = 1;
export const MAX_INK = 10;

export const HARMONY_BONUS = 2; // second card of the same suit in one turn
export const PRISM_BONUS_DRAW = 1; // three different suits in one turn: draw
export const PRISM_BONUS_INK = 1; // ...and refund this much ink
export const COUNTER_BONUS = 3; // playing the suit that beats the Baron's telegraph

// The suit cycle: Ember beats Gale, Gale beats Tide, Tide beats Ember.
// Stone is neutral: it never counters and is never countered.
export const SUITS = {
  Ember: { color: '#e5484d', dark: '#8f1d22', light: '#ffb3a7', shape: 'flame', beats: 'Gale' },
  Tide: { color: '#3e8fd9', dark: '#174a75', light: '#bfe3ff', shape: 'wave', beats: 'Ember' },
  Gale: { color: '#3fae6a', dark: '#175c33', light: '#c2f2cf', shape: 'spiral', beats: 'Tide' },
  Stone: { color: '#d9a441', dark: '#7a5510', light: '#ffe9b8', shape: 'diamond', beats: null },
};
export const SUIT_NAMES = ['Ember', 'Tide', 'Gale', 'Stone'];

export const KINDS = {
  Strike: { label: 'STRIKE', verb: 'hits' },
  Guard: { label: 'GUARD', verb: 'wards' },
  Trick: { label: 'TRICK', verb: 'weaves' },
};

// Canvas the game is drawn at; the page scales it to the window.
export const VIEW_W = 1280;
export const VIEW_H = 800;

// Baron turn pacing in real play (milliseconds between his card plays).
export const BARON_PLAY_DELAY_MS = 650;
export const BARON_TURN_START_DELAY_MS = 500;
