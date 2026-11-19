// Neon Coast Cover Studio — a gta6-cover-art-01 entry (Node 22, stdlib only).
// The app is plain static files in app/ beside this file: index.html plus its
// modules, fonts and sample photos, nothing fetched from the network. This
// program is the handoff: it copies app/ and screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun library,
// which is the summary the judge reads. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and try the app itself with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, from the kit's reference/gate.json: the dossier text is
// capped at 160 KiB; the other limits refuse an entry the scorer would refuse
// (more than 4 screenshots, one over 256 KiB, app/ over 993 files or 48 MiB,
// or an app/ path over 1000 bytes — app/ shares /output's 1000-entry cap with
// screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
console.log(`Wrote ${join(outputDir, 'dossier.json')}`);
