// The save contract: every save version that ever shipped has a fixture in
// tests/fixtures/v<N>-save.json, and each must load through migrate() and play
// on. When SAVE_VERSION rises, commit a fixture saved by the old build first.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import bundle from '../src/content/bundle.json';
import type { ContentBundle } from '../src/content/schema';
import { SAVE_VERSION, migrate, view, choose } from '../src/engine/story';

const content = bundle as unknown as ContentBundle;
const dir = new URL('./fixtures/', import.meta.url);
const fixtures = readdirSync(dir).filter((f) => /^v\d+-save\.json$/.test(f)).sort();

describe('save contract', () => {
  it('has a fixture for every save version', () => {
    for (let v = 1; v <= SAVE_VERSION; v++) expect(fixtures).toContain(`v${v}-save.json`);
  });
  for (const f of fixtures) {
    it(`${f} loads and plays on`, () => {
      let s = migrate(JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
      expect(s.v).toBe(SAVE_VERSION);
      // a fixture whose scene no longer exists must fail loudly here, not on a phone
      expect(content.scenes[s.scene], `scene ${s.scene} from ${f} no longer exists`).toBeTruthy();
      const c = view(content, s).choices[0];
      if (c) s = choose(content, s, c.id);
      expect(s.turn).toBeGreaterThan(1);
    });
  }
});
