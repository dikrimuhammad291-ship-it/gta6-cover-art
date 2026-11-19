// Vice Press entry for gta6-cover-art-01 (Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (index.html plus its ES modules, local fonts, sample photos and
// no network request). This program hands it in: it copies app/ and
// screenshots/ from beside this file to the output directory and writes
// dossier.json, the summary the judge reads, with the vendored make.fun
// library. The grader runs it twice and both runs must write the same bytes.
//
// Try it locally first: `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Where the repository sits, and where the handed-in files go.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's own caps: the dossier text is capped at 160 KiB, and the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; app/ over 993 files or 48 MiB, or a path under app/ over 1000 bytes).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
