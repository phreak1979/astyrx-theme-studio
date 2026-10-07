import { createContext, useContext, useSyncExternalStore } from 'react';
import type { StoreSnapshot } from '../core/theme-state';
import type { StudioSession, UiState } from '../dev/session';

export const SessionContext = createContext<StudioSession | null>(null);

export function useSession(): StudioSession {
  const s = useContext(SessionContext);
  if (!s) throw new Error('Theme Studio session missing');
  return s;
}

export function useTheme(): StoreSnapshot {
  const { store } = useSession();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useUi(): UiState {
  const { ui } = useSession();
  return useSyncExternalStore(ui.subscribe, ui.get, ui.get);
}

export function useImpactIndex(): Record<string, Record<string, number>> {
  const { impactIndex } = useSession();
  return useSyncExternalStore(impactIndex.subscribe, impactIndex.getSnapshot, impactIndex.getSnapshot);
}
