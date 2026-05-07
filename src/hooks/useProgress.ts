import { useState, useEffect, useCallback } from 'react';
import { localGet } from '../utils/localStore';
import { computeDailySummary, computeStreak, getWeeklyChart } from '../utils/progressUtils';
import { TASKS_KEY, COMPLETIONS_KEY } from '../utils/localStore';
import type { Task, TaskCompletion, DailySummary, DailyCount } from '../types';

interface ProgressHook {
  getDailySummary: (date: Date) => DailySummary;
  streakCount: number;
  weeklyChart: DailyCount[];
  recordCompletion: (taskId: string, completed: boolean) => Promise<void>;
}

/**
 * useProgress — reads task completions from local store and computes statistics.
 * Property 15: Daily summary computation invariants.
 * Property 16: Streak count equals consecutive fully-completed days.
 * Property 17: 7-day chart has exactly 7 entries with correct per-day counts.
 */
export function useProgress(): ProgressHook {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);

  useEffect(() => {
    Promise.all([
      localGet<Task[]>(TASKS_KEY),
      localGet<TaskCompletion[]>(COMPLETIONS_KEY),
    ]).then(([storedTasks, storedCompletions]) => {
      setTasks((storedTasks ?? []).filter((t) => !t.isDeleted));
      setCompletions(storedCompletions ?? []);
    });
  }, []);

  const getDailySummary = useCallback(
    (date: Date): DailySummary => {
      const dateStr = date.toLocaleDateString('en-CA');
      return computeDailySummary(tasks, completions, dateStr);
    },
    [tasks, completions]
  );

  const streakCount = computeStreak(tasks, completions);
  const weeklyChart = getWeeklyChart(completions);

  const recordCompletion = useCallback(
    async (taskId: string, completed: boolean): Promise<void> => {
      const stored = (await localGet<TaskCompletion[]>(COMPLETIONS_KEY)) ?? [];
      if (completed) {
        const now = new Date().toISOString();
        const record: TaskCompletion = {
          id: `${taskId}-${Date.now()}`,
          taskId,
          userId: 'local',
          completedAt: now,
          date: now.split('T')[0],
        };
        const updated = [...stored, record];
        setCompletions(updated);
      } else {
        const updated = stored.filter((c) => c.taskId !== taskId);
        setCompletions(updated);
      }
    },
    []
  );

  return { getDailySummary, streakCount, weeklyChart, recordCompletion };
}
