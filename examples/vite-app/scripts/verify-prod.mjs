// Builds the example for production and fails if any Theme Studio code reached dist/.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');

execSync('npm run build', { cwd: root, stdio: 'inherit' });

// Strings that only exist in the studio runtime.
const MARKERS = [
  'astryx-theme-studio-root',
  'astryx-theme-studio-overlay',
  'data-astryx-theme-studio',
  'astryx-theme-studio:working-theme',
  'ASTRYX THEME STUDIO',
];

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(js|mjs|css|html|map)$/.test(name)) yield p;
  }
}

const hits = [];
for (const f of files(dist)) {
  const text = readFileSync(f, 'utf8');
  for (const m of MARKERS) if (text.includes(m)) hits.push(`${m}  ←  ${f.slice(root.length + 1)}`);
}

if (hits.length) {
  console.error('\nTheme Studio code was found in the production build:\n  ' + hits.join('\n  '));
  process.exit(1);
}
console.log('\n✓ No Theme Studio code found in dist/');
