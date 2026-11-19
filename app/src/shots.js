// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, filling the viewport. Query params
// pick the scene: layout, grade, size, title, subtitle, lettering, badge (0/1),
// stars and photos (comma-separated sample names, one per panel).
// window.__shotReady is set once the scene is painted.
const SHOT_CROPS = [
  { zoom: 1, dx: 0, dy: 0 },
  { zoom: 1.05, dx: -0.2, dy: 0.55 },
  { zoom: 1.15, dx: 0.4, dy: -0.2 },
  { zoom: 1.3, dx: 0, dy: 0.3 },
];

/** Applies the scene's query params to the editor state. */
function applyShotParams(query, state) {
  const layout = query.get('layout');
  if (layout) state.layout = layout;
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  const size = query.get('size');
  if (size) state.size = size;
  const title = query.get('title');
  if (title !== null) state.title = title;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const lettering = query.get('lettering');
  if (lettering) state.lettering = lettering;
  const badge = query.get('badge');
  if (badge !== null) state.badge = badge !== '0';
  const stars = query.get('stars');
  if (stars !== null) state.stars = Number(stars);
}

/** Loads the scene's photos into the slots: named samples, or the defaults. */
async function loadShotPhotos(query, api) {
  const names = query.get('photos');
  if (!names) {
    await api.loadSamplesIntoSlots();
    return;
  }
  const loaded = await Promise.all(
    names.split(',').map((name) => api.loadSample(name.trim()).catch(() => null)),
  );
  api.state.photos = loaded.map((img, i) => (img ? { img, ...SHOT_CROPS[i] } : null));
}

/** Runs a screenshot scene and marks the page ready once painted. */
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  applyShotParams(query, api.state);
  await loadShotPhotos(query, api);
  api.resizeCanvas();
  await api.fontsReady;
  api.redraw();
  api.syncControlsFromState();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
