// The reference player. It does not need to play WELL; it needs to play
// CONSISTENTLY, so two runs are comparable. Rules:
//  - It acts only through what the view offers (as Imperator's bot does through
//    act() and view()), so a choice the screen allows but the engine refuses
//    is caught.
//  - It answers every decision explicitly. Leaning on an engine default means a
//    future change to that default silently retunes the reference player
//    (Centennial Farm).
//  - Write down what it never does: those levers are unmeasured until it does.
//    (This bot never trades when strength is below 2.)

import { view } from '../src/engine/turn.js';
import { streamFor } from '../src/engine/rng.js';

export const POLICIES = ['steady', 'random'];

export function decide(state, policy = 'steady') {
  const v = view(state);
  const ok = v.actions.filter((a) => a.ok);
  if (!ok.length) throw new Error(`no action allowed at turn ${state.turn}`);
  if (policy === 'random') return streamFor(state.seed, state.turn, 'bot').pick(ok).id;
  if (state.strength <= 1) return 'rest';
  const trade = ok.find((a) => a.id === 'trade');
  if (trade && state.strength >= 2 && v.money > trade.loss + 4) return 'trade';
  return ok.find((a) => a.id === 'work')?.id || 'rest';
}
