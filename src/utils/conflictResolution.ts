import type { Task } from '../types';

/**
 * Resolves a sync conflict between a local and remote version of the same task.
 * Returns the version with the later updatedAt timestamp.
 * If timestamps are equal, the local version is preferred.
 */
export function resolveConflict(local: Task, remote: Task): Task {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  return remoteTime > localTime ? remote : local;
}
