import type { Task, TaskCompletion, DailySummary, DailyCount } from '../types';

/**
 * Computes the daily productivity summary for a given date.
 * scheduled = tasks whose scheduledAt date matches the given date (excluding deleted)
 * completed = tasks that are completed on that date
 * percentage = Math.round((completed / scheduled) * 100), or 0 if scheduled === 0
 */
export function computeDailySummary(
  tasks: Task[],
  completions: TaskCompletion[],
  date: string // YYYY-MM-DD
): DailySummary {
  const activeTasks = tasks.filter(
    (t) => !t.isDeleted && new Date(t.scheduledAt).toLocaleDateString('en-CA') === date
  );
  const scheduled = activeTasks.length;

  const completedIds = new Set(
    completions.filter((c) => c.date === date).map((c) => c.taskId)
  );
  const completed = activeTasks.filter((t) => completedIds.has(t.id)).length;

  const percentage = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

  return { date, scheduled, completed, percentage };
}

/**
 * Computes the streak count: the number of consecutive calendar days going
 * backwards from yesterday on which all scheduled tasks were completed.
 * Stops at the first day where scheduled > 0 but completed < scheduled.
 * Days with no scheduled tasks are skipped (do not break the streak).
 */
export function computeStreak(tasks: Task[], completions: TaskCompletion[]): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');

    const summary = computeDailySummary(tasks, completions, dateStr);

    if (summary.scheduled === 0) {
      // No tasks scheduled — skip this day (does not break streak)
      continue;
    }

    if (summary.completed >= summary.scheduled) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns a 7-day completion chart for the last 7 days (today inclusive).
 * Each entry contains the date (YYYY-MM-DD) and the number of completed tasks.
 */
export function getWeeklyChart(completions: TaskCompletion[]): DailyCount[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chart: DailyCount[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');

    const completed = completions.filter((c) => c.date === dateStr).length;
    chart.push({ date: dateStr, completed });
  }

  return chart;
}
