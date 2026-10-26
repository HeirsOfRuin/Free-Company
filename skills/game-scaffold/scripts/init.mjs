#!/usr/bin/env node
// Scaffold a new game repo, or bring an existing one up to the day-one standard.
//
// NEW:   node init.mjs --shape=B --name="The Workshop" --dir=../The-Workshop \
//          --repo=The-Workshop --owner=HeirsOfRuin --colour="#8a5a2b" --bg="#16130f" \
//          --description="An armourer's shop, Nuremberg 1470s." [--icon=icon.svg] [--save-prefix=WKSP]
//
// FILL:  node init.mjs --fill --dir=../Imperator-of-Rome [--name=Imperator] [--upgrade]
//          for a repo that already exists. Adds only the missing INFRASTRUCTURE
//          (workflow, tools, measurement kit, FRAME templates; never the
//          placeholder game), then AUDITS what is there: manifest id and
//          maskable icon, a service worker with a build id, smoke in `check`,
//          .gitignore patterns, network fonts. Safe fixes are applied (manifest
//          fields, .gitignore lines, a maskable icon); the rest are reported.
//          --upgrade also replaces files that are recognisably copies of an
//          older version of this kit (they say so in their first line).
//
// Shapes (game-building references/architecture.md):
//   B  ES modules, no build step, bundled to one file    simulation games  (default)
//   C  Vite + Preact + TypeScript + YAML content          narrative games
//   A  one index.html, no build                           small, needed today
//
// Every {{VARIABLE}} must be filled: the script fails if one is left behind.

import { readdir, readFile, writeFile, mkdir, stat, copyFile, rm, mkdtemp } from 'node:fs/promises';
import { join, dirname, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const T = resolve(HERE, '../templates');

// ---------------------------------------------------------------- arguments
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (!m) throw new Error(`unexpected argument: ${a}`);
  return [m[1], m[2] ?? true];
}));
const fill = !!args.fill;
const dir = resolve(String(args.dir || (args.name ? String(args.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') : '.')));
const exists = async (p) => !!(await stat(p).catch(() => null));
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

let existingName = null;
if (fill && (await exists(join(dir, 'index.html')))) existingName = /<title>([^<]+)<\/title>/.exec(await readFile(join(dir, 'index.html'), 'utf8'))?.[1]?.trim();
const name = String(args.name || existingName || '');
if (!name) throw new Error('--name is required');
const shape = String(args.shape || 'B').toUpperCase();
if (!['A', 'B', 'C'].includes(shape)) throw new Error('--shape must be A, B or C');
const slug = String(args.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
const today = new Date().toISOString().slice(0, 10);
const repo = String(args.repo || basename(dir));
const owner = String(args.owner || 'HeirsOfRuin');
const colour = String(args.colour || '#7a2e2e');
const bg = String(args.bg || '#17150f');
const SHAPE_NAME = { A: 'one index.html, no build', B: 'vanilla ES modules, no build step, bundled to one file', C: 'Vite + Preact + TypeScript (strict) + YAML content + Zod' };

const baseVars = {
  NAME: name, SHORT: String(args.short || (name.length <= 12 ? name : name.split(/\s+/)[0])), SLUG: slug, REPO: repo,
  OWNER_LOWER: owner.toLowerCase(), DESCRIPTION: String(args.description || `${name}: a turn-based game.`),
  COLOUR: colour, BG: bg, BG_ICON: colour,
  SAVE_PREFIX: String(args['save-prefix'] || slug.replace(/-/g, '').slice(0, 4).toUpperCase()),
  DATE: today, SHAPE: shape, SHAPE_NAME: SHAPE_NAME[shape],
};

// ---------------------------------------------------------------- layouts
// [template, destination, kind]: kind 'infra' is laid by --fill; 'game' only in a new repo.
const COMMON_DOCS = [
  ['common/.gitignore', '.gitignore', 'game'],
  ['common/README.md', 'README.md', 'game'],
  ['common/docs/SPEC.md', 'docs/SPEC.md', 'game'],
  ['common/docs/DESIGN.md', 'docs/DESIGN.md', 'game'],
  ['common/docs/FRAME-template.md', 'docs/FRAME-template.md', 'infra'],
  ['common/docs/FRAME-PLAYTEST-template.md', 'docs/FRAME-PLAYTEST-template.md', 'infra'],
  ['common/.github/workflows/pages.yml', '.github/workflows/pages.yml', 'infra'],
  ['common/tools/browser.mjs', 'tools/browser.mjs', 'infra'],
  ['common/tools/make-icons.mjs', 'tools/make-icons.mjs', 'infra'],
  ['common/tools/stamp.mjs', 'tools/stamp.mjs', 'infra'],
  ['common/tools/smoke.mjs', 'tools/smoke.mjs', 'infra'],
  ['common/tools/check-bundle.mjs', 'tools/check-bundle.mjs', 'infra'],
];
const KIT = [
  ['kit/sim/stats.js', 'sim/stats.js', 'infra'],
  ['kit/sim/measure-lib.js', 'sim/measure-lib.js', 'infra'],
  ['kit/sim/run.js', 'sim/run.js', 'infra'],
];
const LAYOUT = {
  B: {
    files: [
      ...COMMON_DOCS, ...KIT,
      ['common/assets/manifest.webmanifest', 'assets/manifest.webmanifest', 'game'],
      ['common/sw.js', 'sw.js', 'infra'],
      ['common/src/ui/sw-register.js', 'src/ui/sw-register.js', 'infra'],
      ['common/src/ui/storage.js', 'src/ui/storage.js', 'infra'],
      ['common/tools/build-site.mjs', 'tools/build-site.mjs', 'infra'],
      ['shape-B/', '', 'game'],
    ],
    vars: {
      ICON_DIR: '', ICON_SRC: 'assets/icon.svg', ICON_OUT: 'assets',
      SMOKE_DIR: '.', SMOKE_TABS: "['[data-tab=\"play\"]', '[data-tab=\"ledger\"]', '[data-tab=\"menu\"]']",
      SITE_DIR: 'dist/site', SINGLE_FILE: `dist/${slug}.html`,
      RUN_CMD: 'npm run serve        # then open http://localhost:8000\nnpm run build        # dist/<slug>.html (one file), dist/site/ (installable)',
      CHECK_DESC: 'tests, a 50-game bot batch, the bundle, the bundle check, the phone smoke test',
      LAYOUT: '```\nsrc/data/     logic-free tables\nsrc/engine/   pure: rng, state (save contract), turn, derive, ledger\nsrc/ui/       screens; read the engine, compute nothing\nsim/          bot, adapter, game-measure kit\ntest/         invariants, save contract, fixtures\ntools/        bundle, check-bundle, smoke, icons, stamp, browser\n```',
      CI_SETUP: '', CI_TEST: 'node --test "test/*.test.js" && node sim/run.js --runs=50 --by=policy', CI_BUILD: 'node tools/bundle.js',
      CI_ICONS: 'icon-180.png icon-192.png icon-512.png maskable-512.png',
    },
    icon: 'assets/icon.svg',
  },
  C: {
    files: [
      ...COMMON_DOCS,
      ['common/assets/manifest.webmanifest', 'public/manifest.webmanifest', 'game'],
      ['common/sw.js', 'public/sw.js', 'infra'],
      ['common/src/ui/sw-register.js', 'src/ui/sw-register.js', 'infra'],
      ['common/src/ui/storage.js', 'src/ui/storage.js', 'infra'],
      ['shape-C/', '', 'game'],
    ],
    vars: {
      ICON_DIR: 'icons/', ICON_SRC: 'public/icons/icon.svg', ICON_OUT: 'public/icons',
      SMOKE_DIR: 'dist', SMOKE_TABS: "['[data-tab=\"story\"]', '[data-tab=\"journal\"]', '[data-tab=\"menu\"]']",
      SITE_DIR: 'dist', SINGLE_FILE: '',
      RUN_CMD: 'npm install\nnpm run dev          # Vite dev server\nnpm run build        # dist/ (installable, build id stamped)',
      CHECK_DESC: 'content build, typecheck, build, tests, a 200-story bot batch, the site check, the phone smoke test',
      LAYOUT: '```\ncontent/      YAML scenes (compiled to src/content/bundle.json)\nsrc/content/  schema (Zod) and the compiled bundle\nsrc/engine/   pure: story facade, rng\nsrc/ui/       Preact screens; read the engine, compute nothing\ntools/        build-content, bot, smoke, check-bundle, icons, stamp\ntests/        Vitest\n```',
      CI_SETUP: '      - run: npm ci', CI_TEST: 'npm test', CI_BUILD: 'npm run build',
      CI_ICONS: 'icons/icon-180.png icons/icon-192.png icons/icon-512.png icons/maskable-512.png',
    },
    icon: 'public/icons/icon.svg',
  },
  A: {
    files: [
      ...COMMON_DOCS,
      ['common/assets/manifest.webmanifest', 'manifest.webmanifest', 'game'],
      ['common/sw.js', 'sw.js', 'infra'],
      ['common/tools/build-site.mjs', 'tools/build-site.mjs', 'infra'],
      ['shape-A/', '', 'game'],
    ],
    vars: {
      ICON_DIR: 'icons/', ICON_SRC: 'icons/icon.svg', ICON_OUT: 'icons',
      SMOKE_DIR: '.', SMOKE_TABS: "['[data-tab=\"play\"]', '[data-tab=\"ledger\"]', '[data-tab=\"menu\"]']",
      SITE_DIR: 'dist/site', SINGLE_FILE: '',
      RUN_CMD: 'npm run serve        # then open http://localhost:8000\nnpm run build        # dist/site/ (installable, build id stamped)',
      CHECK_DESC: 'the site build, the site check, the phone smoke test',
      LAYOUT: '```\nindex.html    the whole game\nicons/        app icons (icon.svg is the source)\ntools/        build-site, check-bundle, smoke, icons, stamp, browser\n```',
      CI_SETUP: '', CI_TEST: 'node -e "process.exit(0)"  # shape A has no headless tests: npm run check locally', CI_BUILD: 'node tools/build-site.mjs',
      CI_ICONS: 'icons/icon-180.png icons/icon-192.png icons/icon-512.png icons/maskable-512.png',
    },
    icon: 'icons/icon.svg',
  },
};

// Files that are copies of an OLDER version of this kit, recognised by their first line.
const OLD_KIT = {
  'sw.js': ['// Service worker for a static, backend-free game. Copy to the site root'],
  'sw-register.js': ['// Page side of sw.js. Call registerSW(onUpdate) once after the first render.'],
  'storage.js': ['// Storage that cannot take the page down. Copy into src/ui/storage.js'],
  'stats.js': ['// Measurement helpers for balance harnesses. Copy into sim/ or tools/.'],
};

// ---------------------------------------------------------------- helpers
async function walk(d) {
  const out = [];
  for (const n of await readdir(d)) {
    const p = join(d, n);
    if ((await stat(p)).isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const TEXT = /\.(js|mjs|ts|tsx|json|webmanifest|md|html|css|yml|yaml|txt|svg|sh)$|^\.gitignore$|^\.nojekyll$/;
const JSONISH = /\.(json|webmanifest)$/;
function fillVars(text, file, vars) {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`${file}: unknown template variable ${m}`);
    return JSONISH.test(file) ? JSON.stringify(String(vars[k])).slice(1, -1) : vars[k];
  });
}
const added = [], skipped = [], upgraded = [], fixed = [], report = [];

async function lay(layout, vars, target, { only } = {}) {
  for (const [src, dest, kind] of layout.files) {
    if (only && kind !== only) continue;
    const from = join(T, src);
    const pairs = src.endsWith('/') ? (await walk(from)).map((f) => [f, join(target, dest, relative(from, f))]) : [[from, join(target, dest)]];
    for (const [f, to] of pairs) {
      const rel = relative(target, to);
      const content = TEXT.test(basename(f)) ? fillVars(await readFile(f, 'utf8'), rel, vars) : null;
      if (await exists(to)) {
        const first = (await readFile(to, 'utf8').catch(() => '')).split('\n')[0];
        if (args.upgrade && content && (OLD_KIT[basename(to)] || []).some((h) => first.startsWith(h))) {
          await writeFile(to, content); upgraded.push(rel);
        } else skipped.push(rel);
        continue;
      }
      await mkdir(dirname(to), { recursive: true });
      if (content !== null) await writeFile(to, content); else await copyFile(f, to);
      added.push(rel);
    }
  }
}

// ---------------------------------------------------------------- shape A: compile the B placeholder into one file
async function makeShapeA(vars) {
  const tmp = await mkdtemp(join(tmpdir(), 'scaffold-a-'));
  const bVars = { ...vars, ...LAYOUT.B.vars, SINGLE_FILE: `dist/${slug}.html` };
  const marks = [added.length, skipped.length, upgraded.length];
  await lay(LAYOUT.B, bVars, tmp);
  added.length = marks[0]; skipped.length = marks[1]; upgraded.length = marks[2];
  await writeFile(join(tmp, 'assets/icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'maskable-512.png']) await writeFile(join(tmp, 'assets', f), '');
  execFileSync('node', ['tools/bundle.js'], { cwd: tmp, stdio: 'pipe' });
  let html = await readFile(join(tmp, 'dist/site/index.html'), 'utf8');
  const id = /sw\.js\?build=\$\{encodeURIComponent\(BUILD_ID\)\}/.test(html) ? /const BUILD_ID = '([^']+)'/.exec(html)?.[1] : null;
  if (!id) throw new Error('shape A: could not find the build id in the compiled page');
  html = html.split(id).join('__BUILD_ID__')
    .replace('href="icon-180.png"', 'href="icons/icon-180.png"')
    .replace('href="icon.svg"', 'href="icons/icon.svg"');
  for (const need of ['icons/icon-180.png', 'icons/icon.svg', '__BUILD_ID__']) if (!html.includes(need)) throw new Error(`shape A: compiled page lacks ${need}`);
  html = html.replace('<script type="module">', '<script type="module">\n// Shape A: the whole game in this file. It starts as the scaffold\'s placeholder\n// compiled from modules (each __m[...] block was one file); edit it freely.');
  await rm(tmp, { recursive: true, force: true });
  return html;
}

// ---------------------------------------------------------------- run
const layout = LAYOUT[shape];
const vars = { ...baseVars, ...layout.vars };

if (!fill) {
  if ((await exists(dir)) && (await readdir(dir)).filter((n) => n !== '.git').length) throw new Error(`${dir} is not empty. Use --fill to add only what is missing.`);
  await mkdir(dir, { recursive: true });
  await lay(layout, vars, dir);
  if (shape === 'A') {
    await writeFile(join(dir, 'index.html'), await makeShapeA(baseVars)); added.push('index.html');
    await writeFile(join(dir, 'package.json'), JSON.stringify({ name: slug, private: true, type: 'module', description: vars.DESCRIPTION, scripts: {
      build: 'node tools/build-site.mjs', smoke: 'node tools/smoke.mjs', 'check-bundle': 'node tools/check-bundle.mjs', icons: 'node tools/make-icons.mjs',
      check: 'node tools/build-site.mjs && node tools/check-bundle.mjs && node tools/smoke.mjs', serve: 'python3 -m http.server 8000' } }, null, 2) + '\n');
    added.push('package.json');
  }
  await writeFile(join(dir, '.nojekyll'), ''); added.push('.nojekyll');
} else {
  // An existing repo: the workflow's commands come from what the repo has, not from the template.
  const pkg = (await exists(join(dir, 'package.json'))) ? await readJson(join(dir, 'package.json')) : { scripts: {} };
  const sc = pkg.scripts || {};
  const browserish = /smoke|check-bundle|playwright|pwa/;
  // Copy the command itself, not `npm run check`: check should grow browser
  // tests (smoke, check-bundle) that CI has no browser for.
  if (sc.test && !browserish.test(sc.test)) vars.CI_TEST = 'npm test';
  else if (sc.check && !browserish.test(sc.check)) vars.CI_TEST = sc.check;
  else { vars.CI_TEST = 'node -e "process.exit(0)"  # TODO: the headless tests (no browser in CI)'; report.push('pages.yml: no headless test command found; set the Test step'); }
  vars.SINGLE_FILE = '';
  if (await exists(join(dir, 'tools/bundle.js'))) { vars.CI_BUILD = 'node tools/bundle.js'; }
  else if (sc.build && !/vite/.test(sc.build)) vars.CI_BUILD = 'npm run build';
  else if (await exists(join(dir, 'vite.config.ts'))) { vars.CI_BUILD = 'npm run build && node tools/stamp.mjs dist'; vars.SITE_DIR = 'dist'; vars.CI_SETUP = '      - run: npm ci'; }
  else vars.CI_BUILD = 'node tools/build-site.mjs';
  const manRel = /<link[^>]+rel="manifest"[^>]+href="([^"]+)"/.exec(await readFile(join(dir, 'index.html'), 'utf8').catch(() => ''))?.[1];
  if (manRel && (await exists(join(dir, manRel)))) {
    const icons = ((await readJson(join(dir, manRel))).icons || []).map((i) => i.src).filter((s) => /\.png$/.test(s));
    vars.CI_ICONS = [...icons, 'icons/maskable-512.png'].filter((v, i, a) => a.indexOf(v) === i).join(' ');
  }
  await lay(layout, vars, dir, { only: 'infra' });
}

// ---------------------------------------------------------------- icon
const iconPath = join(dir, layout.icon);
if (!fill && !(await exists(iconPath))) {
  await mkdir(dirname(iconPath), { recursive: true });
  if (args.icon) await copyFile(resolve(String(args.icon)), iconPath);
  else await writeFile(iconPath, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${colour}"/><text x="32" y="44" font-family="Georgia,serif" font-size="38" font-weight="700" text-anchor="middle" fill="#fff">${name.trim()[0].toUpperCase()}</text></svg>\n`);
  added.push(relative(dir, iconPath));
}
if (!fill && !args['no-icons']) {
  try { execFileSync('node', ['tools/make-icons.mjs'], { cwd: dir, stdio: 'pipe' }); console.log('icons rendered'); }
  catch (e) { report.push(`!! icons not rendered (${String(e.stderr || e.message).split('\n')[0]}); run: node tools/make-icons.mjs`); }
}

// ---------------------------------------------------------------- the v1 save fixture (shape B)
if (!fill && shape === 'B') {
  await mkdir(join(dir, 'test/fixtures'), { recursive: true });
  const code = `import { newGame, advance, view } from './src/engine/turn.js';
let s = newGame({ seed: 12345 });
for (let i = 0; i < 3; i++) s = advance(s, { action: view(s).actions.find((a) => a.ok).id }).state;
process.stdout.write(JSON.stringify(s, null, 2));`;
  const out = execFileSync('node', ['--input-type=module', '-e', code], { cwd: dir, encoding: 'utf8' });
  await writeFile(join(dir, 'test/fixtures/v1-save.json'), out + '\n'); added.push('test/fixtures/v1-save.json');
}

// ---------------------------------------------------------------- audit (always; fixes what is safe)
async function audit() {
  const idx = join(dir, 'index.html');
  if (!(await exists(idx))) { report.push('!! no index.html at the repo root (shape C keeps it at the root too)'); return; }
  const html = await readFile(idx, 'utf8');
  const manHref = /<link[^>]+rel="manifest"[^>]+href="([^"]+)"/.exec(html)?.[1];
  let manPath = null;
  if (manHref && !manHref.startsWith('data:')) for (const p of [join(dir, manHref), join(dir, 'public', manHref)]) if (await exists(p)) { manPath = p; break; }
  if (!manHref) report.push('!! index.html links no manifest');
  else if (!manPath) report.push(`!! manifest ${manHref} not found`);
  else {
    const man = await readJson(manPath);
    const manDir = dirname(manPath);
    let changed = false;
    if (!man.id) { man.id = `/${repo}/`; changed = true; fixed.push(`manifest: added "id": "/${repo}/"`); }
    if (man.display !== 'standalone') report.push(`manifest display is "${man.display}", not standalone`);
    const icons = man.icons || [];
    for (const i of icons) if (!(await exists(join(manDir, i.src)))) report.push(`!! manifest icon ${i.src} does not exist`);
    if (!icons.some((i) => /maskable/.test(i.purpose || ''))) {
      const svg = icons.find((i) => /\.svg$/.test(i.src))?.src || /<link[^>]+rel="icon"[^>]+href="([^"]+\.svg)"/.exec(html)?.[1];
      if (svg && (await exists(join(manDir, svg))) && (await exists(join(dir, 'tools/browser.mjs')))) {
        const outDir = dirname(join(manDir, svg));
        // The kit's renderer, not the repo's: an older tools/make-icons.mjs may
        // ignore its arguments and never write a maskable icon (Imperator's did).
        const tmpTool = join(dir, 'tools', `_make-icons-${process.pid}.mjs`);
        await writeFile(tmpTool, fillVars(await readFile(join(T, 'common/tools/make-icons.mjs'), 'utf8'), 'tools/make-icons.mjs', { ...vars, BG_ICON: man.theme_color || colour }));
        try {
          // render into a scratch folder and take only the maskable icon: --fill never overwrites
          const scratch = await mkdtemp(join(tmpdir(), 'icons-'));
          execFileSync('node', [tmpTool, join(manDir, svg), scratch], { cwd: dir, stdio: 'pipe' });
          if (!(await exists(join(scratch, 'maskable-512.png')))) throw new Error('the renderer ran but wrote no maskable-512.png');
          await copyFile(join(scratch, 'maskable-512.png'), join(outDir, 'maskable-512.png'));
          await rm(scratch, { recursive: true, force: true });
          icons.push({ src: relative(manDir, join(outDir, 'maskable-512.png')), sizes: '512x512', type: 'image/png', purpose: 'maskable' });
          man.icons = icons; changed = true;
          fixed.push(`manifest: rendered ${relative(dir, join(outDir, 'maskable-512.png'))} from ${svg} and added it as the maskable icon`);
        } catch (e) { report.push(`!! no maskable icon, and rendering one failed: ${String(e.stderr || e.message).split('\n')[0]}`); }
        finally { await rm(tmpTool, { force: true }); }
      } else report.push('!! no maskable icon (Android shows the icon small on a white plate); no SVG source found to render one');
    }
    if (changed) await writeFile(manPath, JSON.stringify(man, null, 2) + '\n');
  }
  const swCandidates = [join(dir, 'sw.js'), join(dir, 'public/sw.js')];
  const swPath = (await Promise.all(swCandidates.map(exists))).findIndex(Boolean);
  if (swPath < 0) report.push('!! no service worker: not installable offline');
  else {
    const sw = await readFile(swCandidates[swPath], 'utf8');
    if (!sw.includes('__BUILD_ID__')) report.push(`!! ${relative(dir, swCandidates[swPath])} has a hand-named cache (no __BUILD_ID__): returning players miss updates unless someone remembers to bump it. Re-run with --upgrade if it is an old kit copy, else replace it with the template and stamp the build.`);
  }
  if (/fonts\.googleapis\.com/.test(html)) report.push('fonts load from Google: offline the game loses its typography and the privacy line must name it. Self-host them (Vikingr bundles @fontsource).');
  const pkgPath = join(dir, 'package.json');
  if (await exists(pkgPath)) {
    const pkg = await readJson(pkgPath);
    const check = pkg.scripts?.check || '';
    if (!check) report.push('!! no npm run check');
    else {
      if (!/smoke/.test(check)) report.push('npm run check does not run the phone smoke test (tools/smoke.mjs): add it');
      if (!/check-bundle|pwa/.test(check)) report.push('npm run check does not check the installable build (tools/check-bundle.mjs): add it after the build');
    }
  }
  const gi = join(dir, '.gitignore');
  const giText = (await exists(gi)) ? await readFile(gi, 'utf8') : '';
  const want = ['node_modules/', 'dist/', 'out/', 'tools/_*', '*.tmp.*'];
  const missing = want.filter((w) => !giText.split('\n').map((l) => l.trim()).includes(w));
  if (missing.length) { await writeFile(gi, giText.replace(/\n*$/, '\n') + `# scratch and output (game-scaffold)\n${missing.join('\n')}\n`); fixed.push(`.gitignore: added ${missing.join(' ')}`); }
  if (!(await exists(join(dir, '.nojekyll')))) { await writeFile(join(dir, '.nojekyll'), ''); fixed.push('added .nojekyll'); }
  const fixtures = (await exists(join(dir, 'test/fixtures'))) ? (await readdir(join(dir, 'test/fixtures'))).filter((f) => /save/.test(f)) : [];
  const tFix = (await exists(join(dir, 'tests/fixtures'))) ? (await readdir(join(dir, 'tests/fixtures'))) : [];
  if (shape !== 'A' && !fixtures.length && !tFix.length) report.push('!! no save fixtures: every save version that ships needs one that loads and plays on (test/save-contract.test.js pattern)');
  const wf = join(dir, '.github/workflows');
  const flows = (await exists(wf)) ? await readdir(wf) : [];
  if (flows.length > 1) report.push(`several workflows (${flows.join(', ')}): check only one deploys Pages`);
}
await audit();

// ---------------------------------------------------------------- verify nothing is left unfilled
for (const rel of [...added, ...upgraded]) {
  const p = join(dir, rel);
  if (!TEXT.test(basename(p))) continue;
  const left = (await readFile(p, 'utf8')).match(/\{\{[A-Z_]+\}\}/g);
  if (left) throw new Error(`${rel}: unfilled ${[...new Set(left)].join(', ')}`);
}

// ---------------------------------------------------------------- report
console.log(`\n${fill ? 'Filled' : 'Scaffolded'} ${dir} (shape ${shape}: ${SHAPE_NAME[shape]})`);
const list = (title, xs, mark) => { if (xs.length) { console.log(`${title} (${xs.length}):`); for (const x of xs) console.log(`  ${mark} ${x}`); } };
list('added', added, '+');
list('upgraded from an older kit copy', upgraded, '^');
list('fixed', fixed, '*');
list('kept as they are', fill ? skipped : [], '=');
list('to look at', report, '-');
const where = relative(process.cwd(), dir);
console.log(`
Next:
  cd ${where.startsWith('../..') ? dir : where || '.'}
${shape === 'C' ? '  npm install\n' : ''}  npm run check                      # must pass before the first commit
${fill ? '  git diff                           # review what was added and fixed\n' : '  git init && git add -A && git commit -m "Scaffold ' + name + '"\n  docs/SPEC.md                       # stage 1: the one-page spec\n'}  Pages: the workflow deploys from the default branch. If Pages was ever set to
  "Deploy from a branch", switch Settings > Pages > Source to "GitHub Actions" once.`);
