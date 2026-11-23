// TIDEBOUND — decks and drawing. One job: build, shuffle and draw cards.
// All randomness comes from a seeded generator so a screenshot seed replays
// the same deck every time.
import { DECK_RECIPE, cardById } from './cards.js';

// mulberry32: a small, fast, deterministic generator.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(cards, random) {
  const pile = [...cards];
  for (let index = pile.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [pile[index], pile[other]] = [pile[other], pile[index]];
  }
  return pile;
}

export function buildDeck(random) {
  const cards = DECK_RECIPE.map((id) => ({ ...cardById(id), uid: 0 }));
  const shuffled = shuffle(cards, random);
  shuffled.forEach((card, index) => {
    card.uid = index + 1;
  });
  return shuffled;
}

// Draw up to `count` cards, reshuffling the discard pile when the deck runs
// dry. Returns the drawn cards; the piles are mutated in place. `random`
// defaults to Math.random; pass a seeded generator to keep a run replayable.
export function drawCards(deck, discard, count, random = Math.random) {
  const drawn = [];
  for (let n = 0; n < count; n += 1) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...shuffle(discard.splice(0, discard.length), random));
    }
    const card = deck.pop();
    if (card) drawn.push(card);
  }
  return drawn;
}
