// TIDEBOUND — synthesised sound. One job: WebAudio bleeps, no audio files.
// Everything is an oscillator through a gain envelope; nothing is fetched.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, durMs, type, volume, slideTo = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, now + durMs / 1000);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    playCard() {
      tone(520, 90, 'triangle', 0.12, 780);
    },
    strike() {
      tone(180, 160, 'sawtooth', 0.1, 90);
    },
    guard() {
      tone(340, 140, 'sine', 0.12, 420);
    },
    trick() {
      tone(880, 120, 'sine', 0.09, 1320);
    },
    combo() {
      tone(660, 110, 'triangle', 0.12, 660);
      setTimeout(() => tone(990, 140, 'triangle', 0.12, 990), 90);
    },
    turn() {
      tone(440, 80, 'sine', 0.07, 440);
    },
    win() {
      [523, 659, 784, 1046].forEach((freq, index) => {
        setTimeout(() => tone(freq, 260, 'triangle', 0.12), index * 130);
      });
    },
    lose() {
      [392, 330, 262, 196].forEach((freq, index) => {
        setTimeout(() => tone(freq, 300, 'sine', 0.1), index * 150);
      });
    },
  };
}
