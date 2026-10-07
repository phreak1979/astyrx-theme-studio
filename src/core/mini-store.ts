/** Tiny external store compatible with `useSyncExternalStore`. */
export interface MiniStore<T> {
  get: () => T;
  set: (patch: Partial<T> | ((prev: T) => Partial<T>)) => void;
  subscribe: (fn: () => void) => () => void;
}

export function createMiniStore<T extends object>(initial: T): MiniStore<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      const p = typeof patch === 'function' ? patch(state) : patch;
      let changed = false;
      for (const k of Object.keys(p) as (keyof T)[]) {
        if (state[k] !== p[k]) {
          changed = true;
          break;
        }
      }
      if (!changed) return;
      state = { ...state, ...p };
      for (const l of [...listeners]) l();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}
