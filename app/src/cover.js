// Draws the cover: the photo panels with their grade, film grain and vignette,
// the title block in display lettering, and the badge ribbon. One function,
// drawCover, renders the whole cover at the canvas's own size, so the live
// preview and the exported PNG are the same drawing.
//
// State shape:
//   layout: 'hero' | 'grid' | 'strip' | 'bleed'
//   grade: 'sunset' | 'neon' | 'golden' | 'noir'
//   title, subtitle: strings
//   lettering: 'white' | 'sunset' | 'neon'
//   badge: boolean (the VICE CITY corner ribbon)
//   stars: 0..5 (filled stars above the title)
//   photos: up to 4 slots, each { img, zoom, dx, dy } or null; dx/dy in [-1, 1]
import { getLayout } from './layouts.js';
import { applyGrade, getGrade } from './grades.js';

/** The photo slot for a panel, or null when the panel has no photo yet. */
function slotFor(state, index) {
  return state.photos[index] ?? null;
}

/** Draws a photo into a panel: cover-fit, scaled by zoom, panned by dx/dy. */
export function drawPanelPhoto(ctx, slot, rect) {
  const img = slot.img;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * slot.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const x = rect.x + (rect.w - pw) / 2 + slot.dx * Math.max(0, (pw - rect.w) / 2);
  const y = rect.y + (rect.h - ph) / 2 + slot.dy * Math.max(0, (ph - rect.h) / 2);
  ctx.drawImage(img, x, y, pw, ph);
}

/** Draws an empty panel: a dark gradient, a plus and an ADD PHOTO label. */
function drawPlaceholderPanel(ctx, rect, w) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, '#2b1838');
  grad.addColorStop(1, '#12081f');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const plus = Math.min(rect.w, rect.h) * 0.28;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `${plus}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', rect.x + rect.w / 2, rect.y + rect.h / 2 - plus * 0.18);
  const label = Math.max(10, Math.min(rect.w, rect.h) * 0.09);
  ctx.font = `${label}px Anton, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2 + plus * 0.45);
}

/** A tiny seeded random generator, so the film grain is the same every render. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
/** Builds (once) a 128px noise tile used as a repeating grain pattern. */
function getGrainTile() {
  if (grainTile) return grainTile;
  const rand = mulberry32(20261119);
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 118 + Math.floor(rand() * 40);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return tile;
}

/** Washes film grain over the whole cover. */
function drawGrain(ctx, w, h) {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkens the cover's corners and edges. */
function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(5, 0, 15, 0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Shrinks a font size until `text` fits `maxWidth`, down to a floor. */
function fitFontSize(ctx, text, family, maxWidth, startSize, floor) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > floor) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** Draws one five-pointed star, filled or just outlined. */
function drawStar(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ffd319';
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
}

/** Draws the star row above the title, `count` of 5 stars filled. Centred on
 * `x`, or starting at `x` when the title is left-aligned. */
function drawStarRow(ctx, x, cy, size, count, align) {
  const gap = size * 1.35;
  const total = gap * 4;
  const start = align === 'left' ? x + size / 2 : x - total / 2;
  for (let i = 0; i < 5; i += 1) {
    drawStar(ctx, start + i * gap, cy, size / 2, i < count);
  }
}

/** Paints the title text with the chosen lettering style. */
function paintTitleText(ctx, text, x, y, size, style) {
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  if (style === 'sunset') {
    const grad = ctx.createLinearGradient(0, y - size, 0, y + size * 0.2);
    grad.addColorStop(0, '#ffe259');
    grad.addColorStop(0.45, '#ffa751');
    grad.addColorStop(0.75, '#ff2975');
    grad.addColorStop(1, '#b537f2');
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeStyle = 'rgba(50, 0, 40, 0.9)';
    ctx.lineWidth = size * 0.06;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
  } else if (style === 'neon') {
    ctx.shadowColor = '#ff2ea6';
    ctx.shadowBlur = size * 0.35;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = size * 0.035;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
    ctx.shadowBlur = size * 0.12;
    ctx.shadowColor = '#00e5ff';
    ctx.fillText(text, x, y);
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeStyle = '#14060f';
    ctx.lineWidth = size * 0.09;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Draws the title block: stars, title and subtitle stacked in the title rect.
 * The title is sized so the whole stack fits the rect, never just the title. */
function drawTitleBlock(ctx, rect, state, w) {
  const title = state.title.trim().toUpperCase();
  const subtitle = state.subtitle.trim();
  if (rect.band) {
    ctx.fillStyle = '#14101a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#ffd319';
    ctx.fillRect(rect.x, rect.y, rect.w, Math.max(2, w * 0.003));
  } else if (rect.scrim) {
    const grad = ctx.createLinearGradient(0, rect.y - rect.h * 0.55, 0, rect.y + rect.h);
    grad.addColorStop(0, 'rgba(10, 5, 20, 0)');
    grad.addColorStop(1, 'rgba(10, 5, 20, 0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x - w * 0.02, rect.y - rect.h * 0.55, rect.w + w * 0.04, rect.h * 1.55);
  }

  const alignX = rect.align === 'left' ? rect.x : rect.x + rect.w / 2;
  ctx.textAlign = rect.align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'alphabetic';

  const hasStars = state.stars > 0;
  const hasSub = !!subtitle;
  // Stack height in title-size units: star row 0.26 x 1.45, title 1.0,
  // subtitle 0.42 x 1.6. The title must fit the rect at that factor.
  const factor = (hasStars ? 0.377 : 0) + (title ? 1 : 0) + (hasSub ? 0.672 : 0);
  const maxByHeight = title ? (rect.h * 0.94) / Math.max(factor, 1) : 0;
  const titleSize = title
    ? fitFontSize(ctx, title, 'Anton, sans-serif', rect.w, Math.min(maxByHeight, w * 0.115), Math.max(14, w * 0.03))
    : 0;
  const starSize = hasStars ? Math.max(10, titleSize * 0.26) : 0;
  const subSize = hasSub ? Math.max(12, titleSize * 0.42) : 0;
  const stackH = (hasStars ? starSize * 1.45 : 0) + titleSize + (hasSub ? subSize * 1.6 : 0);
  let top = rect.y + (rect.h - stackH) / 2;

  if (hasStars) {
    drawStarRow(ctx, alignX, top + starSize * 0.55, starSize, state.stars, rect.align);
    top += starSize * 1.45;
  }
  if (title) {
    paintTitleText(ctx, title, alignX, top + titleSize * 0.85, titleSize, state.lettering);
    top += titleSize;
  }
  if (subtitle) {
    const subColor = state.lettering === 'sunset' ? '#ffd319' : state.lettering === 'neon' ? '#7df9ff' : '#ffffff';
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillStyle = subColor;
    ctx.fillText(subtitle, alignX, top + subSize * 1.1);
    ctx.shadowBlur = 0;
  }
}

/** Draws the diagonal VICE CITY sash across the cover's top-right corner: a
 * band from a point on the top edge to a point on the right edge. */
function drawBadgeRibbon(ctx, w) {
  const reach = w * 0.2; // how far the sash runs along each edge from the corner
  const len = reach * Math.SQRT2 * 1.15;
  const band = Math.max(18, w * 0.035);
  ctx.save();
  ctx.translate(w - reach / 2, reach / 2);
  ctx.rotate(Math.PI / 4);
  const grad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
  grad.addColorStop(0, '#ff2975');
  grad.addColorStop(0.5, '#ff7e5f');
  grad.addColorStop(1, '#ffd319');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = band * 0.3;
  ctx.fillStyle = grad;
  ctx.fillRect(-len / 2, -band / 2, len, band);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `${band * 0.52}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V I C E   C I T Y', 0, band * 0.04);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` from `state`, at the canvas's own size.
 * The preview and the export call this same function, so they always match.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const { panels, title, frame } = getLayout(state.layout, w, h);
  const grade = getGrade(state.grade);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  panels.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const slot = slotFor(state, i);
    if (slot && slot.img) {
      drawPanelPhoto(ctx, slot, rect);
      applyGrade(ctx, grade, rect);
    } else {
      drawPlaceholderPanel(ctx, rect, w);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  });

  drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
  if (state.badge) drawBadgeRibbon(ctx, w);
  drawTitleBlock(ctx, title, state, w);

  // A thin dark line inside the white frame, for a printed-poster edge.
  ctx.strokeStyle = 'rgba(20, 10, 30, 0.35)';
  ctx.lineWidth = Math.max(1, frame * 0.12);
  ctx.strokeRect(frame * 0.5, frame * 0.5, w - frame, h - frame);
}
