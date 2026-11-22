// main.ts — GHOSTSHIFT hand-in for make.fun.
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from the kit's vendor library.
// The grader runs this as uid 65534 with the repository read-only and a
// writable, empty /output: this program never removes the output directory
// itself (removing it would throw EACCES), it only writes inside it.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyTree(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

fs.mkdirSync(outDir, { recursive: true });
copyTree(path.join(repoRoot, 'game'), path.join(outDir, 'game'));
copyTree(path.join(repoRoot, 'screenshots'), path.join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
fs.writeFileSync(path.join(outDir, 'dossier.json'), dossier);
