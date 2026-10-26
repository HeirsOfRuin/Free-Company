// sim/adapter.js — the one file that connects this game to the measurement kit
// (run.js, ablate.js, curve.js, verify-claims.js). Everything game-specific is
// here; the tools never change.
//
// Required:
//   play(seed, opts) -> final state         deterministic: same seed + opts, same state
//     (or newGame(seed, opts), step(state, opts), done(state), clock(state):
//      the runner then drives the loop and fails any step that does not
//      advance the clock: a softlock is reported, not looped on)
//   progress(state) -> string[]             what did NOT happen; [] = a real game
//   metrics(state, opts) -> { name: boolean | number }
//                                           booleans become rates with SE,
//                                           numbers become median [p10–p90]
// Optional:
//   axes      { axis: [values] }            what --by and --pool range over
//   defaults  { axis: value }               the cell when nothing is given
//   seedFor(i, opts, seed0) -> seed         to reproduce an older tool's seeds exactly
//   digest(state) -> string                 the end state, for --inert
//   trace(state, opts) -> string            one game turn by turn, for --trace --seed=N

import { newGame, advance } from '../src/engine/turn.js';
import { decide } from './bot.js';

export const axes = {
  policy: ['steady', 'random'],
  difficulty: ['easy', 'normal', 'hard'],
};
export const defaults = { policy: 'steady', difficulty: 'normal' };

export function play(seed, opts = {}) {
  let s = newGame({ seed, difficulty: opts.difficulty });
  for (let guard = 0; !s.over && guard < 10000; guard++) {
    s = advance(s, decide(s, opts.policy)).state;
  }
  return s;
}

// The cheapest check in the kit. A harness that does not assert progress can
// report on games nobody played (Cradle: every campaign sat on turn 1 for three
// rounds; Centennial Farm: eleven years, zero harvests).
export function progress(s) {
  const missing = [];
  if (s.turn < 5) missing.push(`only reached turn ${s.turn}`);
  if (!s.over) missing.push('never ended');
  return missing;
}

export function metrics(s) {
  return {
    win: s.outcome === 'win',
    lost: s.outcome === 'lost',
    turns: s.turn,
    money: s.money,
  };
}

export function digest(s) {
  return JSON.stringify([s.outcome, s.turn, s.money, s.ledger.length]);
}

export function trace(s) {
  return s.history.map((h) => `turn ${h.turn}: money ${h.money} ${h.note || ''}`).join('\n');
}
