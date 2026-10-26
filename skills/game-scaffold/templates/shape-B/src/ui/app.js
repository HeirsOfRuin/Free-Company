// The screens. Reads the engine (view, derive), computes nothing itself.
//
// Patterns every screen keeps (game-building rules):
//  - Empty and locked states say why and what would change them (rule 6).
//  - Saves autosave after every turn; text export/import moves a game between
//    devices or between the itch copy and the installed copy.
//  - A throw never leaves a dead button: busy is released in finally, and the
//    error screen offers the save (Touchline lost a career to a greyed-out Continue).

import { newGame, advance, view } from '../engine/turn.js';
import { SAVE_KEY, serialize, deserialize, toCode, fromCode } from '../engine/state.js';
import { STORAGE_OK, lsGet, lsSet } from './storage.js';
import { registerSW, installPrompt } from './sw-register.js';

const app = document.getElementById('app');
let state = null;
let tab = 'play';
let modal = null;
let busy = false;
let banner = null;
let install = null;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function save() { if (state) lsSet(SAVE_KEY, serialize(state)); }
function load() {
  const raw = lsGet(SAVE_KEY);
  if (!raw) return null;
  try { return deserialize(raw); } catch (e) { banner = `The saved game could not be read (${e.message}).`; return null; }
}

function title() {
  const saved = load();
  app.innerHTML = `
    <main class="title">
      <h1>{{NAME}}</h1>
      <p class="lede">{{DESCRIPTION}}</p>
      ${STORAGE_OK ? '' : '<p class="warn">This browser is refusing to store anything for this page, so progress will not be kept. Open the game in its own tab, or copy a save code from the menu before you leave.</p>'}
      ${banner ? `<p class="warn">${esc(banner)}</p>` : ''}
      <div class="stack">
        ${saved ? '<button class="primary" data-act="continue">Continue</button>' : ''}
        <button ${saved ? '' : 'class="primary"'} data-act="new">New game</button>
        <button data-act="load-code">Load a save code</button>
        ${install ? '<button data-act="install">Install on this device</button>' : ''}
      </div>
    </main>`;
}

function render() {
  if (!state) return title();
  const v = view(state);
  const tabs = [['play', 'Play'], ['ledger', 'Ledger'], ['menu', 'Menu']];
  app.innerHTML = `
    <header class="hud">
      <span class="turn">Turn ${Math.min(v.turn, v.turns)} of ${v.turns}</span>
      <span class="money">${v.money} / ${v.target}</span>
      <span class="strength">Strength ${v.strength}</span>
    </header>
    ${banner ? `<p class="banner">${esc(banner)} <button data-act="dismiss">OK</button></p>` : ''}
    <main class="panel">${tab === 'play' ? playTab(v) : tab === 'ledger' ? ledgerTab() : menuTab()}</main>
    <nav class="tabs">${tabs.map(([id, label]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}">${label}</button>`).join('')}</nav>
    ${modal ? `<div class="scrim"><div class="sheet">${modal}</div></div>` : ''}`;
}

function playTab(v) {
  if (v.over) {
    return `<h2>${v.outcome === 'win' ? 'You made it.' : v.outcome === 'lost' ? 'The season broke you.' : 'The season ran out.'}</h2>
      <p>Treasury ${v.money} against a target of ${v.target}, after ${v.turn - 1} turns.</p>
      <button class="primary" data-act="new">Play again</button>`;
  }
  return `<h2>What now?</h2>
    <p class="hint">Reach ${v.target} by the end of turn ${v.turns}. Upkeep is ${v.actions[0].upkeep} a turn.</p>
    <div class="stack">${v.actions.map((a) => `
      <button data-action="${a.id}" ${a.ok ? '' : 'disabled'}>
        <strong>${a.label}</strong> <span>${a.earn ? `+${a.earn}` : 'no pay'}${a.risk ? `, ${Math.round(a.risk * 100)}% chance to lose ${a.loss}` : ''}; strength ${a.strength > 0 ? '+' : ''}${a.strength}</span>
        <small>${esc(a.ok ? a.note : a.why)}</small>
      </button>`).join('')}</div>`;
}

function ledgerTab() {
  const rows = state.ledger.slice(-30).reverse();
  if (rows.length <= 1) return '<h2>Ledger</h2><p class="empty">Nothing yet: every coin earned or spent appears here from your first turn.</p>';
  return `<h2>Ledger</h2><table class="ledger">${rows.map((r) => `<tr><td>T${r.turn}</td><td>${esc(r.reason)}</td><td class="num">${r.amount > 0 ? '+' : ''}${r.amount}</td></tr>`).join('')}</table>`;
}

function menuTab() {
  return `<h2>Menu</h2><div class="stack">
    <button data-act="export">Copy a save code</button>
    <button data-act="load-code">Load a save code</button>
    <button data-act="quit">Back to the title</button>
  </div>
  <p class="hint">Saves live in this browser on this device. A save code moves a game anywhere.</p>`;
}

function report(r) {
  const lines = Object.entries(r.account).map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${n > 0 ? '+' : ''}${n}</td></tr>`).join('');
  return `<h2>Turn ${r.turn}</h2>
    <table class="ledger">${lines}</table>
    ${r.notes.map((n) => `<p>${esc(n)}</p>`).join('')}
    <p>Treasury ${r.money}, strength ${r.strength}.</p>
    <button class="primary" data-act="close">Continue</button>`;
}

function fail(err) {
  console.error(err);
  modal = `<h2>Something went wrong</h2>
    <p>${esc(err?.message || err)}</p>
    <p>Your game was saved before this turn. Copy this code somewhere safe, then reload:</p>
    <textarea readonly rows="4">${state ? esc(toCode(state)) : ''}</textarea>
    <button class="primary" data-act="close">Close</button>`;
  render();
}

app.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act],[data-tab],[data-action]');
  if (!t || busy) return;
  busy = true;
  try {
    if (t.dataset.tab) { tab = t.dataset.tab; }
    else if (t.dataset.action) {
      const { state: next, record } = advance(state, { action: t.dataset.action });
      state = next; save(); modal = report(record);
    } else {
      const act = t.dataset.act;
      if (act === 'new') { state = newGame({ seed: (Math.random() * 2 ** 31) >>> 0 }); tab = 'play'; modal = null; save(); }
      else if (act === 'continue') { state = load(); }
      else if (act === 'close') { modal = null; }
      else if (act === 'dismiss') { banner = null; }
      else if (act === 'quit') { state = null; modal = null; }
      else if (act === 'install') { install?.(); }
      else if (act === 'export') { modal = `<h2>Save code</h2><textarea readonly rows="5">${esc(toCode(state))}</textarea><button class="primary" data-act="close">Done</button>`; }
      else if (act === 'load-code') {
        const code = prompt('Paste a save code');
        if (code) { try { state = fromCode(code); save(); tab = 'play'; modal = null; } catch (err) { banner = err.message; } }
      }
    }
    render();
  } catch (err) { fail(err); } finally { busy = false; }
});

addEventListener('error', (e) => fail(e.error || e.message));
addEventListener('unhandledrejection', (e) => fail(e.reason));

installPrompt((go) => { install = go; if (!state) title(); });
render();
registerSW({ onUpdate: (reload) => { banner = 'A new version is ready.'; modal = null; render(); app.querySelector('.banner')?.insertAdjacentHTML('beforeend', ' <button data-act="reload-now">Reload</button>'); app.querySelector('[data-act="reload-now"]')?.addEventListener('click', reload); } });

// For tools/smoke.mjs and tools/check-bundle.mjs: read-only access to the game.
globalThis.__game = { get state() { return state; } };

