// The turn pipeline: one input in, one new state and one record out. Pure: no
// DOM, no Date.now(), no Math.random(). Same seed + same inputs = same game,
// which is what the bot, the tests and every balance measurement stand on.
//
// Phases run in this written order (Centennial Farm: five ordered phases, one
// record; ordering bugs were a whole failure class, F22):
//   1. the player's action   2. random events   3. upkeep   4. the clock   5. end check
// The turn report is a by-product of resolving the turn, so it cannot disagree with it.

import { CONFIG } from '../data/config.data.js';
import { streamFor } from './rng.js';
import { coin, turnAccount } from './ledger.js';
import { actionPreview, target } from './derive.js';
import { newGame } from './state.js';

export { newGame };

/** advance(state, { action }) -> { state, record }. Throws on an action the view said was not allowed. */
export function advance(prev, input) {
  if (prev.over) throw new Error('the game is over');
  const s = structuredClone(prev);
  const p = actionPreview(s, input?.action);
  if (!p) throw new Error(`unknown action: ${input?.action}`);
  if (!p.ok) throw new Error(`not allowed: ${p.why}`);
  const notes = [];

  // 1. the player's action
  const rng = streamFor(s.seed, s.turn, 'action');
  if (p.risk && rng.chance(p.risk)) {
    coin(s, -p.loss, 'cargo lost');
    notes.push(`The cargo was lost (−${p.loss}).`);
  } else if (p.earn) {
    coin(s, p.earn, p.label.toLowerCase());
  }
  s.strength = Math.max(0, s.strength + p.strength);

  // 2. random events (their own stream, so adding one never shifts the action rolls)
  const ev = streamFor(s.seed, s.turn, 'events');
  if (ev.chance(0.1)) { coin(s, 5, 'windfall'); notes.push('A windfall (+5).'); }

  // 3. upkeep
  coin(s, -CONFIG.upkeep, 'upkeep');

  // 4. the clock
  const account = turnAccount(s, s.turn);
  const record = { turn: s.turn, action: p.id, money: s.money, strength: s.strength, account, notes };
  s.history.push(record);
  s.turn += 1;

  // 5. end check
  if (s.money >= target(s)) { s.over = true; s.outcome = 'win'; }
  else if (s.money < 0) { s.over = true; s.outcome = 'lost'; }
  else if (s.turn > CONFIG.turns) { s.over = true; s.outcome = 'out of time'; }
  return { state: s, record };
}

/** Everything the UI shows, computed by the engine. The UI computes nothing. */
export function view(s) {
  return {
    turn: s.turn, turns: CONFIG.turns, money: s.money, strength: s.strength, target: target(s),
    over: s.over, outcome: s.outcome,
    actions: ['work', 'trade', 'rest'].map((id) => actionPreview(s, id)),
    last: s.history[s.history.length - 1] || null,
  };
}
