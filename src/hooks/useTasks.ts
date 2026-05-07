import { useCallback, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuthContext } from '../context/AuthContext';
import {
  localGet,
  localSet,
  markDirty,
  TASKS_KEY,
  DIRTY_TASKS_KEY,
  COMPLETIONS_KEY,
} from '../utils/localStore';
import { validateTitle } from '../utils/validators';
import type {
  Task,
  CreateTaskDto,
  TaskFilter,
  RecurrenceScope,
  TaskCompletion,
  LeadTime,
} from '../types';

// Generate a simple UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate recurring task instances up to 90 days ahead
function generateRecurringInstances(base: Task): Task[] {
  const instances: Task[] = [];
  const baseDate = new Date(base.scheduledAt);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 90);
  const groupId = base.recurrenceGroupId ?? generateId();

  let current = new Date(baseDate);
  // Start from the day after the base
  if (base.recurrenceType === 'daily') {
    current.setDate(current.getDate() + 1);
  } else if (base.recurrenceType === 'weekly') {
    current.setDate(current.getDate() + 7);
  } else if (base.recurrenceType === 'monthly') {
    current.setMonth(current.getMonth() + 1);
  } else if (base.recurrenceType === 'selected_days') {
    current.setDate(current.getDate() + 1);
  }

  while (current <= cutoff) {
    if (base.recurrenceType === 'selected_days' && base.recurrenceDays) {
      if (!base.recurrenceDays.includes(current.getDay())) {
        current.setDate(current.getDate() + 1);
        continue;
      }
    }

    const now = new Date().toISOString();
    instances.push({
      ...base,
      id: generateId(),
      scheduledAt: current.toISOString(),
      recurrenceGroupId: groupId,
      isCompleted: false,
      completedAt: undefined,
      notificationId: undefined,
      isDirty: true,
      createdAt: now,
      updatedAt: now,
    });

    if (base.recurrenceType === 'daily' || base.recurrenceType === 'selected_days') {
      current.setDate(current.getDate() + 1);
    } else if (base.recurrenceType === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (base.recurrenceType === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    } else {
      break;
    }
  }

  return instances;
}

interface TasksHook {
  tasks: Task[];
  loading: boolean;
  createTask: (dto: CreateTaskDto) => Promise<Task>;
  updateTask: (id: string, changes: Partial<Task>, scope: RecurrenceScope) => Promise<Task>;
  deleteTask: (id: string, scope: RecurrenceScope) => Promise<void>;
  markComplete: (id: string, complete: boolean) => Promise<void>;
}

/**
 * useTasks — manages task CRUD with offline-first local store.
 * All mutations write to local store first, then mark dirty for sync.
 */
export function useTasks(filters?: TaskFilter): TasksHook {
  const { state, dispatch } = useTaskContext();
  const { state: authState } = useAuthContext();

  // Load tasks from local store on mount
  useEffect(() => {
    localGet<Task[]>(TASKS_KEY).then((stored) => {
      if (stored) {
        dispatch({ type: 'SET_TASKS', payload: stored.filter((t) => !t.isDeleted) });
      } else {
        dispatch({ type: 'SET_TASKS', payload: [] });
      }
    });
  }, [dispatch]);

  const createTask = useCallback(async (dto: CreateTaskDto): Promise<Task> => {
    if (!validateTitle(dto.title)) {
      throw new Error('Task title cannot be empty or whitespace-only.');
    }

    const userId = authState.user?.id ?? 'local';
    const now = new Date().toISOString();
    const id = generateId();

    const task: Task = {
      id,
      userId,
      title: dto.title.trim(),
      scheduledAt: dto.scheduledAt,
      priority: dto.priority ?? 'medium',
      category: dto.category ?? 'personal',
      recurrenceType: dto.recurrenceType ?? 'none',
      recurrenceDays: dto.recurrenceDays,
      recurrenceGroupId: dto.recurrenceType !== 'none' ? generateId() : undefined,
      reminderLeadTime: (dto.reminderLeadTime ?? 15) as LeadTime,
      isCompleted: false,
      isDirty: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Write to local store
    const existing = (await localGet<Task[]>(TASKS_KEY)) ?? [];
    const allTasks = [task, ...existing];

    // Generate recurring instances
    if (task.recurrenceType !== 'none') {
      const instances = generateRecurringInstances(task);
      allTasks.push(...instances);
      for (const inst of instances) {
        await markDirty(DIRTY_TASKS_KEY, inst.id);
      }
    }

    await localSet(TASKS_KEY, allTasks);
    await markDirty(DIRTY_TASKS_KEY, task.id);

    dispatch({ type: 'ADD_TASK', payload: task });

    return task;
  }, [authState.user?.id, dispatch]);

  const updateTask = useCallback(async (
    id: string,
    changes: Partial<Task>,
    scope: RecurrenceScope
  ): Promise<Task> => {
    const existing = (await localGet<Task[]>(TASKS_KEY)) ?? [];
    const target = existing.find((t) => t.id === id);
    if (!target) throw new Error(`Task ${id} not found`);

    if (changes.title !== undefined && !validateTitle(changes.title)) {
      throw new Error('Task title cannot be empty or whitespace-only.');
    }

    const now = new Date().toISOString();
    const updated: Task = { ...target, ...changes, updatedAt: now, isDirty: true };

    let updatedAll: Task[];
    if (scope === 'this') {
      updatedAll = existing.map((t) => (t.id === id ? updated : t));
    } else if (scope === 'future') {
      updatedAll = existing.map((t) => {
        if (t.id === id) return updated;
        if (
          t.recurrenceGroupId === target.recurrenceGroupId &&
          new Date(t.scheduledAt) >= new Date(target.scheduledAt)
        ) {
          return { ...t, ...changes, updatedAt: now, isDirty: true };
        }
        return t;
      });
    } else {
      // 'all'
      updatedAll = existing.map((t) => {
        if (t.recurrenceGroupId === target.recurrenceGroupId) {
          return { ...t, ...changes, updatedAt: now, isDirty: true };
        }
        return t;
      });
    }

    await localSet(TASKS_KEY, updatedAll);
    await markDirty(DIRTY_TASKS_KEY, id);
    dispatch({ type: 'UPDATE_TASK', payload: updated });

    return updated;
  }, [dispatch]);

  const deleteTask = useCallback(async (id: string, scope: RecurrenceScope): Promise<void> => {
    const existing = (await localGet<Task[]>(TASKS_KEY)) ?? [];
    const target = existing.find((t) => t.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    let updatedAll: Task[];

    if (scope === 'this') {
      updatedAll = existing.map((t) =>
        t.id === id ? { ...t, isDeleted: true, isDirty: true, updatedAt: now } : t
      );
    } else if (scope === 'future') {
      updatedAll = existing.map((t) => {
        if (
          t.recurrenceGroupId === target.recurrenceGroupId &&
          new Date(t.scheduledAt) >= new Date(target.scheduledAt)
        ) {
          return { ...t, isDeleted: true, isDirty: true, updatedAt: now };
        }
        return t;
      });
    } else {
      updatedAll = existing.map((t) => {
        if (t.recurrenceGroupId === target.recurrenceGroupId) {
          return { ...t, isDeleted: true, isDirty: true, updatedAt: now };
        }
        return t;
      });
    }

    await localSet(TASKS_KEY, updatedAll);
    await markDirty(DIRTY_TASKS_KEY, id);
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, [dispatch]);

  const markComplete = useCallback(async (id: string, complete: boolean): Promise<void> => {
    const existing = (await localGet<Task[]>(TASKS_KEY)) ?? [];
    const target = existing.find((t) => t.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updated = existing.map((t) =>
      t.id === id
        ? { ...t, isCompleted: complete, completedAt: complete ? now : undefined, isDirty: true, updatedAt: now }
        : t
    );
    await localSet(TASKS_KEY, updated);
    await markDirty(DIRTY_TASKS_KEY, id);

    // Write/remove completion record
    const completions = (await localGet<TaskCompletion[]>(COMPLETIONS_KEY)) ?? [];
    if (complete) {
      const record: TaskCompletion = {
        id: generateId(),
        taskId: id,
        userId: authState.user?.id ?? 'local',
        completedAt: now,
        date: now.split('T')[0],
      };
      await localSet(COMPLETIONS_KEY, [...completions, record]);
    } else {
      await localSet(COMPLETIONS_KEY, completions.filter((c) => c.taskId !== id));
    }

    dispatch({
      type: 'MARK_COMPLETE',
      payload: { id, isCompleted: complete, completedAt: complete ? now : undefined },
    });
  }, [authState.user?.id, dispatch]);

  // Apply filters
  let tasks = state.tasks.filter((t) => !t.isDeleted);
  if (filters?.priorities?.length) {
    tasks = tasks.filter((t) => filters.priorities!.includes(t.priority));
  }
  if (filters?.categories?.length) {
    tasks = tasks.filter((t) => filters.categories!.includes(t.category));
  }
  if (filters?.date) {
    tasks = tasks.filter(
      (t) => new Date(t.scheduledAt).toLocaleDateString('en-CA') === filters.date
    );
  }
  if (filters?.completed !== undefined) {
    tasks = tasks.filter((t) => t.isCompleted === filters.completed);
  }

  return { tasks, loading: state.loading, createTask, updateTask, deleteTask, markComplete };
}
