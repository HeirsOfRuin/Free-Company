// The only place money moves. Every change writes a ledger row in the same call,
// so the purse and the ledger cannot disagree (test/invariants.test.js asserts
// purse == start + sum(ledger)). The turn report and any "where did the money
// go" screen are read off the ledger, never estimated (Silk Road's coin(),
// The Lists' purse-equals-ledger test, which caught card money bypassing it).

export function coin(state, amount, reason, turn = state.turn) {
  if (!Number.isFinite(amount)) throw new Error(`coin: non-finite amount for "${reason}"`);
  state.money += amount;
  state.ledger.push({ turn, amount, reason });
  return state.money;
}

/** Sum of ledger rows for one turn, grouped by reason (for the turn report). */
export function turnAccount(state, turn) {
  const out = {};
  for (const r of state.ledger) if (r.turn === turn) out[r.reason] = (out[r.reason] || 0) + r.amount;
  return out;
}
