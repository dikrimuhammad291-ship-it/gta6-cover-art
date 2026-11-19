# Vice Press — GTA 6-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/dikrimuhammad291-ship-it/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/dikrimuhammad291-ship-it/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Entry for [Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) on make.fun: an offline browser web app that turns any photo plus a caption into a GTA 6-style cover — a multi-panel poster with a Vice City neon-sunset grade — and exports it as a PNG.

## What it does

- **4 layouts**: Hero + Three, Four Panel (2×2 + title band), Tall Strip, Full Bleed.
- **4 grades**: Vice Sunset, Neon Nights, Golden Hour, Vice Noir — canvas gradient/composite overlays, no filters.
- **Lettering**: Anton display + Pacifico script (vendored, OFL), three title styles (white outline, sunset gradient, neon glow), a 5-star row, and a diagonal VICE CITY sash ribbon.
- **Any photo**: 4 photo slots, one input per panel, or one photo across all panels with different framings; drag to reposition, zoom 1–2.5×; 4 bundled sample photos.
- **Fast export**: Square 1080×1080, Portrait 1080×1350, Wide 1920×1080 — one Export PNG button; preview and export share the same draw function. Film grain (seeded, deterministic), vignette, and a white poster frame on every cover.

No Rockstar logo, official artwork, or official fonts. Fully offline: vanilla ES modules + 2D canvas, no libraries, no network.

## Run it

Serve the app directory with any static server and open `app/index.html`, or:

```sh
node serve.ts
```

Build the submission dossier:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Validation

- 4 real browser renders in `screenshots/` (Playwright + the app's own `?shot=` scenes), all under the 256 KiB cap.
- `main.ts` builds cleanly; dossier 1,064,274 bytes (cap 1,572,864); two runs byte-identical.
- Live smoke check in headless Chromium: no console errors; layout/size/panel controls and export all work — export verified as a real 1920×1080 RGBA PNG.
