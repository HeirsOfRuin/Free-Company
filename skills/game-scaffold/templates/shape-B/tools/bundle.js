// Build the game from its ES module graph. No bundler, no dependencies.
// Generalised from The Lists (itself from Centennial Farm). Three outputs:
//
//   dist/{{SLUG}}.html         one file, opens from a phone's downloads folder (file://)
//   dist/{{SLUG}}.embed.html   page CONTENT only, for a host that supplies the document
//   dist/site/                 the installable build for GitHub Pages: the page, its
//                              manifest and icons as real files, and sw.js, with the
//                              build id stamped into both page and worker
//
// The game is authored as ES modules so the engine runs headless in Node for
// tests and measurement. The transform is small and explicit, handles only the
// import/export forms this codebase uses, and FAILS LOUDLY on anything else.
// Every scripted replacement asserts it matched (F32), uses a replacement
// function (a `$'` in game code once ate the rest of a bundle), and the build
// asserts the build id landed (Centennial Farm shipped "${stamp}" for a month).

import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = '{{SLUG}}';
const ENTRY = 'src/ui/app.js';
const STYLES = 'src/ui/styles.css';
const ICONS = ['icon-180.png', 'icon-192.png', 'icon-512.png', 'maskable-512.png'];
const PLACEHOLDER = '__BUILD_ID__';

const modules = new Map();

function collectExports(code, rel) {
  const names = new Set();
  for (const m of code.matchAll(/^export\s+(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/gm)) names.add(m[1]);
  for (const m of code.matchAll(/^export\s+class\s+([A-Za-z0-9_$]+)/gm)) names.add(m[1]);
  for (const m of code.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/gm)) names.add(m[1]);
  for (const m of code.matchAll(/^export\s*\{([^}]*)\}\s*(?:from\s*['"][^'"]+['"])?\s*;?/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  if (/^export\s+default/m.test(code)) throw new Error(`${rel}: default exports are not supported by this bundler`);
  if (/^export\s+\*/m.test(code)) throw new Error(`${rel}: export * is not supported by this bundler`);
  return [...names];
}

async function load(rel) {
  if (modules.has(rel)) return;
  const abs = join(ROOT, rel);
  let code;
  try { code = await readFile(abs, 'utf8'); } catch { throw new Error(`Cannot read module: ${rel}`); }
  const deps = [];
  const depPath = (spec) => {
    if (!spec.startsWith('.')) throw new Error(`${rel}: bare import "${spec}" cannot be bundled`);
    const p = relative(ROOT, resolve(dirname(abs), spec)).split('\\').join('/');
    deps.push(p);
    return `__m[${JSON.stringify(p)}]`;
  };
  // `import { a as b }` is not valid destructuring (that is `{ a: b }`).
  const bindings = (named) => named.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => { const a = s.split(/\s+as\s+/); return a.length === 2 ? `${a[0].trim()}: ${a[1].trim()}` : s; }).join(', ');
  code = code.replace(/^import\s+(?:(\*\s*as\s+[A-Za-z0-9_$]+)|(\{[^}]*\}))\s+from\s+['"]([^'"]+)['"]\s*;?/gm,
    (_w, star, named, spec) => (star ? `const ${star.replace(/\*\s*as\s*/, '')} = ${depPath(spec)};` : `const { ${bindings(named)} } = ${depPath(spec)};`));
  // export { a, b } from './x.js'  -> re-export
  const reexports = [];
  code = code.replace(/^export\s*(\{[^}]*\})\s*from\s*['"]([^'"]+)['"]\s*;?/gm, (_w, named, spec) => {
    reexports.push(named);
    return `const ${'{ ' + bindings(named) + ' }'} = ${depPath(spec)};`;
  });
  const leftover = code.match(/^import\s.+$/m);
  if (leftover) throw new Error(`${rel}: unsupported import form -> ${leftover[0]}`);
  const exports = collectExports(code, rel);
  code = code.replace(/^export\s+(?=(?:async\s+)?function|class|const|let|var)/gm, '');
  code = code.replace(/^export\s*\{[^}]*\}\s*;?/gm, '');
  for (const d of deps) await load(d);
  modules.set(rel, { code, deps, exports });
}

function order() {
  const out = [], seen = new Set(), visiting = new Set();
  const walk = (p) => {
    if (seen.has(p)) return;
    if (visiting.has(p)) throw new Error(`Import cycle through ${p}`);
    visiting.add(p);
    for (const d of modules.get(p).deps) walk(d);
    visiting.delete(p); seen.add(p); out.push(p);
  };
  for (const p of modules.keys()) walk(p);
  return out;
}

/** Apply [label, regex, fn] swaps, asserting each matched exactly once. */
function swap(html, swaps, what) {
  let out = html;
  for (const [label, re, fn] of swaps) {
    const n = (out.match(new RegExp(re.source, 'g')) || []).length;
    if (n !== 1) throw new Error(`${what}: the ${label} tag matched ${n} times in index.html (expected 1)`);
    out = out.replace(re, fn);
  }
  return out;
}

const html = await readFile(join(ROOT, 'index.html'), 'utf8');
const css = await readFile(join(ROOT, STYLES), 'utf8');
await load(ENTRY);
const parts = ['const __m = {};'];
for (const p of order()) {
  const m = modules.get(p);
  parts.push(`__m[${JSON.stringify(p)}] = (function () {\n${m.code}\nreturn { ${m.exports.join(', ')} };\n})();`);
}
const script = `<script type="module">\n${parts.join('\n\n')}\n</script>`;
const styleTag = `<style>\n${css}\n</style>`;
const dataUri = async (rel, type) => `data:${type};base64,${(await readFile(join(ROOT, rel))).toString('base64')}`;
const RE = {
  style: /<link rel="stylesheet" href="src\/ui\/styles\.css">/,
  script: /<script type="module" src="src\/ui\/app\.js"><\/script>/,
  manifest: /<link rel="manifest" href="assets\/manifest\.webmanifest">/,
  touch: /<link rel="apple-touch-icon" href="assets\/icon-180\.png">/,
  svg: /<link rel="icon" href="assets\/icon\.svg" type="image\/svg\+xml">/,
};

// ---- the site (built first: its hash is the build id)
const manifest = JSON.parse(await readFile(join(ROOT, 'assets/manifest.webmanifest'), 'utf8'));
const siteManifest = { ...manifest, icons: manifest.icons.map((i) => ({ ...i, src: i.src.replace(/^assets\//, '') })) };
let site = swap(html, [
  ['stylesheet', RE.style, () => styleTag],
  ['script', RE.script, () => script],
  ['manifest', RE.manifest, () => '<link rel="manifest" href="manifest.webmanifest">'],
  ['apple-touch-icon', RE.touch, () => '<link rel="apple-touch-icon" href="icon-180.png">'],
  ['svg icon', RE.svg, () => '<link rel="icon" href="icon.svg" type="image/svg+xml">'],
], 'site');
let worker = await readFile(join(ROOT, 'sw.js'), 'utf8');
const id = createHash('sha256').update(site).update(worker).update(JSON.stringify(siteManifest)).digest('hex').slice(0, 12);
for (const [name, text] of [['index.html', site], ['sw.js', worker]]) {
  if (!text.includes(PLACEHOLDER)) throw new Error(`site: ${name} has no ${PLACEHOLDER}; the build id would not reach it`);
}
site = site.split(PLACEHOLDER).join(id);
worker = worker.split(PLACEHOLDER).join(id);
const SITE = join(ROOT, 'dist/site');
await rm(SITE, { recursive: true, force: true });
await mkdir(SITE, { recursive: true });
await writeFile(join(SITE, 'index.html'), site);
await writeFile(join(SITE, 'sw.js'), worker);
await writeFile(join(SITE, 'manifest.webmanifest'), JSON.stringify(siteManifest, null, 2));
for (const f of [...ICONS, 'icon.svg']) await copyFile(join(ROOT, 'assets', f), join(SITE, f));
await writeFile(join(SITE, '.nojekyll'), '');

// ---- the single file: everything inline, nothing beside it
const inlineManifest = { ...manifest, icons: [] };
for (const i of manifest.icons) inlineManifest.icons.push({ ...i, src: await dataUri(join('assets', i.src), 'image/png') });
const manifestUri = `data:application/manifest+json;base64,${Buffer.from(JSON.stringify(inlineManifest)).toString('base64')}`;
const touchUri = await dataUri('assets/icon-180.png', 'image/png');
const svgUri = await dataUri('assets/icon.svg', 'image/svg+xml');
const single = swap(html, [
  ['stylesheet', RE.style, () => styleTag],
  ['script', RE.script, () => script],
  ['manifest', RE.manifest, () => `<link rel="manifest" href="${manifestUri}">`],
  ['apple-touch-icon', RE.touch, () => `<link rel="apple-touch-icon" href="${touchUri}">`],
  ['svg icon', RE.svg, () => `<link rel="icon" href="${svgUri}" type="image/svg+xml">`],
], 'single file');
const singleOut = single.split(PLACEHOLDER).join(id);
await writeFile(join(ROOT, `dist/${SLUG}.html`), singleOut);

// ---- the embed: content only; the host owns the document and the notch
const embed = [
  `<title>${manifest.name}</title>`,
  styleTag,
  '<style>:root { --sa-top: 0px; --sa-bottom: 0px; }</style>',
  '<div id="app"></div>',
  script.split(PLACEHOLDER).join(id),
].join('\n');
await writeFile(join(ROOT, `dist/${SLUG}.embed.html`), embed);

for (const f of [join(SITE, 'index.html'), join(SITE, 'sw.js'), join(ROOT, `dist/${SLUG}.html`)]) {
  if ((await readFile(f, 'utf8')).includes(PLACEHOLDER)) throw new Error(`${f}: build id placeholder left behind`);
}
const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`dist/${SLUG}.html        ${modules.size} modules, ${kb(singleOut)}`);
console.log(`dist/${SLUG}.embed.html  ${kb(embed)}, for a host that supplies the page`);
console.log(`dist/site/               installable build, build id ${id}`);
