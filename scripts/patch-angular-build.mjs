/**
 * Post-install patches for @angular/build (see package.json postinstall).
 *
 * 1) Longer AbortSignal timeouts — default 30s can fail large SSR apps.
 * 2) discoverRoutes default false — with outputMode=server Angular forces prerender:true
 *    but ignores angular.json prerender options; route extraction then fails on some setups
 *    (TimeoutError or non-Error rejections). SSR still works; static prerender count may be 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function patchFile(rel, replacers) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  let text = fs.readFileSync(abs, 'utf8');
  let changed = false;
  for (const [from, to] of replacers) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(abs, text);
    console.log(`[patch-angular-build] ${rel}`);
  }
}

for (const rel of [
  'node_modules/@angular/build/src/utils/server-rendering/routes-extractor-worker.js',
  'node_modules/@angular/build/src/utils/server-rendering/render-worker.js',
  'node_modules/@angular/build/src/tools/vite/middlewares/ssr-middleware.js',
]) {
  patchFile(rel, [['AbortSignal.timeout(30_000)', 'AbortSignal.timeout(120_000)']]);
}

patchFile('node_modules/@angular/build/src/builders/application/options.js', [
  [
    'const { discoverRoutes = true, routesFile = undefined } = options.prerender === true ? {} : options.prerender;',
    'const { discoverRoutes = false, routesFile = undefined } = options.prerender === true ? {} : options.prerender;',
  ],
]);
