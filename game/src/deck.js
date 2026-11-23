// BRASS BAZAAR — deck and randomness. One job: a seeded shuffle and a draw pile.
// The seeded generator keeps screenshot staging reproducible: same seed,
// same shuffle, same game, every time.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function shuffle(list, random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// A pile is { cards: [...card objects...], discard: [...] }.
// draw() refills from the discard pile when the deck runs dry.
export function makePile(cards, random) {
  return { cards: shuffle(cards, random), discard: [] };
}

export function drawFrom(pile, random, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (pile.cards.length === 0) {
      if (pile.discard.length === 0) return drawn;
      pile.cards = shuffle(pile.discard, random);
      pile.discard = [];
    }
    drawn.push(pile.cards.pop());
  }
  return drawn;
}

// Every card in play carries a unique id so the rules can find it in a hand
// even when two copies share a name. The counter restarts with each page load,
// which keeps seeded screenshot staging reproducible.
let nextUid = 1;
export function mintUid() {
  nextUid += 1;
  return nextUid;
}
