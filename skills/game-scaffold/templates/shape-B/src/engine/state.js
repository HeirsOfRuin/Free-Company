// New game, the save contract, and migrations.
//
// The save KEY is a contract: renaming it orphans every save on every device
// (Silk Road kept its old key after the retitle on purpose). The payload carries
// `v`; MIGRATIONS[v] upgrades version v to v + 1. Every version that ever
// shipped gets a fixture in test/fixtures/ that must load and play on
// (test/save-contract.test.js). Ids and counters live IN STATE, never in module
// variables, or one seed gives different games in a batch (Centennial Farm).

import { CONFIG, DIFFICULTY } from '../data/config.data.js';

export const SAVE_KEY = '{{SLUG}}.save.v1'; // never rename
export const SAVE_VERSION = 1;
export const CODE_PREFIX = '{{SAVE_PREFIX}}1.';

export function newGame({ seed = 1, difficulty = 'normal' } = {}) {
  if (!DIFFICULTY[difficulty]) throw new Error(`unknown difficulty: ${difficulty}`);
  return {
    v: SAVE_VERSION,
    seed: seed >>> 0,
    difficulty,
    turn: 1,
    money: CONFIG.startMoney,
    strength: CONFIG.startStrength,
    ledger: [{ turn: 0, amount: CONFIG.startMoney, reason: 'start' }],
    history: [],
    over: false,
    outcome: null,
    nextId: 1,
  };
}

/** MIGRATIONS[v](save) returns the save at version v + 1. Add one per version bump. */
export const MIGRATIONS = {
  // 1: (s) => ({ ...s, v: 2, newField: defaultValue }),
};

export function migrate(save) {
  let s = save;
  if (!s || typeof s !== 'object' || !Number.isInteger(s.v)) throw new Error('not a save');
  if (s.v > SAVE_VERSION) throw new Error(`save is from a newer version (${s.v}) than this build (${SAVE_VERSION})`);
  while (s.v < SAVE_VERSION) {
    const step = MIGRATIONS[s.v];
    if (!step) throw new Error(`no migration from save version ${s.v}`);
    s = step(s);
  }
  return s;
}

export const serialize = (state) => JSON.stringify(state);
export const deserialize = (text) => migrate(JSON.parse(text));

/** A save as text, to move between devices or between itch and the Pages copy. */
export function toCode(state) {
  const b64 = btoa(unescape(encodeURIComponent(serialize(state))));
  return CODE_PREFIX + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromCode(code) {
  const text = String(code).trim();
  if (!text.startsWith(CODE_PREFIX.slice(0, -2))) throw new Error('That is not a save code for this game.');
  const body = text.slice(text.indexOf('.') + 1).replace(/-/g, '+').replace(/_/g, '/');
  return deserialize(decodeURIComponent(escape(atob(body))));
}
