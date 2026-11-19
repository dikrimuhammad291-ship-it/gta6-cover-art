// Colour grades: each grade is a list of overlay steps drawn over a panel after
// its photo, clipped to the panel. A step is a fill or a gradient washed over the
// panel with a composite operation, so the grade is pure canvas work with no
// filter and no network. The swatch is the CSS gradient the editor shows.

/** The four grades, in the order the editor lists them. */
export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    swatch: 'linear-gradient(135deg, #ffd319, #ff2975 55%, #8c1eff)',
    steps: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255, 140, 60, 0.10)'], [1, 'rgba(220, 40, 130, 0.38)']], composite: 'overlay' },
      { kind: 'fill', color: 'rgba(255, 120, 40, 0.14)', composite: 'soft-light' },
      { kind: 'linear', from: [0, 0.55], to: [0, 1], stops: [[0, 'rgba(40, 0, 60, 0)'], [1, 'rgba(40, 0, 60, 0.28)']], composite: 'multiply' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    swatch: 'linear-gradient(135deg, #00e5ff, #7b2fff 55%, #ff2ea6)',
    steps: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(0, 229, 255, 0.16)'], [0.5, 'rgba(123, 47, 255, 0.10)'], [1, 'rgba(255, 46, 166, 0.34)']], composite: 'overlay' },
      { kind: 'fill', color: 'rgba(0, 20, 60, 0.18)', composite: 'multiply' },
      { kind: 'fill', color: 'rgba(0, 255, 220, 0.08)', composite: 'soft-light' },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    swatch: 'linear-gradient(135deg, #fff3b0, #ffb703 55%, #fb8500)',
    steps: [
      { kind: 'fill', color: 'rgba(255, 190, 60, 0.20)', composite: 'soft-light' },
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255, 220, 130, 0.12)'], [1, 'rgba(255, 140, 0, 0.22)']], composite: 'overlay' },
      { kind: 'linear', from: [0, 0.6], to: [0, 1], stops: [[0, 'rgba(80, 30, 0, 0)'], [1, 'rgba(80, 30, 0, 0.22)']], composite: 'multiply' },
    ],
  },
  {
    id: 'noir',
    name: 'Vice Noir',
    swatch: 'linear-gradient(135deg, #e0e0e0, #555 55%, #ff2e88)',
    desaturate: 0.9,
    steps: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255, 255, 255, 0.06)'], [1, 'rgba(255, 46, 136, 0.30)']], composite: 'overlay' },
      { kind: 'fill', color: 'rgba(10, 10, 25, 0.22)', composite: 'multiply' },
    ],
  },
];

/** Looks a grade up by id, falling back to the first grade. */
export function getGrade(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

/**
 * Washes a grade over a panel rectangle. The caller clips to the panel first.
 * `rect` is {x, y, w, h} in canvas pixels.
 */
export function applyGrade(ctx, grade, rect) {
  if (grade.desaturate) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = grade.desaturate;
    ctx.fillStyle = '#808080';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  for (const step of grade.steps) {
    ctx.save();
    ctx.globalCompositeOperation = step.composite;
    if (step.kind === 'fill') {
      ctx.fillStyle = step.color;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      const [fx, fy] = step.from;
      const [tx, ty] = step.to;
      const grad = ctx.createLinearGradient(
        rect.x + fx * rect.w, rect.y + fy * rect.h,
        rect.x + tx * rect.w, rect.y + ty * rect.h,
      );
      for (const [at, color] of step.stops) grad.addColorStop(at, color);
      ctx.fillStyle = grad;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }
}
