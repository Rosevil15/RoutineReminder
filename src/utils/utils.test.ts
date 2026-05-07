// Feature: task-reminder-routine-app
// Property tests for pure utility functions

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEmail, validatePassword, validateTitle } from './validators';
import { taskNotificationId, routineNotificationId, computeFireAt } from './notificationIds';
import { priorityToColor, filterByPriority, filterByCategory, filterByDate, sortByPriority } from './taskFilters';
import { groupByTimeBlock } from './routineUtils';
import { resolveConflict } from './conflictResolution';
import { computeDailySummary, computeStreak, getWeeklyChart } from './progressUtils';
import type { Task, Routine, Priority, Category, TimeBlock, TaskCompletion } from '../types';

// ============================================================
// Helpers / Arbitraries
// ============================================================

const priorityArb = fc.constantFrom<Priority>('high', 'medium', 'low');
const categoryArb = fc.constantFrom<Category>('school', 'work', 'personal', 'health');
const timeBlockArb = fc.constantFrom<TimeBlock>('morning', 'afternoon', 'evening');
const leadTimeArb = fc.constantFrom(5, 10, 15, 30, 60);

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    scheduledAt: new Date().toISOString(),
    priority: 'medium',
    category: 'personal',
    recurrenceType: 'none',
    reminderLeadTime: 15,
    isCompleted: false,
    isDirty: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    userId: 'user-1',
    name: 'Morning Routine',
    timeBlock: 'morning',
    recurrenceType: 'daily',
    reminderLeadTime: 15,
    isDirty: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// Property 22: Input validation rejects invalid email formats and short passwords
// Validates: Requirements 8.3
// ============================================================
describe('Property 22: validators', () => {
  it('validateEmail returns false for strings without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@')),
        (s) => {
          expect(validateEmail(s)).toBe(false);
        }
      )
    );
  });

  it('validateEmail returns true for valid email format', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          expect(validateEmail(email)).toBe(true);
        }
      )
    );
  });

  it('validatePassword returns false for strings shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 7 }),
        (s) => {
          expect(validatePassword(s)).toBe(false);
        }
      )
    );
  });

  it('validatePassword returns true for strings of 8 or more characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8 }),
        (s) => {
          expect(validatePassword(s)).toBe(true);
        }
      )
    );
  });
});

// ============================================================
// Property 4: Whitespace-only title or name is rejected
// Validates: Requirements 1.7, 3.7
// ============================================================
describe('Property 4: whitespace title/name validation', () => {
  it('validateTitle returns false for empty string', () => {
    expect(validateTitle('')).toBe(false);
  });

  it('validateTitle returns false for whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter((s) => s.length > 0),
        (s) => {
          expect(validateTitle(s)).toBe(false);
        }
      )
    );
  });

  it('validateTitle returns true for strings with at least one non-whitespace character', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (s) => {
          expect(validateTitle(s)).toBe(true);
        }
      )
    );
  });
});

// ============================================================
// Property 5: Notification fire time equals scheduled time minus lead time
// Validates: Requirements 2.2, 3.6
// ============================================================
describe('Property 5: notification fire time computation', () => {
  it('computeFireAt equals scheduledAt - leadTime * 60_000', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        leadTimeArb,
        (scheduledAtMs, leadTime) => {
          const fireAt = computeFireAt(scheduledAtMs, leadTime);
          expect(fireAt).toBe(scheduledAtMs - leadTime * 60_000);
        }
      )
    );
  });
});

// ============================================================
// Property 11: Priority-to-color mapping is correct and exhaustive
// Validates: Requirements 4.5, 5.2
// ============================================================
describe('Property 11: priorityToColor', () => {
  it('maps high → red, medium → orange, low → green', () => {
    expect(priorityToColor('high')).toBe('red');
    expect(priorityToColor('medium')).toBe('orange');
    expect(priorityToColor('low')).toBe('green');
  });

  it('returns a defined color for every valid priority', () => {
    fc.assert(
      fc.property(priorityArb, (priority) => {
        const color = priorityToColor(priority);
        expect(['red', 'orange', 'green']).toContain(color);
      })
    );
  });
});

// ============================================================
// Property 12: Priority filter returns only tasks matching the selected priorities
// Validates: Requirements 5.3
// ============================================================
describe('Property 12: filterByPriority', () => {
  it('returns only tasks whose priority is in the filter set (no false positives)', () => {
    fc.assert(
      fc.property(
        fc.array(priorityArb.map((p) => makeTask({ id: Math.random().toString(), priority: p }))),
        fc.array(priorityArb, { minLength: 1 }),
        (tasks, priorities) => {
          const result = filterByPriority(tasks, priorities);
          result.forEach((t) => expect(priorities).toContain(t.priority));
        }
      )
    );
  });

  it('includes all tasks matching the filter (no false negatives)', () => {
    fc.assert(
      fc.property(
        fc.array(priorityArb.map((p) => makeTask({ id: Math.random().toString(), priority: p }))),
        fc.array(priorityArb, { minLength: 1 }),
        (tasks, priorities) => {
          const result = filterByPriority(tasks, priorities);
          const matching = tasks.filter((t) => priorities.includes(t.priority));
          expect(result.length).toBe(matching.length);
        }
      )
    );
  });
});

// ============================================================
// Property 13: Priority sort places higher-priority tasks before lower-priority tasks
// Validates: Requirements 5.5
// ============================================================
describe('Property 13: sortByPriority', () => {
  it('no medium task appears before a high task', () => {
    fc.assert(
      fc.property(
        fc.array(priorityArb.map((p) => makeTask({ id: Math.random().toString(), priority: p }))),
        (tasks) => {
          const sorted = sortByPriority(tasks);
          for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
              if (sorted[i].priority === 'medium' && sorted[j].priority === 'high') {
                throw new Error('medium before high');
              }
              if (sorted[i].priority === 'low' && sorted[j].priority !== 'low') {
                throw new Error('low before non-low');
              }
            }
          }
        }
      )
    );
  });
});

// ============================================================
// Property 10: Date filter returns exactly the items scheduled for that date
// Validates: Requirements 4.2, 4.4
// ============================================================
describe('Property 10: filterByDate', () => {
  it('returns exactly the tasks whose scheduledAt date matches the filter date', () => {
    const date = '2025-06-15';
    const matchingTask = makeTask({ id: 't1', scheduledAt: `${date}T09:00:00.000Z` });
    const nonMatchingTask = makeTask({ id: 't2', scheduledAt: '2025-06-16T09:00:00.000Z' });

    // Use a fixed date string for deterministic local date comparison
    const tasks = [matchingTask, nonMatchingTask];
    // We test the filter logic: items with the matching date are included
    const result = filterByDate(tasks, new Date(`${date}T09:00:00.000Z`).toLocaleDateString('en-CA'));
    // The result should contain t1 (same date) and not t2
    const ids = result.map((t) => (t as Task).id);
    expect(ids).toContain('t1');
    expect(ids).not.toContain('t2');
  });
});

// ============================================================
// Property 9: Routines are grouped in chronological time-block order
// Validates: Requirements 3.3
// ============================================================
describe('Property 9: groupByTimeBlock', () => {
  it('always returns groups in morning → afternoon → evening order', () => {
    fc.assert(
      fc.property(
        fc.array(
          timeBlockArb.map((tb) => makeRoutine({ id: Math.random().toString(), timeBlock: tb }))
        ),
        (routines) => {
          const groups = groupByTimeBlock(routines);
          const keys = Object.keys(groups) as TimeBlock[];
          expect(keys).toEqual(['morning', 'afternoon', 'evening']);
        }
      )
    );
  });

  it('each routine appears in the correct group', () => {
    fc.assert(
      fc.property(
        fc.array(
          timeBlockArb.map((tb) => makeRoutine({ id: Math.random().toString(), timeBlock: tb }))
        ),
        (routines) => {
          const groups = groupByTimeBlock(routines);
          routines.forEach((r) => {
            expect(groups[r.timeBlock]).toContainEqual(r);
          });
        }
      )
    );
  });
});

// ============================================================
// Property 20: Conflict resolution retains the version with the later timestamp
// Validates: Requirements 7.4
// ============================================================
describe('Property 20: resolveConflict', () => {
  it('returns the version with the later updatedAt timestamp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (baseMs, delta) => {
          const earlier = new Date(baseMs).toISOString();
          const later = new Date(baseMs + delta).toISOString();

          const local = makeTask({ id: 'x', updatedAt: earlier });
          const remote = makeTask({ id: 'x', updatedAt: later });

          expect(resolveConflict(local, remote)).toEqual(remote);
          expect(resolveConflict(remote, local)).toEqual(remote);
        }
      )
    );
  });

  it('returns local when timestamps are equal', () => {
    const ts = new Date().toISOString();
    const local = makeTask({ id: 'x', updatedAt: ts, title: 'local' });
    const remote = makeTask({ id: 'x', updatedAt: ts, title: 'remote' });
    expect(resolveConflict(local, remote)).toEqual(local);
  });
});

// ============================================================
// Property 15: Daily summary computation invariants
// Validates: Requirements 6.2
// ============================================================
describe('Property 15: computeDailySummary', () => {
  it('completed <= scheduled always holds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (scheduledCount, completedCount) => {
          const date = '2025-01-15';
          const tasks = Array.from({ length: scheduledCount }, (_, i) =>
            makeTask({ id: `t${i}`, scheduledAt: `${date}T09:00:00.000Z`, isDeleted: false })
          );
          const completions: TaskCompletion[] = Array.from(
            { length: Math.min(completedCount, scheduledCount) },
            (_, i) => ({
              id: `c${i}`,
              taskId: `t${i}`,
              userId: 'user-1',
              completedAt: `${date}T10:00:00.000Z`,
              date,
            })
          );
          const summary = computeDailySummary(tasks, completions, date);
          expect(summary.completed).toBeLessThanOrEqual(summary.scheduled);
        }
      )
    );
  });

  it('percentage = Math.round((completed / scheduled) * 100) when scheduled > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (scheduledCount, completedCount) => {
          const date = '2025-01-15';
          const actual = Math.min(completedCount, scheduledCount);
          const tasks = Array.from({ length: scheduledCount }, (_, i) =>
            makeTask({ id: `t${i}`, scheduledAt: `${date}T09:00:00.000Z`, isDeleted: false })
          );
          const completions: TaskCompletion[] = Array.from({ length: actual }, (_, i) => ({
            id: `c${i}`,
            taskId: `t${i}`,
            userId: 'user-1',
            completedAt: `${date}T10:00:00.000Z`,
            date,
          }));
          const summary = computeDailySummary(tasks, completions, date);
          expect(summary.percentage).toBe(Math.round((actual / scheduledCount) * 100));
        }
      )
    );
  });

  it('percentage = 0 when scheduled = 0', () => {
    const summary = computeDailySummary([], [], '2025-01-15');
    expect(summary.percentage).toBe(0);
    expect(summary.scheduled).toBe(0);
    expect(summary.completed).toBe(0);
  });
});

// ============================================================
// Property 17: 7-day chart has exactly 7 entries with correct per-day counts
// Validates: Requirements 6.4
// ============================================================
describe('Property 17: getWeeklyChart', () => {
  it('always returns exactly 7 DailyCount entries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            taskId: fc.uuid(),
            userId: fc.constant('user-1'),
            completedAt: fc.constant(new Date().toISOString()),
            date: fc.constant(new Date().toLocaleDateString('en-CA')),
          })
        ),
        (completions) => {
          const chart = getWeeklyChart(completions);
          expect(chart).toHaveLength(7);
        }
      )
    );
  });

  it('each entry completed count matches the number of completions for that date', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('en-CA');

    const completions: TaskCompletion[] = [
      { id: 'c1', taskId: 't1', userId: 'u1', completedAt: today.toISOString(), date: todayStr },
      { id: 'c2', taskId: 't2', userId: 'u1', completedAt: today.toISOString(), date: todayStr },
    ];

    const chart = getWeeklyChart(completions);
    const todayEntry = chart.find((e) => e.date === todayStr);
    expect(todayEntry?.completed).toBe(2);
  });
});

// ============================================================
// Property 24: Category filter returns only tasks matching the selected categories
// Validates: Requirements 9.3, 9.4
// ============================================================
describe('Property 24: filterByCategory', () => {
  it('returns only tasks whose category is in the filter set (no false positives)', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb.map((c) => makeTask({ id: Math.random().toString(), category: c }))),
        fc.array(categoryArb, { minLength: 1 }),
        (tasks, categories) => {
          const result = filterByCategory(tasks, categories);
          result.forEach((t) => expect(categories).toContain(t.category));
        }
      )
    );
  });

  it('includes all tasks matching the filter (no false negatives)', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb.map((c) => makeTask({ id: Math.random().toString(), category: c }))),
        fc.array(categoryArb, { minLength: 1 }),
        (tasks, categories) => {
          const result = filterByCategory(tasks, categories);
          const matching = tasks.filter((t) => categories.includes(t.category));
          expect(result.length).toBe(matching.length);
        }
      )
    );
  });
});
