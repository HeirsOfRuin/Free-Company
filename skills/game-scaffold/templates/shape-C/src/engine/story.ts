// The story engine. Pure: (state, input, content) -> new state. No DOM, no
// Date.now(), no Math.random(): randomness comes from rng.js streams keyed by
// the seed in the state, so a save reproduces its future exactly.
// game-narrative's core (conditions, effects, checks, text grammar) replaces
// this file's internals; keep newGame / choose / view as the facade.
import type { ContentBundle } from '../content/schema';

export const SAVE_KEY = '{{SLUG}}.save.v1'; // never rename
export const SAVE_VERSION = 1;

export interface GameState {
  v: number; seed: number; scene: string; turn: number;
  journal: { turn: number; scene: string; choice: string }[];
  over: boolean; ending: string | null;
}

export function newGame(content: ContentBundle, seed = 1): GameState {
  return { v: SAVE_VERSION, seed: seed >>> 0, scene: content.start, turn: 1, journal: [], over: false, ending: null };
}

export function choose(content: ContentBundle, prev: GameState, choiceId: string): GameState {
  if (prev.over) throw new Error('the story is over');
  const scene = content.scenes[prev.scene];
  const c = scene?.choices.find((x) => x.id === choiceId);
  if (!scene || !c) throw new Error(`no choice ${choiceId} in ${prev.scene}`);
  const s: GameState = structuredClone(prev);
  s.journal.push({ turn: s.turn, scene: s.scene, choice: c.id });
  s.turn += 1;
  if (c.ending) { s.over = true; s.ending = c.ending; } else s.scene = c.next!;
  return s;
}

export function view(content: ContentBundle, s: GameState) {
  const scene = content.scenes[s.scene]!;
  return { turn: s.turn, title: scene.title, text: scene.text, over: s.over, ending: s.ending,
    choices: s.over ? [] : scene.choices.map((c) => ({ id: c.id, text: c.text })) };
}

export function migrate(save: unknown): GameState {
  const s = save as GameState;
  if (!s || typeof s !== 'object' || !Number.isInteger(s.v)) throw new Error('not a save');
  if (s.v > SAVE_VERSION) throw new Error(`save is from a newer version (${s.v})`);
  return s; // add migrations here as SAVE_VERSION rises; keep a fixture per version
}
