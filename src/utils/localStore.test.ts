import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import {
  localGet,
  localSet,
  localRemove,
  markDirty,
  clearDirty,
  getDirtyIds,
  TASKS_KEY,
} from './localStore';

// Preferences is mocked in setupTests.ts
const mockGet = vi.mocked(Preferences.get);
const mockSet = vi.mocked(Preferences.set);
const mockRemove = vi.mocked(Preferences.remove);

describe('localStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('localGet', () => {
    it('returns null when key is absent (value is null)', async () => {
      mockGet.mockResolvedValueOnce({ value: null });
      const result = await localGet<string>('missing-key');
      expect(result).toBeNull();
    });

    it('returns null when value is empty string', async () => {
      mockGet.mockResolvedValueOnce({ value: '' });
      const result = await localGet<string>('empty-key');
      expect(result).toBeNull();
    });

    it('returns null when JSON is malformed', async () => {
      mockGet.mockResolvedValueOnce({ value: 'not-json{' });
      const result = await localGet<object>('bad-key');
      expect(result).toBeNull();
    });
  });

  describe('localSet then localGet round-trip', () => {
    it('round-trips a plain object', async () => {
      const obj = { id: '123', title: 'Test Task' };
      let stored: string | null = null;

      mockSet.mockImplementationOnce(async ({ value }) => { stored = value; });
      mockGet.mockImplementationOnce(async () => ({ value: stored }));

      await localSet(TASKS_KEY, obj);
      const result = await localGet<typeof obj>(TASKS_KEY);
      expect(result).toEqual(obj);
    });

    it('round-trips an array', async () => {
      const arr = [1, 2, 3];
      let stored: string | null = null;

      mockSet.mockImplementationOnce(async ({ value }) => { stored = value; });
      mockGet.mockImplementationOnce(async () => ({ value: stored }));

      await localSet('arr-key', arr);
      const result = await localGet<number[]>('arr-key');
      expect(result).toEqual(arr);
    });
  });

  describe('localRemove', () => {
    it('calls Preferences.remove with the correct key', async () => {
      await localRemove('some-key');
      expect(mockRemove).toHaveBeenCalledWith({ key: 'some-key' });
    });
  });

  describe('markDirty / clearDirty / getDirtyIds', () => {
    it('adds an id to the dirty list', async () => {
      let stored: string | null = null;
      mockGet.mockResolvedValueOnce({ value: null }); // initial empty
      mockSet.mockImplementationOnce(async ({ value }) => { stored = value; });
      mockGet.mockImplementationOnce(async () => ({ value: stored }));

      await markDirty(TASKS_KEY, 'abc');
      const ids = await getDirtyIds(TASKS_KEY);
      expect(ids).toContain('abc');
    });

    it('does not duplicate ids', async () => {
      let stored: string | null = JSON.stringify(['abc']);
      mockGet.mockResolvedValueOnce({ value: stored });
      mockSet.mockImplementationOnce(async ({ value }) => { stored = value; });
      mockGet.mockImplementationOnce(async () => ({ value: stored }));

      await markDirty(TASKS_KEY, 'abc');
      const ids = await getDirtyIds(TASKS_KEY);
      expect(ids.filter((x) => x === 'abc').length).toBe(1);
    });

    it('removes an id from the dirty list', async () => {
      // clearDirty reads existing list, filters, then writes back
      mockGet.mockResolvedValueOnce({ value: JSON.stringify(['abc', 'def']) });
      mockSet.mockResolvedValueOnce(undefined);

      await clearDirty(TASKS_KEY, 'abc');

      // Verify the correct filtered array was written
      expect(mockSet).toHaveBeenCalledWith({
        key: TASKS_KEY,
        value: JSON.stringify(['def']),
      });

      // Now verify getDirtyIds returns the filtered list
      mockGet.mockResolvedValueOnce({ value: JSON.stringify(['def']) });
      const ids = await getDirtyIds(TASKS_KEY);
      expect(ids).not.toContain('abc');
      expect(ids).toContain('def');
    });
  });
});
