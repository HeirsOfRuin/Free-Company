// The save contract. Every save version that ever shipped has a fixture in
// test/fixtures/v<N>-save.json; each must load through migrate() and play on.
// When SAVE_VERSION goes up: add MIGRATIONS[old], and commit a fixture saved by
// the old build BEFORE changing it (The Lists keeps v1 to v6).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { SAVE_VERSION, MIGRATIONS, deserialize, serialize, toCode, fromCode, newGame } from '../src/engine/state.js';
import { advance, view } from '../src/engine/turn.js';

const dir = new URL('./fixtures/', import.meta.url);
const fixtures = readdirSync(dir).filter((f) => /^v\d+-save\.json$/.test(f)).sort();

test('there is a fixture for every save version up to the current one', () => {
  for (let v = 1; v <= SAVE_VERSION; v++) assert.ok(fixtures.includes(`v${v}-save.json`), `missing test/fixtures/v${v}-save.json`);
});

test('there is a migration from every older version', () => {
  for (let v = 1; v < SAVE_VERSION; v++) assert.equal(typeof MIGRATIONS[v], 'function', `no MIGRATIONS[${v}]`);
});

for (const f of fixtures) {
  test(`${f} loads and plays on`, () => {
    let s = deserialize(readFileSync(new URL(f, dir), 'utf8'));
    assert.equal(s.v, SAVE_VERSION);
    for (let i = 0; i < 3 && !s.over; i++) {
      const a = view(s).actions.find((x) => x.ok);
      s = advance(s, { action: a.id }).state;
    }
  });
}

test('a save code round-trips', () => {
  const s = newGame({ seed: 99 });
  assert.deepEqual(fromCode(toCode(s)), s);
  assert.deepEqual(deserialize(serialize(s)), s);
});

test('a save from a newer build is refused with a reason, not loaded wrongly', () => {
  assert.throws(() => deserialize(JSON.stringify({ ...newGame(), v: SAVE_VERSION + 1 })), /newer version/);
});
