import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { SyncStatus } from '../types';

// ---- State ----
interface SyncState {
  syncStatus: SyncStatus;
  pendingChanges: number;
  lastSyncAt: string | null;
}

// ---- Actions ----
type SyncAction =
  | { type: 'SET_STATUS'; payload: SyncStatus }
  | { type: 'SET_PENDING'; payload: number }
  | { type: 'SET_LAST_SYNC'; payload: string };

// ---- Reducer ----
function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'SET_PENDING':
      return { ...state, pendingChanges: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncAt: action.payload };
    default:
      return state;
  }
}

// ---- Context ----
interface SyncContextValue {
  state: SyncState;
  dispatch: React.Dispatch<SyncAction>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// ---- Provider ----
interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [state, dispatch] = useReducer(syncReducer, {
    syncStatus: 'idle',
    pendingChanges: 0,
    lastSyncAt: null,
  });

  return (
    <SyncContext.Provider value={{ state, dispatch }}>
      {children}
    </SyncContext.Provider>
  );
}

// ---- Hook ----
export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return ctx;
}
