// Wires the Vice Press editor: layout and grade pickers, photo slots with
// drag-to-position and zoom, caption controls, size switching and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover } from './cover.js';
import { getLayout, LAYOUTS } from './layouts.js';
import { GRADES } from './grades.js';
import { runShot } from './shots.js';

/** The three export sizes, in the order the editor lists them. */
export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

/** The bundled sample photos, one per panel by default. */
export const SAMPLES = ['boulevard', 'pier', 'neon', 'rooftop'];

/** Varied crops so the four panels frame differently even from one photo. */
const SLOT_CROPS = [
  { zoom: 1, dx: 0, dy: 0 },
  { zoom: 1.05, dx: -0.2, dy: 0.55 },
  { zoom: 1.15, dx: 0.4, dy: -0.2 },
  { zoom: 1.3, dx: 0, dy: 0.3 },
];

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'square',
  title: 'Neon Shore',
  subtitle: 'vice city nights',
  lettering: 'sunset',
  badge: true,
  stars: 5,
  photos: [null, null, null, null],
  selected: 0,
};

const canvas = document.getElementById('cover');
const preview = document.getElementById('preview');
const selection = document.getElementById('selection');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads a bundled sample photo by name. */
function loadSample(name) {
  return loadImage(`samples/${name}.jpg`);
}

/** Fills every panel with the bundled samples, each with its own crop. */
async function loadSamplesIntoSlots() {
  const loaded = await Promise.all(SAMPLES.map((name) => loadSample(name).catch(() => null)));
  state.photos = loaded.map((img, i) => (img ? { img, ...SLOT_CROPS[i] } : null));
  redraw();
}

/** Redraws the cover and the selection outline. */
function redraw() {
  drawCover(canvas, state);
  updateSelectionOverlay();
}

/** Resizes the canvas to the chosen export size and redraws. */
function resizeCanvas() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
}

/** Positions the selection outline over the selected panel, in display pixels. */
function updateSelectionOverlay() {
  const { panels } = getLayout(state.layout, canvas.width, canvas.height);
  const rect = panels[state.selected];
  if (!rect || document.body.classList.contains('shot-cover')) {
    selection.hidden = true;
    return;
  }
  const box = canvas.getBoundingClientRect();
  const sx = box.width / canvas.width;
  const sy = box.height / canvas.height;
  selection.hidden = false;
  selection.style.left = `${rect.x * sx}px`;
  selection.style.top = `${rect.y * sy}px`;
  selection.style.width = `${rect.w * sx}px`;
  selection.style.height = `${rect.h * sy}px`;
}

/** Marks the selected photo slot and syncs the zoom slider to it. */
function selectSlot(index) {
  state.selected = index;
  document.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(Number(btn.dataset.slot) === index));
  });
  const slot = state.photos[index];
  zoomInput.value = slot ? slot.zoom : 1;
  updateSelectionOverlay();
}

/** Puts an image into one slot, keeping a varied crop. */
function setSlotPhoto(index, img) {
  state.photos[index] = { img, ...SLOT_CROPS[index] };
  document.querySelector(`.slot-btn[data-slot="${index}"]`).classList.add('has-photo');
  selectSlot(index);
  redraw();
}

/** Fills all four panels from one photo, each framing a different region. */
function fillAllWith(img) {
  const crops = [
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1.7, dx: -0.6, dy: -0.4 },
    { zoom: 1.7, dx: 0.6, dy: 0.3 },
    { zoom: 2.1, dx: 0, dy: 0.5 },
  ];
  state.photos = crops.map((crop) => ({ img, ...crop }));
  document.querySelectorAll('.slot-btn').forEach((btn) => btn.classList.add('has-photo'));
  redraw();
}

/** Builds the layout picker buttons from LAYOUTS. */
function buildLayoutPicker() {
  const picker = document.getElementById('layoutPicker');
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.layout = layout.id;
    btn.setAttribute('aria-pressed', String(layout.id === state.layout));
    btn.innerHTML = `<span class="thumb ${layout.id}">${thumbMarkup(layout.id)}</span><span class="name">${layout.name}</span><span class="blurb">${layout.blurb}</span>`;
    btn.addEventListener('click', () => {
      state.layout = layout.id;
      picker.querySelectorAll('.pick').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      if (state.selected >= layout.panels) selectSlot(0);
      redraw();
    });
    picker.appendChild(btn);
  }
}

/** The mini panel diagram inside a layout button. */
function thumbMarkup(id) {
  if (id === 'hero') return '<i></i><span class="col"><i></i><i></i><i></i></span>';
  if (id === 'grid') return '<i></i><i></i><i></i><i></i>';
  if (id === 'strip') return '<i></i><span class="row2"><i></i><i></i></span>';
  return '<i></i>';
}

/** Builds the grade picker buttons from GRADES. */
function buildGradePicker() {
  const picker = document.getElementById('gradePicker');
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.grade = grade.id;
    btn.setAttribute('aria-pressed', String(grade.id === state.grade));
    btn.innerHTML = `<span class="swatch" style="display:block;background:${grade.swatch}"></span><span class="name">${grade.name}</span>`;
    btn.addEventListener('click', () => {
      state.grade = grade.id;
      picker.querySelectorAll('.pick').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      redraw();
    });
    picker.appendChild(btn);
  }
}

/** Syncs every control to the state (used after a shot scene sets it up). */
function syncControlsFromState() {
  document.querySelectorAll('#layoutPicker .pick').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
  document.querySelectorAll('#gradePicker .pick').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.size === state.size));
  });
  document.querySelectorAll('.slot-btn').forEach((b) => {
    b.classList.toggle('has-photo', !!state.photos[Number(b.dataset.slot)]);
  });
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  document.querySelector(`input[name="lettering"][value="${state.lettering}"]`).checked = true;
  document.getElementById('badge').checked = state.badge;
  document.getElementById('stars').value = String(state.stars);
  selectSlot(state.selected);
}

/** Converts a pointer event on the canvas to canvas pixel coordinates. */
function eventToCanvas(e) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - box.left) * (canvas.width / box.width),
    y: (e.clientY - box.top) * (canvas.height / box.height),
  };
}

/** The panel index under a canvas point, or -1 when the point is on a gap. */
function panelAt(point) {
  const { panels } = getLayout(state.layout, canvas.width, canvas.height);
  return panels.findIndex((r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
}

/** The drawn photo size for a slot in a panel, for drag math. */
function drawnSize(slot, rect) {
  const base = Math.max(rect.w / slot.img.naturalWidth, rect.h / slot.img.naturalHeight);
  const scale = base * slot.zoom;
  return { w: slot.img.naturalWidth * scale, h: slot.img.naturalHeight * scale };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const point = eventToCanvas(e);
  const index = panelAt(point);
  if (index === -1) return;
  selectSlot(index);
  const slot = state.photos[index];
  if (!slot) return;
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
  drag = { start: point, dx: slot.dx, dy: slot.dy };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const slot = state.photos[state.selected];
  const { panels } = getLayout(state.layout, canvas.width, canvas.height);
  const rect = panels[state.selected];
  if (!slot || !rect) return;
  const point = eventToCanvas(e);
  const drawn = drawnSize(slot, rect);
  const overX = Math.max(0, (drawn.w - rect.w) / 2);
  const overY = Math.max(0, (drawn.h - rect.h) / 2);
  if (overX > 0) slot.dx = Math.max(-1, Math.min(1, drag.dx + (point.x - drag.start.x) / overX));
  if (overY > 0) slot.dy = Math.max(-1, Math.min(1, drag.dy + (point.y - drag.start.y) / overY));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
  canvas.classList.remove('dragging');
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.photos[state.selected];
  if (!slot) return;
  slot.zoom = Math.max(1, Math.min(2.5, slot.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
  zoomInput.value = slot.zoom;
  redraw();
}, { passive: false });

document.querySelectorAll('.slot-btn').forEach((btn) => {
  btn.addEventListener('click', () => selectSlot(Number(btn.dataset.slot)));
});
zoomInput.addEventListener('input', () => {
  const slot = state.photos[state.selected];
  if (!slot) return;
  slot.zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    setSlotPhoto(state.selected, await loadImage(URL.createObjectURL(file)));
    status.textContent = `Photo loaded into panel ${state.selected + 1}.`;
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});
document.getElementById('fillAllFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    fillAllWith(await loadImage(URL.createObjectURL(file)));
    status.textContent = 'One photo, four framings.';
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});
document.getElementById('useSamples').addEventListener('click', async () => {
  await loadSamplesIntoSlots();
  syncControlsFromState();
  status.textContent = 'Sample photos loaded.';
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
document.querySelectorAll('input[name="lettering"]').forEach((radio) => {
  radio.addEventListener('change', () => { state.lettering = radio.value; redraw(); });
});
document.getElementById('badge').addEventListener('change', (e) => { state.badge = e.target.checked; redraw(); });
document.getElementById('stars').addEventListener('change', (e) => { state.stars = Number(e.target.value); redraw(); });
document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.size = btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    resizeCanvas();
  });
});
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — please try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-press-${state.size}-${size.w}x${size.h}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    status.textContent = `Saved vice-press-${state.size}-${size.w}x${size.h}.png`;
  }, 'image/png');
});
window.addEventListener('resize', updateSelectionOverlay);

/** Loads the display fonts, then draws the first cover. */
async function start() {
  buildLayoutPicker();
  buildGradePicker();
  syncControlsFromState();
  const shot = new URLSearchParams(location.search).get('shot');
  const fontsReady = Promise.all([
    document.fonts.load('80px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]).catch(() => {});
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state, canvas, loadSample, loadSamplesIntoSlots, resizeCanvas, redraw, syncControlsFromState, fontsReady,
    });
  } else {
    await loadSamplesIntoSlots();
    await fontsReady;
    redraw();
  }
}

start();
