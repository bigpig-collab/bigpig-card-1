// BRASS BAZAAR — the renderer. One job: draw everything on one canvas.
// Top bar (win/lose + score), side panels (goals, crowd, telegraph, log),
// the table (both hands, played cards, floaters), and the title/win/loss
// screens. Colour AND shape code every stall, never text alone.
import {
  CANVAS_H,
  CANVAS_W,
  CROWD_RUSH_AT,
  DUELS_TO_WIN_MATCH,
  GAME_SUBTITLE,
  GAME_TITLE,
  PLAYER_NAME,
  RIVAL_NAME,
  RIVAL_PHASES,
  STALLS,
  STALL_ORDER,
} from './config.js';

const CARD_W = 140;
const CARD_H = 196;
const BACK_W = 84;
const BACK_H = 118;
const HAND_Y = 556;
const PLAYED_Y = 308;
const BACKS_Y = 172;

// Live hit-test layout, rebuilt every frame for input.js.
export const layout = { cards: [], buttons: [] };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- stall shapes -----------------------------------------------------------
export function drawStallShape(ctx, shape, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size / 12);
  if (shape === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? size : size * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.75, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.75, cy);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'cog') {
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillRect(-size * 0.14, -size * 1.15, size * 0.28, size * 0.42);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'leaf') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.55, size, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f7ead0';
    ctx.lineWidth = Math.max(2, size / 10);
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, cy + size * 0.55);
    ctx.lineTo(cx + size * 0.4, cy - size * 0.55);
    ctx.stroke();
  }
  ctx.restore();
}

function coinIcon(ctx, x, y, r, label) {
  ctx.save();
  ctx.fillStyle = '#e0a83c';
  ctx.strokeStyle = '#7a5510';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a5510';
  ctx.font = `bold ${Math.round(r)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

// --- cards ------------------------------------------------------------------
function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const stall = STALLS[card.stall];
  const playable = opts.playable !== false;
  const hovered = !!opts.hovered;
  ctx.save();
  if (hovered) ctx.translate(0, -10);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = playable ? '#f7ead0' : '#cbb98f';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 4;
  ctx.strokeStyle = stall.color;
  ctx.stroke();
  // Cost pips (coins) across the top.
  for (let i = 0; i < card.cost; i += 1) {
    coinIcon(ctx, x + 16 + i * 20, y + 16, 9, '');
  }
  // Kind tag.
  text(ctx, card.kind.toUpperCase(), x + w - 10, y + 16, 11, stall.dark, 'bold', 'right');
  // Big stall shape + big value numeral in the middle.
  drawStallShape(ctx, stall.shape, x + w / 2, y + h * 0.42, 30, stall.color);
  text(ctx, String(card.value), x + w / 2, y + h * 0.42, 40, '#2a1a2e', 'bold', 'center');
  // Name band.
  ctx.fillStyle = stall.dark;
  roundRect(ctx, x + 8, y + h - 62, w - 16, 24, 6);
  ctx.fill();
  text(ctx, card.name, x + w / 2, y + h - 50, 13, '#f7ead0', 'bold', 'center');
  // Flavour line, two lines max.
  ctx.fillStyle = '#4a3444';
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  const words = card.text.split(' ');
  let line = '';
  let ly = y + h - 26;
  for (const word of words) {
    if ((line + ' ' + word).trim().length > 22) {
      ctx.fillText(line.trim(), x + w / 2, ly);
      line = word;
      ly += 12;
      if (ly > y + h - 8) break;
    } else line += ' ' + word;
  }
  if (line.trim()) ctx.fillText(line.trim(), x + w / 2, ly);
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#4a2340';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e0a83c';
  ctx.stroke();
  drawStallShape(ctx, 'cog', x + w / 2, y + h / 2, 20, '#e0a83c');
  ctx.restore();
}

// --- table pieces -----------------------------------------------------------
function drawTopBar(ctx, game) {
  ctx.fillStyle = 'rgba(20, 10, 18, 0.85)';
  ctx.fillRect(0, 0, CANVAS_W, 64);
  ctx.fillStyle = '#e0a83c';
  ctx.fillRect(0, 64, CANVAS_W, 3);
  text(ctx, GAME_TITLE, 16, 24, 26, '#f7ead0', 'bold');
  text(ctx, GAME_SUBTITLE, 16, 48, 13, '#e0a83c', 'normal');
  text(ctx, `WIN: take ${DUELS_TO_WIN_MATCH} duels   •   LOSE: your patrons hit 0`, 640, 24, 15, '#ffd166', 'bold', 'center');
  text(ctx, `DUEL ${game.duel}  •  TURN ${game.turn}`, 640, 48, 13, '#cbb98f', 'normal', 'center');
  // Match score as duels won.
  const px = 1080;
  text(ctx, `YOU ${game.playerDuels} — ${game.rivalDuels} ZINNIA`, px, 24, 18, '#f7ead0', 'bold', 'center');
  const phase = RIVAL_PHASES[Math.min(game.duel - 1, RIVAL_PHASES.length - 1)];
  text(ctx, phase.title, px, 48, 13, '#e0a83c', 'normal', 'center');
}

function drawSidePanel(ctx, game) {
  // Left: your stall — goals checklist, crowd meter, stalls played.
  ctx.fillStyle = 'rgba(20, 10, 18, 0.7)';
  roundRect(ctx, 8, 76, 188, 470, 10);
  ctx.fill();
  text(ctx, 'YOUR STALL', 20, 96, 14, '#e0a83c', 'bold');
  const goals = [
    [`Win duel ${game.duel}`, game.duelWinner === 'player'],
    [`Take ${DUELS_TO_WIN_MATCH} duels`, game.playerDuels >= DUELS_TO_WIN_MATCH],
    ['Land a Grand Bazaar', game.bazaarDone || game.stats.combos > 0],
  ];
  let gy = 124;
  for (const [label, done] of goals) {
    ctx.fillStyle = done ? '#58b368' : '#f7ead0';
    ctx.beginPath();
    ctx.arc(28, gy, 7, 0, Math.PI * 2);
    ctx.fill();
    if (done) {
      ctx.strokeStyle = '#2a1a2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, gy);
      ctx.lineTo(27, gy + 3);
      ctx.lineTo(33, gy - 3);
      ctx.stroke();
    }
    text(ctx, label, 42, gy, 12, done ? '#8fd6a0' : '#f7ead0', 'normal');
    gy += 24;
  }
  // Crowd meter.
  text(ctx, 'CROWD', 20, 216, 13, '#e0a83c', 'bold');
  const cw = 164;
  ctx.fillStyle = '#3d2436';
  roundRect(ctx, 20, 228, cw, 16, 8);
  ctx.fill();
  ctx.fillStyle = game.rushHour ? '#e5484d' : '#e0a83c';
  const fillW = Math.max(6, (game.crowd / CROWD_RUSH_AT) * cw);
  roundRect(ctx, 20, 228, fillW, 16, 8);
  ctx.fill();
  text(ctx, game.rushHour ? 'RUSH HOUR! Next Sell +4' : `${game.crowd}/${CROWD_RUSH_AT} to Rush Hour`, 20, 256, 12, '#ffd166', 'bold');
  // Stalls played this turn (combo meter).
  text(ctx, 'STALLS THIS TURN', 20, 286, 13, '#e0a83c', 'bold');
  STALL_ORDER.forEach((stall, i) => {
    const played = game.stallsThisTurn.includes(stall);
    drawStallShape(ctx, STALLS[stall].shape, 32 + i * 42, 308, played ? 15 : 11, played ? STALLS[stall].color : '#5a4256');
  });
  text(ctx, `Chain x${game.chain}  •  Best x${game.stats.bestChain}`, 20, 336, 12, '#cbb98f', 'normal');
  text(ctx, `Combos landed: ${game.stats.combos}`, 20, 360, 12, '#cbb98f', 'normal');
  // Log.
  text(ctx, 'MARKET TALK', 20, 396, 13, '#e0a83c', 'bold');
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'left';
  let ly = 418;
  for (const line of game.log.slice(0, 6)) {
    ctx.fillStyle = '#d8c8b8';
    const words = line.split(' ');
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > 26) {
        ctx.fillText(cur.trim(), 20, ly);
        ly += 15;
        cur = w;
      } else cur += ' ' + w;
    }
    if (cur.trim()) { ctx.fillText(cur.trim(), 20, ly); ly += 15; }
    if (ly > 520) break;
  }
}

function drawRivalPanel(ctx, game) {
  // Right: Zinnia — telegraph, her phase, her guard.
  ctx.fillStyle = 'rgba(20, 10, 18, 0.7)';
  roundRect(ctx, 1084, 76, 188, 470, 10);
  ctx.fill();
  text(ctx, RIVAL_NAME.toUpperCase(), 1096, 96, 14, '#e0a83c', 'bold');
  const phase = RIVAL_PHASES[Math.min(game.duel - 1, RIVAL_PHASES.length - 1)];
  text(ctx, phase.title, 1096, 118, 12, '#cbb98f', 'normal');
  text(ctx, 'SHE REACHES FOR…', 1096, 152, 12, '#ffd166', 'bold');
  const tele = STALLS[game.telegraph.stall];
  drawStallShape(ctx, tele.shape, 1130, 190, 26, tele.color);
  text(ctx, tele.name.toUpperCase(), 1170, 190, 20, tele.color, 'bold');
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillStyle = '#d8c8b8';
  ctx.textAlign = 'left';
  const words = game.telegraph.text.split(' ');
  let line = '';
  let ty = 226;
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 24) {
      ctx.fillText(line.trim(), 1096, ty);
      line = w;
      ty += 15;
    } else line += ' ' + w;
  }
  if (line.trim()) ctx.fillText(line.trim(), 1096, ty);
  text(ctx, 'Beat it: play the stall', 1096, 286, 12, '#8fd6a0', 'normal');
  text(ctx, 'that undercuts hers (+3).', 1096, 304, 12, '#8fd6a0', 'normal');
  // Cycle reminder.
  text(ctx, 'SPICE › SILK › BRASS', 1096, 336, 12, '#cbb98f', 'normal');
  text(ctx, 'LEAF › SPICE', 1096, 354, 12, '#cbb98f', 'normal');
  text(ctx, `Her guard: ${game.rival.guard}`, 1096, 388, 12, '#f7ead0', 'normal');
  text(ctx, game.rival.reflect ? 'Mirror Scarf is UP — hits bounce!' : '', 1096, 410, 12, '#ffd166', 'bold');
  text(ctx, `Her deck: ${game.rival.pile.cards.length} cards`, 1096, 434, 12, '#cbb98f', 'normal');
  text(ctx, `Your deck: ${game.player.pile.cards.length} cards`, 1096, 456, 12, '#cbb98f', 'normal');
}

function drawPatronRow(ctx, game) {
  // Big life totals under the top bar, both sides.
  text(ctx, PLAYER_NAME, 220, 96, 15, '#f7ead0', 'bold');
  text(ctx, `${game.player.patrons}`, 220, 132, 40, '#ffd166', 'bold');
  text(ctx, 'PATRONS', 280, 132, 12, '#cbb98f', 'normal');
  if (game.player.guard > 0) text(ctx, `Guard ${game.player.guard}`, 220, 162, 13, '#8fd6a0', 'bold');
  if (game.player.reflect) text(ctx, 'Mirror up!', 220, 182, 13, '#ffd166', 'bold');
  text(ctx, 'COINS', 420, 96, 12, '#cbb98f', 'normal');
  for (let i = 0; i < game.player.maxCoins; i += 1) {
    coinIcon(ctx, 432 + i * 24, 128, 10, '');
    if (i >= game.player.coins) {
      ctx.fillStyle = 'rgba(42,26,46,0.65)';
      ctx.beginPath();
      ctx.arc(432 + i * 24, 128, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  text(ctx, `${game.player.coins}/${game.player.maxCoins}`, 420, 158, 13, '#ffd166', 'bold');

  text(ctx, RIVAL_NAME, 1060, 96, 15, '#f7ead0', 'bold', 'right');
  text(ctx, `${game.rival.patrons}`, 1060, 132, 40, '#e5484d', 'bold', 'right');
  text(ctx, 'PATRONS', 1000, 132, 12, '#cbb98f', 'normal', 'right');
  if (game.rival.guard > 0) text(ctx, `Guard ${game.rival.guard}`, 1060, 162, 13, '#8fd6a0', 'bold', 'right');
  text(ctx, 'COINS', 860, 96, 12, '#cbb98f', 'normal', 'right');
  for (let i = 0; i < game.rival.maxCoins; i += 1) {
    coinIcon(ctx, 848 - i * 24, 128, 10, '');
    if (i >= game.rival.coins) {
      ctx.fillStyle = 'rgba(42,26,46,0.65)';
      ctx.beginPath();
      ctx.arc(848 - i * 24, 128, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  text(ctx, `${game.rival.coins}/${game.rival.maxCoins}`, 860, 158, 13, '#e5484d', 'bold', 'right');
}

function drawButton(ctx, id, x, y, w, h, label, enabled = true) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = enabled ? '#e0a83c' : '#5a4256';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7a5510';
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 17, '#2a1a2e', 'bold', 'center');
  ctx.restore();
  layout.buttons.push({ id, x, y, w, h });
}

function drawTable(ctx, game, input, now) {
  layout.cards = [];
  layout.buttons = [];
  // Warm bazaar backdrop: plum night, striped awnings, hanging lamps.
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#2a1a2e');
  grad.addColorStop(0.5, '#3d1f2b');
  grad.addColorStop(1, '#241428');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Awning stripes along the top.
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#7a2e2e' : '#f7ead0';
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.moveTo(i * 80, 67);
    ctx.lineTo(i * 80 + 40, 67);
    ctx.lineTo(i * 80 + 52, 96);
    ctx.lineTo(i * 80 + 12, 96);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Hanging lamps.
  for (let i = 0; i < 7; i += 1) {
    const lx = 120 + i * 170;
    ctx.strokeStyle = '#e0a83c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 67);
    ctx.lineTo(lx, 108);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(lx, 116, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  drawTopBar(ctx, game);
  drawSidePanel(ctx, game);
  drawRivalPanel(ctx, game);
  drawPatronRow(ctx, game);

  // Rival hand: face-down backs.
  const backs = game.rival.hand.length;
  const bw = backs * (BACK_W + 10) - 10;
  for (let i = 0; i < backs; i += 1) {
    drawCardBack(ctx, 640 - bw / 2 + i * (BACK_W + 10), BACKS_Y, BACK_W, BACK_H);
  }
  text(ctx, `Zinnia's hand — ${backs} cards`, 640, BACKS_Y - 10, 12, '#cbb98f', 'normal', 'center');

  // Centre: played cards this turn.
  ctx.fillStyle = 'rgba(20, 10, 18, 0.45)';
  roundRect(ctx, 210, PLAYED_Y - 14, 860, 216, 14);
  ctx.fill();
  // The combo announcement takes the counter's header line while it is live,
  // so it never overlaps the rival's card backs above the panel.
  if (game.announcement) {
    const a = game.announcement;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, a.t - 1.6) / 0.6);
    text(ctx, a.text, 640, PLAYED_Y + 4, a.big ? 24 : 18, '#ffd166', 'bold', 'center');
    ctx.restore();
  } else {
    text(ctx, 'THE COUNTER', 640, PLAYED_Y + 4, 12, '#e0a83c', 'bold', 'center');
  }
  const played = game.played.slice(-6);
  const pw = played.length * (CARD_W * 0.62 + 12) - 12;
  played.forEach((entry, i) => {
    const x = 640 - pw / 2 + i * (CARD_W * 0.62 + 12);
    const scale = 0.62;
    ctx.save();
    ctx.translate(x, PLAYED_Y + 22);
    ctx.scale(scale, scale);
    drawCardFace(ctx, entry, 0, 0, CARD_W, CARD_H, { playable: true });
    ctx.restore();
    text(ctx, entry.who === 'player' ? 'YOU' : 'ZINNIA', x + (CARD_W * scale) / 2, PLAYED_Y + 22 + CARD_H * scale + 12, 11, entry.who === 'player' ? '#ffd166' : '#e5484d', 'bold', 'center');
  });
  if (played.length === 0) {
    text(ctx, 'Play a card — the counter is empty.', 640, PLAYED_Y + 100, 15, '#cbb98f', 'normal', 'center');
  }

  // Player hand, fanned. The hand always fits the centre column (204..1076)
  // so it never slides under the buttons in the right column: with more
  // cards, each card scales down instead of spilling over.
  const hand = game.player.hand;
  const n = hand.length;
  const gap = 10;
  const availW = 872;
  const cw = Math.min(CARD_W, (availW - (n - 1) * gap) / n);
  const hscale = cw / CARD_W;
  const totalW = n * cw + (n - 1) * gap;
  const startX = 640 - totalW / 2;
  hand.forEach((card, i) => {
    const x = startX + i * (cw + gap);
    const hovered = input && input.hover && input.hover.type === 'card' && input.hover.card.uid === card.uid;
    ctx.save();
    ctx.translate(x, HAND_Y - (hovered ? 10 : 0));
    ctx.scale(hscale, hscale);
    drawCardFace(ctx, card, 0, 0, CARD_W, CARD_H, { playable: canPlayCard(game, card), hovered: false });
    ctx.restore();
    layout.cards.push({ card, x, y: HAND_Y - (hovered ? 10 : 0), w: cw, h: CARD_H * hscale });
    text(ctx, String(i + 1), x + cw / 2, HAND_Y + CARD_H * hscale + 14, 12, '#cbb98f', 'bold', 'center');
  });

  // Turn controls.
  const canEnd = game.phase === 'player' && !game.duelOver && !game.matchOver;
  drawButton(ctx, 'end', 1084, 560, 188, 46, 'END TURN  [Space]', canEnd);
  drawButton(ctx, 'restart', 1084, 616, 188, 40, 'RESTART  [R]', true);
  text(ctx, game.phase === 'player' ? 'Your turn — play a card or end it.' : 'Zinnia is haggling…', 1178, 690, 13, '#f7ead0', 'normal', 'center');
  text(ctx, game.paused ? 'PAUSED — press P to resume' : 'P pause  •  M mute', 1178, 716, 12, '#cbb98f', 'normal', 'center');

  // Floaters.
  for (const f of game.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2);
    text(ctx, f.text, f.x, f.y - f.t * 46, 24, f.color, 'bold', 'center');
    ctx.restore();
  }

  // Duel-over banner (match continues).
  if (game.duelOver && !game.matchOver) {
    ctx.fillStyle = 'rgba(20, 10, 18, 0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, game.duelWinner === 'player' ? 'DUEL WON!' : 'DUEL LOST', 640, 330, 54, game.duelWinner === 'player' ? '#ffd166' : '#e5484d', 'bold', 'center');
    text(ctx, `Duels: you ${game.playerDuels} — ${game.rivalDuels} Zinnia`, 640, 390, 20, '#f7ead0', 'normal', 'center');
    drawButton(ctx, 'next', 540, 430, 200, 52, 'NEXT DUEL  [Enter]', true);
  }

  // Bottom hint bar.
  ctx.fillStyle = 'rgba(20, 10, 18, 0.85)';
  ctx.fillRect(0, CANVAS_H - 32, CANVAS_W, 32);
  text(ctx, 'Click a card or press 1–7 to play it  •  Space ends your turn  •  Match the telegraph to Undercut (+3)  •  Two of one stall = Stall Set (+2)  •  Three stalls = Grand Bazaar', 640, CANVAS_H - 16, 12, '#cbb98f', 'normal', 'center');
}

function canPlayCard(game, card) {
  return game.phase === 'player' && !game.duelOver && !game.matchOver && game.player.coins >= card.cost;
}

function drawTitle(ctx, game) {
  layout.cards = [];
  layout.buttons = [];
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#2a1a2e');
  grad.addColorStop(1, '#4a2333');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Awning stripes.
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#7a2e2e' : '#f7ead0';
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(i * 80, 0);
    ctx.lineTo(i * 80 + 40, 0);
    ctx.lineTo(i * 80 + 52, 46);
    ctx.lineTo(i * 80 + 12, 46);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Four stall shapes as a crest.
  STALL_ORDER.forEach((stall, i) => {
    drawStallShape(ctx, STALLS[stall].shape, 470 + i * 110, 150, 34, STALLS[stall].color);
  });
  text(ctx, GAME_TITLE, 640, 250, 84, '#ffd166', 'bold', 'center');
  text(ctx, GAME_SUBTITLE, 640, 310, 26, '#f7ead0', 'normal', 'center');
  text(ctx, 'Out-haggle Madame Zinnia in the night market. Win 2 duels, keep your patrons.', 640, 348, 17, '#cbb98f', 'normal', 'center');
  drawButton(ctx, 'play', 520, 390, 240, 58, 'PLAY  [Enter]', true);
  // How to play.
  ctx.fillStyle = 'rgba(20, 10, 18, 0.7)';
  roundRect(ctx, 240, 480, 800, 180, 12);
  ctx.fill();
  text(ctx, 'HOW TO PLAY', 640, 508, 16, '#e0a83c', 'bold', 'center');
  const lines = [
    'Each card costs coins and wins you patrons. First to 0 patrons loses the duel.',
    'STALL SET: two cards of one stall in a turn (+2).  GRAND BAZAAR: three stalls (+draw, +coin).',
    'UNDERCUT: play the stall that beats what Zinnia telegraphs (+3).  Crowd of 8 = RUSH HOUR (+4 Sell).',
    'Click a card or press 1–7. Space ends your turn. P pauses, M mutes, R restarts.',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 540 + i * 26, 14, '#f7ead0', 'normal', 'center'));
  text(ctx, 'A complete original card game — no real money, no network, just the market.', 640, 700, 13, '#cbb98f', 'normal', 'center');
}

function drawStats(ctx, game, y0) {
  const s = game.stats;
  const rows = [
    `Cards played: ${s.cardsPlayed}`,
    `Combos landed: ${s.combos}`,
    `Best chain: x${s.bestChain}`,
    `Sells ${s.sells}  •  Charms ${s.charms}  •  Haggles ${s.haggles}`,
    `Coins stolen: ${s.coinsStolen}`,
    `Duels: you ${game.playerDuels} — ${game.rivalDuels} Zinnia`,
  ];
  rows.forEach((row, i) => text(ctx, row, 640, y0 + i * 30, 17, '#f7ead0', 'normal', 'center'));
}

function drawEndScreen(ctx, game, won) {
  layout.cards = [];
  layout.buttons = [];
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  if (won) {
    grad.addColorStop(0, '#4a3410');
    grad.addColorStop(1, '#2a1a2e');
  } else {
    grad.addColorStop(0, '#3d1f2b');
    grad.addColorStop(1, '#160a12');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  if (won) {
    // Coin confetti, deterministic positions from the seed.
    let seed = game.seed * 7919 + 13;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 60; i += 1) {
      const x = rnd() * CANVAS_W;
      const y = rnd() * 420;
      coinIcon(ctx, x, y, 7 + rnd() * 6, '');
    }
    text(ctx, 'VICTORY!', 640, 180, 88, '#ffd166', 'bold', 'center');
    text(ctx, 'The Coinmarket is yours — Zinnia packs her stall and bows.', 640, 250, 20, '#f7ead0', 'normal', 'center');
  } else {
    text(ctx, 'DEFEAT', 640, 180, 88, '#e5484d', 'bold', 'center');
    text(ctx, 'Zinnia keeps the market — this time. Your stall will be back.', 640, 250, 20, '#f7ead0', 'normal', 'center');
  }
  drawStats(ctx, game, 320);
  drawButton(ctx, 'again', 520, 540, 240, 58, 'PLAY AGAIN  [Enter]', true);
  text(ctx, won ? 'Pip the Peddler, champion of the Brass Bazaar.' : 'Tip: watch the telegraph — Undercut pays +3.', 640, 640, 15, '#cbb98f', 'normal', 'center');
}

export function render(ctx, game, input, now) {
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'win') drawEndScreen(ctx, game, true);
  else if (game.screen === 'loss') drawEndScreen(ctx, game, false);
  else drawTable(ctx, game, input, now);
  if (game.paused && game.screen === 'table') {
    ctx.fillStyle = 'rgba(20, 10, 18, 0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, 'PAUSED', 640, 380, 60, '#f7ead0', 'bold', 'center');
    text(ctx, 'Press P to resume', 640, 440, 20, '#cbb98f', 'normal', 'center');
  }
}

export function hitTest(x, y) {
  for (const b of layout.buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return { type: 'button', id: b.id };
    }
  }
  for (let i = layout.cards.length - 1; i >= 0; i -= 1) {
    const c = layout.cards[i];
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
      return { type: 'card', card: c.card };
    }
  }
  return null;
}
