// Logic-free tables. Every number a designer might tune lives in src/data/, and
// nothing in src/data/ computes anything. Placeholder game: replace freely.
//
// The placeholder: a season of TURNS turns. Each turn the player works, trades
// or rests. Work earns, trade earns more but risks a loss, rest restores
// strength. Reach the target treasury by the last turn to win; fall into debt
// and the season ends early. At zero strength only rest is open.

export const CONFIG = {
  turns: 24,
  startMoney: 20,
  startStrength: 5,
  target: 120,
  upkeep: 2,
};

export const DIFFICULTY = {
  easy: { label: 'Easy', targetMult: 0.8, riskMult: 0.7 },
  normal: { label: 'Normal', targetMult: 1, riskMult: 1 },
  hard: { label: 'Hard', targetMult: 1.25, riskMult: 1.3 },
};

export const ACTIONS = {
  work: { label: 'Work', earn: 6, strength: -1, risk: 0, note: 'Steady pay. Costs strength.' },
  trade: { label: 'Trade', earn: 11, strength: -1, risk: 0.3, loss: 9, note: 'Pays better; sometimes the cargo is lost.' },
  rest: { label: 'Rest', earn: 0, strength: 2, risk: 0, note: 'Earns nothing. Restores strength.' },
};
