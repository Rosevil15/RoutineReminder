/**
 * FNV-1a 32-bit hash function.
 * Returns a positive 31-bit integer suitable for use as a Capacitor notification ID.
 */
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by FNV prime (0x01000193) using 32-bit arithmetic
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash & 0x7fffffff; // mask to positive 31-bit integer
}

/**
 * Derives a deterministic notification ID for a task.
 */
export function taskNotificationId(taskId: string): number {
  return fnv1a32(taskId);
}

/**
 * Derives a deterministic notification ID for a routine.
 * Prefixed with 'r:' to avoid collisions with task IDs.
 */
export function routineNotificationId(routineId: string): number {
  return fnv1a32('r:' + routineId);
}

/**
 * Computes the notification fire time in milliseconds.
 * fireAt = scheduledAt - leadTime * 60_000
 */
export function computeFireAt(scheduledAtMs: number, leadTimeMinutes: number): number {
  return scheduledAtMs - leadTimeMinutes * 60_000;
}
