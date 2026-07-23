import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createInitialFs,
  deserializeFs,
  FS_STORAGE_KEY,
  loadFs,
  saveFs,
  serializeFs,
} from '../persistence';

describe('sérialisation / désérialisation', () => {
  it('round-trip : sérialiser puis désérialiser conserve la structure', () => {
    const state = createInitialFs();
    const back = deserializeFs(serializeFs(state));
    expect(back).not.toBeNull();
    expect(back?.root.name).toBe('C:');
    expect(back?.root.children.length).toBe(state.root.children.length);
    expect(back?.trash).toEqual([]);
  });

  it('rejette une forme invalide ou un JSON illisible', () => {
    expect(deserializeFs('null')).toBeNull();
    expect(deserializeFs('pas du json')).toBeNull();
    expect(deserializeFs('{"root":{"type":"file"},"trash":[]}')).toBeNull();
    expect(deserializeFs('{"root":{}}')).toBeNull();
  });
});

describe('persistance localStorage', () => {
  /** Implémentation minimale et en mémoire de l'API Storage. */
  class MemoryStorage {
    private store = new Map<string, string>();
    getItem(key: string): string | null {
      return this.store.has(key) ? (this.store.get(key) as string) : null;
    }
    setItem(key: string, value: string): void {
      this.store.set(key, value);
    }
    removeItem(key: string): void {
      this.store.delete(key);
    }
    clear(): void {
      this.store.clear();
    }
  }

  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sauvegarde puis recharge l\'état', () => {
    const state = createInitialFs();
    saveFs(state);
    const loaded = loadFs();
    expect(loaded.root.name).toBe('C:');
    expect(loaded.root.children.length).toBe(state.root.children.length);
  });

  it('retombe sur le seed quand le stockage est vide', () => {
    const loaded = loadFs();
    expect(loaded.root.type).toBe('folder');
    expect(loaded.trash).toEqual([]);
  });

  it('ignore un contenu corrompu et renvoie le seed', () => {
    storage.setItem(FS_STORAGE_KEY, '{ ceci n\'est pas du json');
    const loaded = loadFs();
    expect(loaded.root.type).toBe('folder');
  });
});
