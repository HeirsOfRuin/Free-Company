// The screens. Reads the engine's view(), computes nothing. Same conventions as
// every scaffolded game, so tools/smoke.mjs drives it unchanged: [data-act] for
// title and menu actions, .hud .turn for the clock, [data-action] for choices,
// [data-tab] for tabs.
import { useState } from 'preact/hooks';
import type { ContentBundle } from '../content/schema';
import { newGame, choose, view, migrate, SAVE_KEY, type GameState } from '../engine/story';
import { STORAGE_OK, lsGet, lsSet } from './storage.js';

function load(): GameState | null {
  const raw = lsGet(SAVE_KEY);
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch { return null; }
}

export function App({ content }: { content: ContentBundle }) {
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<'story' | 'journal' | 'menu'>('story');
  const [error, setError] = useState<string | null>(null);
  const commit = (s: GameState | null) => { setState(s); if (s) lsSet(SAVE_KEY, JSON.stringify(s)); };

  if (!state) {
    const saved = load();
    return (
      <main class="title">
        <h1>{document.title}</h1>
        <p class="lede">{document.querySelector('meta[name="description"]')?.getAttribute('content')}</p>
        {!STORAGE_OK && <p class="warn">This browser is refusing to store anything for this page, so progress will not be kept.</p>}
        <div class="stack">
          {saved && <button class="primary" data-act="continue" onClick={() => setState(saved)}>Continue</button>}
          <button class={saved ? '' : 'primary'} data-act="new" onClick={() => { commit(newGame(content, (Math.random() * 2 ** 31) >>> 0)); setTab('story'); }}>New game</button>
        </div>
      </main>
    );
  }

  const v = view(content, state);
  const act = (id: string) => {
    try { commit(choose(content, state, id)); } catch (e) { setError(String((e as Error).message)); }
  };
  return (
    <>
      <header class="hud"><span class="turn">Scene {v.turn}</span><span>{v.title}</span></header>
      {error && <p class="banner">{error} <button onClick={() => setError(null)}>OK</button></p>}
      <main class="panel">
        {tab === 'story' && (v.over
          ? <><h2>The end: {v.ending}</h2><button class="primary" data-act="new" onClick={() => commit(newGame(content, state.seed + 1))}>Play again</button></>
          : <>
              <h2>{v.title}</h2>
              {v.text.trim().split(/\n\s*\n/).map((p) => <p>{p}</p>)}
              <div class="stack">{v.choices.map((c) => <button data-action={c.id} onClick={() => act(c.id)}>{c.text}</button>)}</div>
            </>)}
        {tab === 'journal' && (state.journal.length
          ? <><h2>Journal</h2><table class="ledger">{state.journal.map((j) => <tr><td>{j.turn}</td><td>{content.scenes[j.scene]?.title}</td><td>{j.choice}</td></tr>)}</table></>
          : <><h2>Journal</h2><p class="empty">Empty so far: every choice you make is written here.</p></>)}
        {tab === 'menu' && <><h2>Menu</h2><div class="stack"><button data-act="quit" onClick={() => setState(null)}>Back to the title</button></div>
          <p class="hint">Saves live in this browser on this device.</p></>}
      </main>
      <nav class="tabs">
        {(['story', 'journal', 'menu'] as const).map((t) => <button data-tab={t} class={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>)}
      </nav>
    </>
  );
}
