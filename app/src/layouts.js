// Panel layouts for the cover: each layout is a function of the cover size that
// returns the panels (photo rectangles), the title block rectangle and the frame
// measurements. All geometry is in pixels at the cover's own size, so the same
// layout draws at preview size and at full export size.

/** The four layouts, in the order the editor lists them. */
export const LAYOUTS = [
  { id: 'hero', name: 'Hero + Three', panels: 4, blurb: 'One big hero panel, three beside it' },
  { id: 'grid', name: 'Four Panel', panels: 4, blurb: 'A 2 x 2 grid with a title band' },
  { id: 'strip', name: 'Tall Strip', panels: 3, blurb: 'Hero on top, two panels below' },
  { id: 'bleed', name: 'Full Bleed', panels: 1, blurb: 'One photo, edge to edge' },
];

/**
 * Returns { panels, title, frame, gap } for a layout at a cover of w by h.
 * panels: [{x, y, w, h}] in draw order; title: {x, y, w, h, align, band, scrim}.
 */
export function getLayout(id, w, h) {
  const frame = Math.max(4, Math.round(w * 0.008));
  const gap = Math.max(4, Math.round(w * 0.008));
  const inner = { x: frame, y: frame, w: w - frame * 2, h: h - frame * 2 };

  if (id === 'grid') {
    const bandH = Math.round(h * 0.15);
    const areaH = inner.h - bandH - gap;
    const pw = (inner.w - gap) / 2;
    const ph = (areaH - gap) / 2;
    return {
      frame,
      gap,
      panels: [
        { x: inner.x, y: inner.y, w: pw, h: ph },
        { x: inner.x + pw + gap, y: inner.y, w: pw, h: ph },
        { x: inner.x, y: inner.y + ph + gap, w: pw, h: ph },
        { x: inner.x + pw + gap, y: inner.y + ph + gap, w: pw, h: ph },
      ],
      title: {
        x: inner.x, y: inner.y + areaH + gap, w: inner.w, h: bandH,
        align: 'center', band: true, scrim: false,
      },
    };
  }

  if (id === 'bleed') {
    return {
      frame,
      gap,
      panels: [{ x: inner.x, y: inner.y, w: inner.w, h: inner.h }],
      title: {
        x: inner.x + w * 0.05, y: h - h * 0.34, w: w * 0.9 - frame * 2, h: h * 0.28,
        align: 'center', band: false, scrim: true,
      },
    };
  }

  if (id === 'strip') {
    const heroH = Math.round(inner.h * 0.55);
    const pw = (inner.w - gap) / 2;
    const ph = inner.h - heroH - gap;
    return {
      frame,
      gap,
      panels: [
        { x: inner.x, y: inner.y, w: inner.w, h: heroH },
        { x: inner.x, y: inner.y + heroH + gap, w: pw, h: ph },
        { x: inner.x + pw + gap, y: inner.y + heroH + gap, w: pw, h: ph },
      ],
      title: {
        x: inner.x + w * 0.04, y: inner.y + heroH - h * 0.24, w: inner.w - w * 0.08, h: h * 0.22,
        align: 'center', band: false, scrim: true,
      },
    };
  }

  // hero: hero panel plus three small ones. Landscape and square put the hero on
  // the left; portrait puts it on top.
  if (w >= h) {
    const heroW = Math.round(inner.w * 0.62);
    const sideW = inner.w - heroW - gap;
    const ph = (inner.h - gap * 2) / 3;
    return {
      frame,
      gap,
      panels: [
        { x: inner.x, y: inner.y, w: heroW, h: inner.h },
        { x: inner.x + heroW + gap, y: inner.y, w: sideW, h: ph },
        { x: inner.x + heroW + gap, y: inner.y + ph + gap, w: sideW, h: ph },
        { x: inner.x + heroW + gap, y: inner.y + (ph + gap) * 2, w: sideW, h: ph },
      ],
      title: {
        x: inner.x + w * 0.03, y: h - h * 0.3, w: heroW - w * 0.06, h: h * 0.24,
        align: 'left', band: false, scrim: true,
      },
    };
  }
  const heroH = Math.round(inner.h * 0.58);
  const pw = (inner.w - gap * 2) / 3;
  const ph = inner.h - heroH - gap;
  return {
    frame,
    gap,
    panels: [
      { x: inner.x, y: inner.y, w: inner.w, h: heroH },
      { x: inner.x, y: inner.y + heroH + gap, w: pw, h: ph },
      { x: inner.x + pw + gap, y: inner.y + heroH + gap, w: pw, h: ph },
      { x: inner.x + (pw + gap) * 2, y: inner.y + heroH + gap, w: pw, h: ph },
    ],
    title: {
      x: inner.x + w * 0.04, y: inner.y + heroH - h * 0.26, w: inner.w - w * 0.08, h: h * 0.22,
      align: 'center', band: false, scrim: true,
    },
  };
}
