// sim/adapter.js — connects this game to the game-measure kit (sim/run.js,
// sim/ablate.js, ...). The kit files are not edited per game; this one is.
// Contract: see game-measure's templates/adapter.js.

import { newGame, advance } from '../src/engine/turn.js';
import { decide, POLICIES } from './bot.js';

export const axes = { policy: POLICIES, difficulty: ['easy', 'normal', 'hard'] };
export const defaults = { policy: 'steady', difficulty: 'normal' };

export function play(seed, opts = {}) {
  let s = newGame({ seed, difficulty: opts.difficulty || 'normal' });
  for (let guard = 0; !s.over && guard < 10000; guard++) {
    s = advance(s, { action: decide(s, opts.policy) }).state;
  }
  return s;
}

export function progress(s) {
  const missing = [];
  if (!s.over) missing.push('never ended');
  if (s.history.length < 3) missing.push(`only ${s.history.length} turns played`);
  return missing;
}

export function metrics(s) {
  return {
    win: s.outcome === 'win',
    lost: s.outcome === 'lost',
    turns: s.history.length,
    money: s.money,
  };
}

export function digest(s) {
  return JSON.stringify([s.outcome, s.turn, s.money, s.strength]);
}

export function trace(s) {
  return s.history.map((h) => `turn ${String(h.turn).padStart(2)}  ${h.action.padEnd(5)}  money ${String(h.money).padStart(4)}  strength ${h.strength}  ${h.notes.join(' ')}`).join('\n') + `\n${s.outcome}`;
}
