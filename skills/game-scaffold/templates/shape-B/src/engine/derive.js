// Every number the player is shown, computed here and nowhere else. The engine,
// the UI and the bot all ask these functions, so the number shown and the number
// resolved cannot drift (Cradle's threat display read 2.36x while the wall broke
// at full strength; Centennial Farm's planning screen and engine disagreed by 7%).

import { CONFIG, DIFFICULTY, ACTIONS } from '../data/config.data.js';

export function target(state) {
  return Math.round(CONFIG.target * DIFFICULTY[state.difficulty].targetMult);
}

/** What an action will do, as the button shows it and as the turn resolves it. */
export function actionPreview(state, id) {
  const a = ACTIONS[id];
  if (!a) return null;
  const risk = a.risk * DIFFICULTY[state.difficulty].riskMult;
  const why = a.strength < 0 && state.strength + a.strength < 0 ? 'Too tired: rest first.' : null;
  return { id, label: a.label, note: a.note, earn: a.earn, loss: a.loss || 0, risk, strength: a.strength, upkeep: CONFIG.upkeep, ok: !why, why };
}

export function turnsLeft(state) {
  return Math.max(0, CONFIG.turns - state.turn + 1);
}
