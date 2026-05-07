import type { Task, Routine, Priority, Category } from '../types';

/**
 * Maps a priority to its display color.
 * high → red, medium → orange, low → green
 */
export function priorityToColor(priority: Priority): string {
  switch (priority) {
    case 'high':   return 'red';
    case 'medium': return 'orange';
    case 'low':    return 'green';
  }
}

/**
 * Filters tasks by one or more priority levels.
 * Returns all tasks if priorities array is empty.
 */
export function filterByPriority(tasks: Task[], priorities: Priority[]): Task[] {
  if (priorities.length === 0) return tasks;
  return tasks.filter((t) => priorities.includes(t.priority));
}

/**
 * Filters tasks by one or more categories.
 * Returns all tasks if categories array is empty.
 */
export function filterByCategory(tasks: Task[], categories: Category[]): Task[] {
  if (categories.length === 0) return tasks;
  return tasks.filter((t) => categories.includes(t.category));
}

/**
 * Filters tasks and routines by a specific date (YYYY-MM-DD).
 * Matches items whose scheduledAt date (in local time) equals the given date.
 */
export function filterByDate(items: (Task | Routine)[], date: string): (Task | Routine)[] {
  return items.filter((item) => {
    if (!('scheduledAt' in item)) return false;
    const itemDate = new Date((item as Task).scheduledAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    return itemDate === date;
  });
}

/**
 * Sorts tasks by priority descending: high → medium → low.
 * Returns a new array (does not mutate the input).
 */
export function sortByPriority(tasks: Task[]): Task[] {
  const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => order[a.priority] - order[b.priority]);
}
