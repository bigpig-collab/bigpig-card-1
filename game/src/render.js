// TIDEBOUND — the painter. One job: draw everything on the canvas.
// Title, table, win and loss screens; cards, HUD, panels, announcements,
// floating damage and the lantern flourish. It never changes game state.
import { GAME_SUBTITLE, GAME_TITLE, MAX_LIFE, SUITS, VIEW_H, VIEW_W } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_TABLE = 'table';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';
export const SCREEN_PAUSED = 'paused';

const GOLD = '#ffd166';
const GOLD_DIM = '#c9a227';
const INK_TEXT = '#1d2a30';
const PARCHMENT = '#f7ead0';
const PANEL = 'rgba(4, 34, 42, 0.82)';
const PANEL_LINE = 'rgba(201, 162, 39, 0.55)';

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', font = '600', family = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${font} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- suit shapes: colour AND shape, never text alone ------------------------
export function drawSuitShape(ctx, suitName, cx, cy, size, color) {
  const suit = SUITS[suitName];
  if (!suit) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const s = size;
  if (suit.shape === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.bezierCurveTo(cx + s * 0.42, cy - s * 0.1, cx + s * 0.34, cy + s * 0.34, cx, cy + s * 0.42);
    ctx.bezierCurveTo(cx - s * 0.34, cy + s * 0.34, cx - s * 0.42, cy - s * 0.1, cx, cy - s * 0.5);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.08);
    ctx.bezierCurveTo(cx + s * 0.18, cy + s * 0.1, cx + s * 0.12, cy + s * 0.3, cx, cy + s * 0.3);
    ctx.bezierCurveTo(cx - s * 0.12, cy + s * 0.3, cx - s * 0.18, cy + s * 0.1, cx, cy - s * 0.08);
    ctx.fill();
  } else if (suit.shape === 'wave') {
    for (let row = -1; row <= 1; row += 1) {
      ctx.beginPath();
      const y = cy + row * s * 0.26;
      ctx.moveTo(cx - s * 0.45, y);
      ctx.quadraticCurveTo(cx - s * 0.22, y - s * 0.24, cx, y);
      ctx.quadraticCurveTo(cx + s * 0.22, y + s * 0.24, cx + s * 0.45, y);
      ctx.stroke();
    }
  } else if (suit.shape === 'spiral') {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 4.4; a += 0.18) {
      const r = (a / (Math.PI * 4.4)) * s * 0.48;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.38, cy);
    ctx.lineTo(cx, cy + s * 0.5);
    ctx.lineTo(cx - s * 0.38, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.28);
    ctx.lineTo(cx + s * 0.18, cy);
    ctx.lineTo(cx, cy + s * 0.28);
    ctx.lineTo(cx - s * 0.18, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawLantern(ctx, x, y, size, lit, color = GOLD) {
  ctx.save();
  if (lit) {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 1.1);
    glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
    glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - size * 1.2, y - size * 1.2, size * 2.4, size * 2.4);
  }
  ctx.fillStyle = lit ? color : '#3a4a52';
  ctx.strokeStyle = lit ? '#8a6d1f' : '#22303a';
  ctx.lineWidth = 1.5;
  rr(ctx, x - size * 0.32, y - size * 0.42, size * 0.64, size * 0.84, size * 0.14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = lit ? '#fff3c4' : '#202b31';
  ctx.fillRect(x - size * 0.2, y - size * 0.26, size * 0.4, size * 0.5);
  ctx.fillStyle = lit ? '#8a6d1f' : '#22303a';
  ctx.fillRect(x - size * 0.16, y - size * 0.52, size * 0.32, size * 0.1);
  ctx.fillRect(x - size * 0.16, y + size * 0.42, size * 0.32, size * 0.1);
  ctx.restore();
}

function drawInkDrop(ctx, x, y, size, filled, color = '#7ec8e3') {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.55);
  ctx.bezierCurveTo(x + size * 0.42, y - size * 0.05, x + size * 0.36, y + size * 0.42, x, y + size * 0.42);
  ctx.bezierCurveTo(x - size * 0.36, y + size * 0.42, x - size * 0.42, y - size * 0.05, x, y - size * 0.55);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(126, 200, 227, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// --- cards ------------------------------------------------------------------
function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const affordable = opts.affordable !== false;
  const hover = opts.hover === true;
  ctx.save();
  if (hover) ctx.translate(0, -12);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = PARCHMENT;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = affordable ? suit.color : '#8a94a0';
  ctx.lineWidth = 3;
  ctx.stroke();
  rr(ctx, x + 4, y + 4, w - 8, h - 8, 8);
  ctx.strokeStyle = 'rgba(29,42,48,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Cost pips (ink drops) top-left.
  for (let n = 0; n < card.cost; n += 1) {
    drawInkDrop(ctx, x + 14 + n * 13, y + 16, 9, true, '#2f7ea8');
  }
  // Suit shape + big value centre.
  drawSuitShape(ctx, card.suit, x + w / 2, y + h * 0.36, Math.min(w * 0.42, 52), suit.color);
  text(ctx, String(card.value), x + w / 2, y + h * 0.62, Math.min(44, w * 0.36), INK_TEXT, 'center', '800', 'Georgia, serif');
  text(ctx, card.kind.toUpperCase(), x + w / 2, y + h * 0.76, 11, suit.dark, 'center', '800');
  text(ctx, card.name, x + w / 2, y + h * 0.86, card.name.length > 13 ? 10.5 : 12, INK_TEXT, 'center', '700');
  // Suit name small at the top, under the pips.
  text(ctx, card.suit.toUpperCase(), x + w / 2, y + 15, 10, suit.dark, 'center', '800');
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  rr(ctx, x, y, w, h, 9);
  ctx.fillStyle = '#12333d';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, x + 6, y + 6, w - 12, h - 12, 6);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawLantern(ctx, x + w / 2, y + h / 2, 26, true);
  ctx.restore();
}

function drawButton(ctx, box, label, enabled, sub = '') {
  ctx.save();
  rr(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.fillStyle = enabled ? '#b8860b' : '#3a4a52';
  ctx.fill();
  ctx.strokeStyle = enabled ? GOLD : '#55636c';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, box.x + box.w / 2, box.y + box.h / 2 - (sub ? 8 : 0), 17, enabled ? '#fff8e1' : '#9fb0ba', 'center', '800');
  if (sub) text(ctx, sub, box.x + box.w / 2, box.y + box.h / 2 + 13, 11, enabled ? '#ffe9b8' : '#8a99a3', 'center', '600');
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const layout = {
    handCards: [], endTurn: null, playButton: null, retryButton: null,
    nextDuelButton: null, restartButton: null, muteButton: null,
  };
  let particles = [];
  let lastScreen = '';

  function background(timeMs) {
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#082e3a');
    grad.addColorStop(0.55, '#0a3d47');
    grad.addColorStop(1, '#062a33');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Stars / drifting lantern sparks.
    ctx.save();
    for (let i = 0; i < 46; i += 1) {
      const sx = (i * 173.3) % VIEW_W;
      const sy = (i * 97.7) % 300;
      const tw = 0.35 + 0.3 * Math.sin(timeMs / 900 + i * 1.7);
      ctx.globalAlpha = Math.max(0.08, tw);
      ctx.fillStyle = '#ffe9b8';
      ctx.beginPath();
      ctx.arc(sx, sy, i % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Slow waves along the bottom.
    ctx.save();
    ctx.strokeStyle = 'rgba(126, 200, 227, 0.16)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 3; row += 1) {
      ctx.beginPath();
      for (let x = 0; x <= VIEW_W; x += 16) {
        const y = VIEW_H - 26 - row * 22 + Math.sin(x / 90 + timeMs / 1400 + row * 2) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function topBar(game) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 24, 30, 0.85)';
    ctx.fillRect(0, 0, VIEW_W, 56);
    ctx.fillStyle = PANEL_LINE;
    ctx.fillRect(0, 56, VIEW_W, 1);
    // Player life, top-left.
    drawLantern(ctx, 30, 28, 30, game.player.life > 0);
    text(ctx, String(game.player.life), 52, 30, 30, '#fff8e1', 'left', '800', 'Georgia, serif');
    text(ctx, 'WREN · YOU', 92, 20, 11, '#9fc6d4', 'left', '700');
    for (let n = 0; n < 10; n += 1) {
      drawInkDrop(ctx, 98 + n * 15, 40, 8, n < game.player.ink, '#7ec8e3');
    }
    if (game.player.block > 0) text(ctx, `🛡 ${game.player.block} block`, 92, 52, 11, '#bfe3ff', 'left', '700');
    // Baron life, top-right.
    text(ctx, 'INK BARON', VIEW_W - 92, 20, 11, '#e8a0a8', 'right', '700');
    for (let n = 0; n < 10; n += 1) {
      drawInkDrop(ctx, VIEW_W - 98 - n * 15, 40, 8, n < game.baron.ink, '#e08bb0');
    }
    if (game.baron.block > 0) text(ctx, `${game.baron.block} block 🛡`, VIEW_W - 92, 52, 11, '#f3c6d3', 'right', '700');
    text(ctx, String(game.baron.life), VIEW_W - 52, 30, 30, '#ffe1e6', 'right', '800', 'Georgia, serif');
    drawLantern(ctx, VIEW_W - 30, 28, 30, game.baron.life > 0, '#e08bb0');
    // Centre: title, duel score, turn.
    text(ctx, 'TIDEBOUND', VIEW_W / 2, 19, 19, GOLD, 'center', '800', 'Georgia, serif');
    const score = `DUEL ${game.duel}/3  ·  ${game.playerDuels} — ${game.baronDuels}  ·  TURN ${game.turn}`;
    text(ctx, score, VIEW_W / 2, 40, 12, '#d8ecf2', 'center', '700');
    ctx.restore();
  }

  function sidePanels(game, timeMs) {
    // Left: Lantern Log — goals, combo meter, deck, stats.
    ctx.save();
    ctx.fillStyle = PANEL;
    ctx.fillRect(0, 57, 196, VIEW_H - 57);
    ctx.fillStyle = PANEL_LINE;
    ctx.fillRect(196, 57, 1, VIEW_H - 57);
    text(ctx, 'LANTERN LOG', 14, 78, 13, GOLD, 'left', '800');
    text(ctx, 'WIN: take 2 duels.', 14, 100, 11, '#d8ecf2', 'left', '600');
    text(ctx, 'A duel ends at 0 lanterns.', 14, 116, 11, '#9fc6d4', 'left', '600');
    const goals = [
      { label: 'Win a duel', done: game.stats.duelsPlayed > 0 && game.playerDuels > 0 },
      { label: 'Land a Counter (+3)', done: game.stats.comboTypes.counter > 0 },
      { label: 'Land a Prism (3 suits)', done: game.stats.comboTypes.prism > 0 },
      { label: 'Reach a 4-card chain', done: game.stats.bestChain >= 4 },
    ];
    goals.forEach((goal, i) => {
      const y = 146 + i * 22;
      ctx.fillStyle = goal.done ? '#3fae6a' : 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.arc(22, y, 7, 0, Math.PI * 2);
      ctx.fill();
      if (goal.done) {
        ctx.strokeStyle = '#eafff1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, y);
        ctx.lineTo(21, y + 3);
        ctx.lineTo(26, y - 3);
        ctx.stroke();
      }
      text(ctx, goal.label, 34, y, 11.5, goal.done ? '#c2f2cf' : '#cfe3ea', 'left', '600');
    });
    // Combo meter: suits played this turn.
    text(ctx, 'COMBO — THIS TURN', 14, 252, 12, GOLD, 'left', '800');
    const suits = game.suitsPlayed;
    for (let i = 0; i < 5; i += 1) {
      const x = 26 + i * 32;
      const y = 282;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      if (i < suits.length) {
        ctx.fillStyle = SUITS[suits[i]].color;
        ctx.fill();
        drawSuitShape(ctx, suits[i], x, y, 15, '#ffffff');
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    const distinct = new Set(suits).size;
    text(ctx, suits.length === 0 ? 'Play cards to build a chain.' : `${suits.length} played · ${distinct} suits`, 14, 312, 11, '#cfe3ea', 'left', '600');
    text(ctx, 'Same suit ×2 = HARMONY +2', 14, 332, 11, '#9fc6d4', 'left', '600');
    text(ctx, '3 suits = PRISM draw + ink', 14, 348, 11, '#9fc6d4', 'left', '600');
    text(ctx, 'Beat his suit = COUNTER +3', 14, 364, 11, '#9fc6d4', 'left', '600');
    // Deck + stats.
    text(ctx, 'YOUR DECK', 14, 402, 12, GOLD, 'left', '800');
    text(ctx, `Deck ${game.player.deck.length} · Discard ${game.player.discard.length}`, 14, 424, 11.5, '#d8ecf2', 'left', '600');
    text(ctx, `Combos ${game.stats.combos} · Best chain ${game.stats.bestChain}`, 14, 444, 11.5, '#d8ecf2', 'left', '600');
    text(ctx, `Damage dealt ${game.stats.damageDealt}`, 14, 464, 11.5, '#d8ecf2', 'left', '600');
    text(ctx, 'RECENT', 14, 500, 12, GOLD, 'left', '800');
    game.log.slice(0, 6).forEach((line, i) => {
      text(ctx, line.length > 26 ? line.slice(0, 25) + '…' : line, 14, 522 + i * 18, 10.5, i === 0 ? '#ffe9b8' : '#9fc6d4', 'left', '600');
    });
    text(ctx, '1–5 play · Space end turn', 14, 648, 11, '#7fa8b8', 'left', '600');
    text(ctx, 'P pause · M mute · R restart', 14, 666, 11, '#7fa8b8', 'left', '600');
    // Right: the Baron.
    ctx.fillStyle = PANEL;
    ctx.fillRect(VIEW_W - 196, 57, 196, VIEW_H - 57);
    ctx.fillStyle = PANEL_LINE;
    ctx.fillRect(VIEW_W - 196, 57, 1, VIEW_H - 57);
    text(ctx, 'THE INK BARON', VIEW_W - 182, 78, 13, '#f3c6d3', 'left', '800');
    // Portrait: hooded ink blot.
    ctx.save();
    ctx.beginPath();
    ctx.arc(VIEW_W - 98, 132, 44, 0, Math.PI * 2);
    ctx.fillStyle = '#1c0f2e';
    ctx.fill();
    ctx.strokeStyle = '#8a5a9e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8d5f5';
    ctx.beginPath();
    ctx.arc(VIEW_W - 114, 126, 5, 0, Math.PI * 2);
    ctx.arc(VIEW_W - 82, 126, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8d5f5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(VIEW_W - 118, 148);
    ctx.quadraticCurveTo(VIEW_W - 98, 158, VIEW_W - 78, 148);
    ctx.stroke();
    ctx.restore();
    text(ctx, 'Collector of stolen light', VIEW_W - 98, 192, 11, '#c9a8d8', 'center', '600');
    // Telegraph.
    text(ctx, 'HE REACHES FOR…', VIEW_W - 182, 224, 12, GOLD, 'left', '800');
    if (game.telegraph) {
      const suit = SUITS[game.telegraph];
      ctx.beginPath();
      ctx.arc(VIEW_W - 98, 262, 30, 0, Math.PI * 2);
      ctx.fillStyle = suit.color;
      ctx.fill();
      drawSuitShape(ctx, game.telegraph, VIEW_W - 98, 262, 34, '#ffffff');
      text(ctx, game.telegraph.toUpperCase(), VIEW_W - 98, 308, 15, suit.light, 'center', '800');
      text(ctx, 'Play the suit that beats it', VIEW_W - 98, 328, 11, '#d8ecf2', 'center', '600');
      text(ctx, 'for COUNTER +3.', VIEW_W - 98, 344, 11, '#d8ecf2', 'center', '600');
    } else {
      text(ctx, 'Watching…', VIEW_W - 98, 262, 14, '#9fc6d4', 'center', '600');
    }
    const hint = game.phase === 'player'
      ? (game.telegraph ? `The Baron reaches for ${game.telegraph}…` : 'The Baron watches you.')
      : 'The Baron plays his hand…';
    wrapText(hint, VIEW_W - 182, 380, 168, 15, 12, '#ffe9b8');
    text(ctx, `His hand: ${game.baron.hand.length} cards`, VIEW_W - 182, 440, 11.5, '#d8ecf2', 'left', '600');
    text(ctx, `His block: ${game.baron.block}`, VIEW_W - 182, 460, 11.5, '#d8ecf2', 'left', '600');
    text(ctx, game.baron.reflect ? 'Mirror armed — hits bounce!' : '', VIEW_W - 182, 480, 11.5, '#ffd166', 'left', '700');
    text(ctx, 'CYCLE', VIEW_W - 182, 522, 12, GOLD, 'left', '800');
    text(ctx, 'Ember beats Gale', VIEW_W - 182, 544, 11.5, '#ffb3a7', 'left', '600');
    text(ctx, 'Gale beats Tide', VIEW_W - 182, 562, 11.5, '#c2f2cf', 'left', '600');
    text(ctx, 'Tide beats Ember', VIEW_W - 182, 580, 11.5, '#bfe3ff', 'left', '600');
    text(ctx, 'Stone breaks ties', VIEW_W - 182, 598, 11.5, '#ffe9b8', 'left', '600');
    ctx.restore();
  }

  function wrapText(str, x, y, maxW, lineH, size, color) {
    const words = str.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      ctx.font = `600 ${size}px system-ui, sans-serif`;
      if (ctx.measureText(test).width > maxW && line) {
        text(ctx, line, x, cy, size, color, 'left', '600');
        line = word;
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line) text(ctx, line, x, cy, size, color, 'left', '600');
  }

  function drawTable(game, view) {
    layout.handCards = [];
    // Baron's face-down hand.
    const backs = game.baron.hand.length;
    const backW = 62;
    const backH = 90;
    const totalW = backs * (backW + 8) - 8;
    let bx = 640 - totalW / 2;
    for (let i = 0; i < backs; i += 1) {
      drawCardBack(ctx, bx, 70, backW, backH);
      bx += backW + 8;
    }
    text(ctx, 'THE BARON’S HAND', 640, 178, 11, '#8fa8b8', 'center', '700');
    // Centre: played cards + announcement.
    const played = game.played;
    const cardW = 104;
    const cardH = 146;
    const playedW = played.length * (cardW + 12) - 12;
    let px = 640 - Math.max(0, playedW) / 2;
    played.forEach((entry) => {
      const progress = Math.min(1, entry.ageMs / 320);
      const fromY = entry.by === 'player' ? 620 : 70;
      const y = fromY + (260 - fromY) * progress;
      const alpha = 0.3 + 0.7 * progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      const scaleX = 0.6 + 0.4 * progress;
      ctx.translate(px + cardW / 2, y + cardH / 2);
      ctx.scale(scaleX, 1);
      ctx.translate(-(px + cardW / 2), -(y + cardH / 2));
      drawCardFace(ctx, entry.card, px, y, cardW, cardH, { affordable: true });
      ctx.restore();
      if (entry.bonus > 0) {
        text(ctx, `+${entry.bonus}`, px + cardW / 2, y + cardH + 16, 14, GOLD, 'center', '800');
      }
      px += cardW + 12;
    });
    if (played.length === 0) {
      text(ctx, 'Played cards land here.', 640, 330, 13, 'rgba(216,236,242,0.5)', 'center', '600');
    }
    // Announcement banner.
    if (game.announcement) {
      const age = game.announcement.ageMs;
      const alpha = age < 1400 ? 1 : Math.max(0, 1 - (age - 1400) / 600);
      const scale = age < 160 ? 1.25 - (0.25 * age) / 160 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(640, 218);
      ctx.scale(scale, scale);
      ctx.fillStyle = 'rgba(3, 24, 30, 0.88)';
      ctx.font = '800 22px Georgia, serif';
      const w = Math.max(280, ctx.measureText(game.announcement.text).width + 90);
      rr(ctx, -w / 2, -30, w, 60, 12);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, game.announcement.text, 0, -6, 22, GOLD, 'center', '800', 'Georgia, serif');
      if (game.announcement.sub) text(ctx, game.announcement.sub, 0, 16, 12, '#ffe9b8', 'center', '600');
      ctx.restore();
    }
    // Floating damage numbers.
    for (const floater of game.floaters) {
      const age = floater.ageMs;
      const alpha = Math.max(0, 1 - age / 1000);
      ctx.save();
      ctx.globalAlpha = alpha;
      text(ctx, floater.text, floater.x, floater.y - age * 0.06, 30, floater.color, 'center', '800', 'Georgia, serif');
      ctx.restore();
    }
    // Turn banner.
    if (game.phase === 'baron') {
      text(ctx, 'THE BARON PLAYS…', 640, 540, 14, '#f3c6d3', 'center', '800');
    } else if (game.duelOver) {
      const won = game.duelOver === 'player';
      text(ctx, won ? 'DUEL WON — the isles cheer!' : 'DUEL LOST — the tide takes a lantern.', 640, 540, 16, won ? GOLD : '#e8a0a8', 'center', '800', 'Georgia, serif');
    } else {
      text(ctx, 'YOUR TURN — play a card, or end the turn.', 640, 540, 14, '#d8ecf2', 'center', '700');
    }
    // Player hand, fanned.
    const hand = game.player.hand;
    const hw = 116;
    const hh = 156;
    const gap = 8;
    const handW = hand.length * (hw + gap) - gap;
    let hx = 640 - handW / 2;
    const hy = 596;
    hand.forEach((card, index) => {
      const hovered = view.mouse.x >= hx && view.mouse.x <= hx + hw && view.mouse.y >= hy - 12 && view.mouse.y <= hy + hh;
      const affordable = game.phase === 'player' && game.player.ink >= card.cost && !game.duelOver;
      layout.handCards.push({ x: hx, y: hy - (hovered ? 12 : 0), w: hw, h: hh, index });
      ctx.save();
      const rot = (index - (hand.length - 1) / 2) * 0.035;
      ctx.translate(hx + hw / 2, hy + hh / 2);
      ctx.rotate(rot);
      ctx.translate(-(hx + hw / 2), -(hy + hh / 2));
      if (!affordable) ctx.globalAlpha = 0.72;
      drawCardFace(ctx, card, hx, hy, hw, hh, { affordable, hover: hovered });
      ctx.restore();
      text(ctx, String(index + 1), hx + hw / 2, hy + hh + 14, 11, hovered ? GOLD : '#7fa8b8', 'center', '700');
      hx += hw + gap;
    });
    // End Turn button, at the foot of the Baron's panel.
    const endBox = { x: VIEW_W - 196 + 13, y: 700, w: 170, h: 52 };
    const canEnd = game.phase === 'player' && !game.duelOver;
    drawButton(ctx, endBox, 'END TURN', canEnd, 'Space');
    layout.endTurn = endBox;
    // Bottom hint strip.
    text(ctx, 'Click a card or press 1–5 to play it · Combos: same suit ×2 Harmony · 3 suits Prism · beat his suit Counter', 640, 788, 11.5, '#7fa8b8', 'center', '600');
  }

  function drawTitle(game, view) {
    layout.handCards = [];
    layout.endTurn = null;
    // Rising lanterns.
    for (let i = 0; i < 14; i += 1) {
      const x = 60 + ((i * 89) % 1160);
      const cycle = (view.timeMs / 9000 + i * 0.37) % 1;
      const y = 760 - cycle * 700;
      const alpha = cycle < 0.1 ? cycle / 0.1 : cycle > 0.85 ? (1 - cycle) / 0.15 : 1;
      ctx.save();
      ctx.globalAlpha = 0.35 * alpha;
      drawLantern(ctx, x, y, 22 + (i % 3) * 6, true);
      ctx.restore();
    }
    text(ctx, 'TIDEBOUND', 640, 150, 84, GOLD, 'center', '800', 'Georgia, serif');
    text(ctx, GAME_SUBTITLE, 640, 205, 26, '#d8ecf2', 'center', '600', 'Georgia, serif');
    text(ctx, 'You are Wren, keeper of the last lantern-light. The Ink Baron steals light —', 640, 248, 16, '#bfe3ff', 'center', '600');
    text(ctx, 'outplay him, card by card, and keep the isles lit.', 640, 270, 16, '#bfe3ff', 'center', '600');
    // Play button.
    const playBox = { x: 640 - 130, y: 310, w: 260, h: 64 };
    drawButton(ctx, playBox, '▶  PLAY', true, 'Click or press Enter');
    layout.playButton = playBox;
    // How to play panel.
    ctx.save();
    ctx.fillStyle = PANEL;
    rr(ctx, 130, 410, 470, 300, 14);
    ctx.fill();
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, 'HOW TO PLAY', 160, 440, 15, GOLD, 'left', '800');
    const lines = [
      '• First to win 2 duels takes the match. A duel ends at 0 lanterns.',
      '• Each turn: draw 2 cards, gain 1 ink (max 10). Play cards for ink.',
      '• Strike deals damage · Guard gains block · Trick draws, steals, reflects.',
      '• Same suit twice in a turn: HARMONY +2.',
      '• Three different suits in a turn: PRISM — draw 1, refund 1 ink.',
      '• Play the suit that beats the Baron’s telegraph: COUNTER +3.',
      '• The Baron shows his next suit — read him, then counter him.',
    ];
    lines.forEach((line, i) => text(ctx, line, 160, 472 + i * 30, 13.5, '#d8ecf2', 'left', '600'));
    ctx.restore();
    // Deck preview: one card of each suit.
    ctx.save();
    ctx.fillStyle = PANEL;
    rr(ctx, 680, 410, 470, 300, 14);
    ctx.fill();
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, 'YOUR DECK — FOUR SUITS', 710, 440, 15, GOLD, 'left', '800');
    const preview = [
      { id: 'p1', name: 'Cinder Fang', suit: 'Ember', kind: 'Strike', cost: 2, value: 4 },
      { id: 'p2', name: 'Deep Current', suit: 'Tide', kind: 'Strike', cost: 3, value: 5 },
      { id: 'p3', name: 'Storm Kite', suit: 'Gale', kind: 'Strike', cost: 3, value: 6 },
      { id: 'p4', name: 'Granite Bastion', suit: 'Stone', kind: 'Guard', cost: 2, value: 6 },
    ];
    preview.forEach((card, i) => {
      drawCardFace(ctx, card, 706 + i * 112, 470, 100, 140, { affordable: true });
    });
    text(ctx, 'Ember beats Gale · Gale beats Tide · Tide beats Ember · Stone is neutral', 915, 660, 12.5, '#ffe9b8', 'center', '600');
    text(ctx, 'Suits are told apart by colour AND shape — never by text alone.', 915, 684, 12, '#9fc6d4', 'center', '600');
    ctx.restore();
    text(ctx, 'An original game — no borrowed names, art or rules. · 1–5 play · Space end turn · P pause · M mute', 640, 748, 12, '#7fa8b8', 'center', '600');
  }

  function drawEnd(game, view, won) {
    // Golden (win) or deep-ink (loss) wash over a dimmed table.
    ctx.save();
    ctx.fillStyle = won ? 'rgba(20, 26, 4, 0.72)' : 'rgba(6, 10, 28, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
    if (won) {
      // Lantern flourish.
      for (let i = 0; i < 22; i += 1) {
        const x = 60 + ((i * 53) % 1160);
        const cycle = (view.timeMs / 6000 + i * 0.29) % 1;
        const y = 780 - cycle * 720;
        ctx.save();
        ctx.globalAlpha = 0.9;
        drawLantern(ctx, x + Math.sin(view.timeMs / 800 + i) * 12, y, 20 + (i % 4) * 5, true);
        ctx.restore();
      }
      text(ctx, 'VICTORY', 640, 190, 76, GOLD, 'center', '800', 'Georgia, serif');
      text(ctx, 'The Lantern Isles keep their light.', 640, 248, 24, '#ffe9b8', 'center', '600', 'Georgia, serif');
    } else {
      text(ctx, 'DEFEAT', 640, 190, 76, '#e8a0a8', 'center', '800', 'Georgia, serif');
      text(ctx, 'The Baron keeps the tide.', 640, 248, 24, '#f3c6d3', 'center', '600', 'Georgia, serif');
    }
    const score = `Duels  ${game.playerDuels} — ${game.baronDuels}`;
    text(ctx, score, 640, 300, 22, '#fff8e1', 'center', '800', 'Georgia, serif');
    // Stats grid.
    const stats = [
      ['Cards played', String(game.stats.cardsPlayed)],
      ['Damage dealt', String(game.stats.damageDealt)],
      ['Combos landed', String(game.stats.combos)],
      ['Best chain', `${game.stats.bestChain} cards`],
      ['Duels played', String(game.stats.duelsPlayed)],
    ];
    ctx.save();
    ctx.fillStyle = PANEL;
    rr(ctx, 440, 340, 400, 40 + stats.length * 34, 14);
    ctx.fill();
    ctx.strokeStyle = PANEL_LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    stats.forEach(([label, value], i) => {
      text(ctx, label, 470, 368 + i * 34, 14, '#cfe3ea', 'left', '600');
      text(ctx, value, 810, 368 + i * 34, 14, GOLD, 'right', '800');
    });
    ctx.restore();
    const againBox = { x: 640 - 130, y: 590, w: 260, h: 60 };
    drawButton(ctx, againBox, won ? 'PLAY AGAIN' : 'TRY AGAIN', true, 'Click or press Enter');
    layout.retryButton = againBox;
    text(ctx, won ? 'Wren’s lantern burns on. The Baron will be back — keep it lit.' : 'The isles go dark… for now. Shuffle up and take the light back.', 640, 690, 14, '#9fc6d4', 'center', '600');
  }

  function drawPaused() {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 18, 24, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', 640, 360, 60, GOLD, 'center', '800', 'Georgia, serif');
    text(ctx, 'Press P or click to carry on.', 640, 420, 16, '#d8ecf2', 'center', '600');
    ctx.restore();
  }

  function spawnWinParticles() {
    if (particles.length === 0) {
      for (let i = 0; i < 40; i += 1) {
        particles.push({ x: 200 + Math.random() * 880, y: 700 + Math.random() * 80, vy: 20 + Math.random() * 40, size: 14 + Math.random() * 18, phase: Math.random() * 6 });
      }
    }
  }

  return {
    layout,
    draw(game, screen, view) {
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      if (screen !== lastScreen) {
        lastScreen = screen;
        if (screen === SCREEN_WIN) spawnWinParticles();
      }
      background(view.timeMs);
      if (screen === SCREEN_TITLE) {
        drawTitle(game, view);
        return;
      }
      topBar(game);
      sidePanels(game, view.timeMs);
      if (screen === SCREEN_WIN) drawEnd(game, view, true);
      else if (screen === SCREEN_LOSS) drawEnd(game, view, false);
      else {
        drawTable(game, view);
        if (screen === SCREEN_PAUSED) drawPaused();
      }
    },
  };
}
