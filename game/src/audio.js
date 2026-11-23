// BRASS BAZAAR — synthesised sound. One job: every blip and chime, made with
// WebAudio oscillators. No audio files, no network, nothing to load.
let ctx = null;
let muted = false;

function audioCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function setMuted(m) {
  muted = m;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  // A coin flicked onto the counter.
  play() { tone(880, 0.09, 'triangle', 0.14); tone(1318, 0.12, 'sine', 0.08, 0.05); },
  // Paper card drawn from the deck.
  draw() { tone(420, 0.06, 'sine', 0.07); tone(560, 0.07, 'sine', 0.06, 0.04); },
  // A sale lands: the till rings.
  sell() { tone(1046, 0.1, 'square', 0.06); tone(1568, 0.16, 'sine', 0.1, 0.07); },
  // A charm holds: a soft wooden knock.
  charm() { tone(330, 0.12, 'triangle', 0.12); tone(247, 0.14, 'triangle', 0.1, 0.06); },
  // A combo fires: a rising little arpeggio.
  combo() { tone(523, 0.09, 'triangle', 0.12); tone(659, 0.09, 'triangle', 0.12, 0.07); tone(784, 0.14, 'triangle', 0.12, 0.14); },
  // Rush Hour: the crowd roars in.
  rush() { tone(392, 0.12, 'sawtooth', 0.05); tone(523, 0.12, 'sawtooth', 0.05, 0.08); tone(659, 0.2, 'triangle', 0.12, 0.16); },
  // The turn bell.
  turn() { tone(698, 0.18, 'sine', 0.1); },
  // A duel won: the market erupts.
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
  },
  // A duel lost: a low descending sigh.
  lose() { tone(392, 0.25, 'sine', 0.1); tone(311, 0.3, 'sine', 0.1, 0.18); tone(233, 0.4, 'sine', 0.09, 0.36); },
  // A button clicked.
  click() { tone(700, 0.05, 'square', 0.05); },
};
