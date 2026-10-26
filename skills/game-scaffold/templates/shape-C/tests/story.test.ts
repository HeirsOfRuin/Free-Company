import { describe, expect, it } from 'vitest';
import bundle from '../src/content/bundle.json';
import type { ContentBundle } from '../src/content/schema';
import { newGame, choose, view, migrate } from '../src/engine/story';

const content = bundle as unknown as ContentBundle;

describe('story', () => {
  it('every choice the view offers is accepted, from every scene', () => {
    for (const scene of Object.values(content.scenes)) {
      const s = { ...newGame(content), scene: scene.id };
      for (const c of view(content, s).choices) expect(() => choose(content, s, c.id)).not.toThrow();
    }
  });
  it('the same choices give the same game', () => {
    const play = () => choose(content, choose(content, newGame(content, 5), 'knock'), 'ask');
    expect(play()).toEqual(play());
  });
  it('a save round-trips and a newer save is refused', () => {
    const s = newGame(content, 3);
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(() => migrate({ ...s, v: 99 })).toThrow(/newer/);
  });
});
