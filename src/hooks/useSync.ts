import { useCallback, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { supabase } from '../lib/supabaseClient';
import {
  localGet,
  localSet,
  getDirtyIds,
  clearDirty,
  TASKS_KEY,
  ROUTINES_KEY,
  HABITS_KEY,
  DIRTY_TASKS_KEY,
  DIRTY_ROUTINES_KEY,
  DIRTY_HABITS_KEY,
  LAST_SYNC_KEY,
} from '../utils/localStore';
import { resolveConflict } from '../utils/conflictResolution';
import { useSyncContext } from '../context/SyncContext';
import { useAuthContext } from '../context/AuthContext';
import type { Task, Routine, Habit, SyncResult } from '../types';

// ---- Exponential backoff helper ----
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), 30_000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ---- Sync a single entity type ----
async function syncEntity<T extends { id: string; updatedAt: string; isDeleted: boolean }>(
  localKey: string,
  dirtyKey: string,
  tableName: string,
  userId: string,
  lastSync: string | null,
  result: SyncResult,
  conflictResolver?: (local: T, remote: T) => T
): Promise<void> {
  const dirtyIds = await getDirtyIds(dirtyKey);
  const allLocal = (await localGet<T[]>(localKey)) ?? [];

  // Push dirty records to Supabase
  for (const id of dirtyIds) {
    const localRecord = allLocal.find((r) => r.id === id);
    if (!localRecord) {
      await clearDirty(dirtyKey, id);
      continue;
    }

    try {
      await withRetry(async () => {
        if (localRecord.isDeleted) {
          // Soft delete: push isDeleted flag to Supabase
          const { error } = await supabase
            .from(tableName)
            .update({ is_deleted: true, updated_at: localRecord.updatedAt })
            .eq('id', id)
            .eq('user_id', userId);
          if (error) throw new Error(error.message);
        } else {
          // Upsert: check for conflict first
          const { data: remoteData } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();

          if (remoteData && conflictResolver) {
            const remoteRecord = mapFromSupabase<T>(remoteData);
            const winner = conflictResolver(localRecord, remoteRecord);
            if (winner.id === remoteRecord.id && winner.updatedAt === remoteRecord.updatedAt) {
              // Remote wins — update local
              const updated = allLocal.map((r) => (r.id === id ? winner : r));
              await localSet(localKey, updated);
              result.conflicts++;
            }
          }

          const { error } = await supabase
            .from(tableName)
            .upsert(mapToSupabase(localRecord, userId));
          if (error) throw new Error(error.message);
        }
        result.pushed++;
      });

      await clearDirty(dirtyKey, id);
    } catch (err) {
      result.errors.push(`Failed to sync ${tableName} ${id}: ${String(err)}`);
    }
  }

  // Pull records updated since last sync
  if (lastSync) {
    try {
      const { data: remoteRecords, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', lastSync);

      if (!error && remoteRecords) {
        const currentLocal = (await localGet<T[]>(localKey)) ?? [];
        let updated = [...currentLocal];

        for (const remote of remoteRecords) {
          const remoteRecord = mapFromSupabase<T>(remote);
          const existingIndex = updated.findIndex((r) => r.id === remoteRecord.id);

          if (existingIndex === -1) {
            // New record from server
            updated.push(remoteRecord);
            result.pulled++;
          } else {
            const local = updated[existingIndex];
            const isDirty = dirtyIds.includes(remoteRecord.id);
            if (!isDirty && conflictResolver) {
              const winner = conflictResolver(local, remoteRecord);
              updated[existingIndex] = winner;
              result.pulled++;
            }
          }
        }

        await localSet(localKey, updated);
      }
    } catch {
      // Pull errors are non-fatal
    }
  }
}

// ---- Field name mapping helpers ----
function mapToSupabase(record: Record<string, unknown>, userId: string): Record<string, unknown> {
  const mapped: Record<string, unknown> = { user_id: userId };
  for (const [key, value] of Object.entries(record)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    mapped[snakeKey] = value;
  }
  return mapped;
}

function mapFromSupabase<T>(record: Record<string, unknown>): T {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    mapped[camelKey] = value;
  }
  return mapped as T;
}

// ---- Hook ----
interface SyncHook {
  syncNow: () => Promise<SyncResult>;
  syncStatus: string;
  pendingChanges: number;
}

/**
 * useSync — manages offline-first data synchronization with Supabase.
 * Triggered automatically on network reconnect and app resume.
 * Implements exponential backoff (1s, 2s, 4s, max 30s) for errors.
 * Property 20: Conflict resolution retains the version with the later timestamp.
 */
export function useSync(): SyncHook {
  const { state, dispatch } = useSyncContext();
  const { state: authState } = useAuthContext();

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    const userId = authState.user?.id;
    if (!userId) {
      return { pushed: 0, pulled: 0, conflicts: 0, errors: ['Not authenticated'] };
    }

    dispatch({ type: 'SET_STATUS', payload: 'syncing' });

    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };
    const lastSync = await localGet<string>(LAST_SYNC_KEY);

    try {
      // Sync tasks
      await syncEntity<Task>(
        TASKS_KEY,
        DIRTY_TASKS_KEY,
        'tasks',
        userId,
        lastSync,
        result,
        resolveConflict
      );

      // Sync routines
      await syncEntity<Routine>(
        ROUTINES_KEY,
        DIRTY_ROUTINES_KEY,
        'routines',
        userId,
        lastSync,
        result
      );

      // Sync habits
      await syncEntity<Habit>(
        HABITS_KEY,
        DIRTY_HABITS_KEY,
        'habits',
        userId,
        lastSync,
        result
      );

      // Update last sync timestamp
      await localSet(LAST_SYNC_KEY, new Date().toISOString());

      // Update pending changes count
      const remainingDirty =
        (await getDirtyIds(DIRTY_TASKS_KEY)).length +
        (await getDirtyIds(DIRTY_ROUTINES_KEY)).length +
        (await getDirtyIds(DIRTY_HABITS_KEY)).length;

      dispatch({ type: 'SET_PENDING', payload: remainingDirty });
      dispatch({ type: 'SET_STATUS', payload: result.errors.length > 0 ? 'error' : 'idle' });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
    } catch (err) {
      result.errors.push(String(err));
      dispatch({ type: 'SET_STATUS', payload: 'error' });
    }

    return result;
  }, [authState.user?.id, dispatch]);

  // Auto-sync on network reconnect
  useEffect(() => {
    let networkHandle: { remove: () => void } | null = null;
    let appHandle: { remove: () => void } | null = null;

    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) {
        syncNow().catch(console.error);
      } else {
        dispatch({ type: 'SET_STATUS', payload: 'offline' });
      }
    }).then((handle) => {
      networkHandle = handle;
    });

    // Auto-sync on app resume
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        syncNow().catch(console.error);
      }
    }).then((handle) => {
      appHandle = handle;
    });

    return () => {
      networkHandle?.remove();
      appHandle?.remove();
    };
  }, [syncNow, dispatch]);

  return {
    syncNow,
    syncStatus: state.syncStatus,
    pendingChanges: state.pendingChanges,
  };
}
