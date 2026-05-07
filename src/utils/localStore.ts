import { Preferences } from '@capacitor/preferences';

// ============================================================
// Store Key Constants
// ============================================================

export const TASKS_KEY = 'tasks';
export const ROUTINES_KEY = 'routines';
export const HABITS_KEY = 'habits';
export const COMPLETIONS_KEY = 'completions';
export const PREFERENCES_KEY = 'user_preferences';
export const DIRTY_TASKS_KEY = 'dirty_tasks';
export const DIRTY_ROUTINES_KEY = 'dirty_routines';
export const DIRTY_HABITS_KEY = 'dirty_habits';
export const LAST_SYNC_KEY = 'last_sync';
export const SESSION_TOKEN_KEY = 'session_token';
export const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

// ============================================================
// Generic CRUD helpers
// ============================================================

/**
 * Read a JSON-serialised value from the local store.
 * Returns null if the key is absent or the stored value is null/empty.
 */
export async function localGet<T>(key: string): Promise<T | null> {
  const { value } = await Preferences.get({ key });
  if (value === null || value === undefined || value === '') {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Write a JSON-serialised value to the local store.
 */
export async function localSet<T>(key: string, value: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

/**
 * Remove a key from the local store.
 */
export async function localRemove(key: string): Promise<void> {
  await Preferences.remove({ key });
}

/**
 * Clear all keys from the local store (used on logout).
 */
export async function localClear(): Promise<void> {
  await Preferences.clear();
}

// ============================================================
// Dirty-flag helpers
// ============================================================

/**
 * Add an ID to a dirty-tracking list (deduplicates automatically).
 */
export async function markDirty(key: string, id: string): Promise<void> {
  const existing = (await localGet<string[]>(key)) ?? [];
  if (!existing.includes(id)) {
    await localSet(key, [...existing, id]);
  }
}

/**
 * Remove an ID from a dirty-tracking list.
 */
export async function clearDirty(key: string, id: string): Promise<void> {
  const existing = (await localGet<string[]>(key)) ?? [];
  await localSet(key, existing.filter((x) => x !== id));
}

/**
 * Get all IDs currently marked dirty for a given key.
 */
export async function getDirtyIds(key: string): Promise<string[]> {
  return (await localGet<string[]>(key)) ?? [];
}
