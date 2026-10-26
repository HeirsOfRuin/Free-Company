// What can never be true. Impossibility assertions, not magnitudes: magnitude
// asserts get deleted on the first rebalance, impossibility asserts survive it.
// Each test also plays real games through the bot, so "it held" means it held
// over games that actually happened.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, advance, view } from '../src/engine/turn.js';
import { decide } from '../sim/bot.js';

function playThrough(seed, policy = 'steady', difficulty = 'normal', each = () => {}) {
  let s = newGame({ seed, difficulty });
  for (let i = 0; !s.over && i < 1000; i++) {
    s = advance(s, { action: decide(s, policy) }).state;
    each(s);
  }
  return s;
}

test('purse equals the ledger, every turn', () => {
  for (let seed = 1; seed <= 40; seed++) {
    playThrough(seed, seed % 2 ? 'steady' : 'random', 'normal', (s) => {
      const sum = s.ledger.reduce((a, r) => a + r.amount, 0);
      assert.equal(s.money, sum, `seed ${seed} turn ${s.turn}`);
    });
  }
});

test('no number is ever NaN or infinite', () => {
  for (let seed = 1; seed <= 40; seed++) {
    playThrough(seed, 'random', 'hard', (s) => {
      for (const k of ['money', 'strength', 'turn']) assert.ok(Number.isFinite(s[k]), `${k} at seed ${seed}`);
    });
  }
});

test('every game ends, and the clock advances every turn', () => {
  for (let seed = 1; seed <= 40; seed++) {
    let last = 0;
    const s = playThrough(seed, 'random', 'normal', (st) => { assert.ok(st.turn > last); last = st.turn; });
    assert.ok(s.over, `seed ${seed} never ended`);
    assert.ok(['win', 'lost', 'out of time'].includes(s.outcome));
  }
});

test('same seed and same choices give the same game', () => {
  const a = playThrough(7, 'random'), b = playThrough(7, 'random');
  assert.deepEqual(a, b);
});

test('an action the view marks as not allowed is refused by the engine', () => {
  let s = newGame({ seed: 3 });
  while (view(s).actions.find((x) => x.id === 'work').ok) s = advance(s, { action: 'work' }).state;
  assert.throws(() => advance(s, { action: 'work' }), /not allowed/);
});
