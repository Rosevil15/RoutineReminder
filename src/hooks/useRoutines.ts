import { useCallback } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuthContext } from '../context/AuthContext';
import {
  localGet,
  localSet,
  markDirty,
  ROUTINES_KEY,
  HABITS_KEY,
  DIRTY_ROUTINES_KEY,
  DIRTY_HABITS_KEY,
} from '../utils/localStore';
import { validateTitle } from '../utils/validators';
import type { Routine, Habit, CreateRoutineDto, CreateHabitDto, LeadTime } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface RoutinesHook {
  routines: Routine[];
  loading: boolean;
  createRoutine: (dto: CreateRoutineDto) => Promise<Routine>;
  updateRoutine: (id: string, changes: Partial<Routine>) => Promise<Routine>;
  deleteRoutine: (id: string) => Promise<void>;
  addHabit: (routineId: string, dto: CreateHabitDto) => Promise<Habit>;
  markHabitComplete: (habitId: string, complete: boolean) => Promise<void>;
}

/**
 * useRoutines — manages routine and habit CRUD with offline-first local store.
 */
export function useRoutines(): RoutinesHook {
  const { state, dispatch } = useTaskContext();
  const { state: authState } = useAuthContext();

  // Data is loaded by TaskProvider on mount — no per-hook loading needed

  const createRoutine = useCallback(async (dto: CreateRoutineDto): Promise<Routine> => {
    if (!validateTitle(dto.name)) {
      throw new Error('Routine name cannot be empty or whitespace-only.');
    }

    const userId = authState.user?.id ?? 'local';
    const now = new Date().toISOString();

    const routine: Routine = {
      id: generateId(),
      userId,
      name: dto.name.trim(),
      timeBlock: dto.timeBlock,
      recurrenceType: dto.recurrenceType ?? 'daily',
      recurrenceDays: dto.recurrenceDays,
      reminderLeadTime: (dto.reminderLeadTime ?? 15) as LeadTime,
      isDirty: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      habits: [],
    };

    const existing = (await localGet<Routine[]>(ROUTINES_KEY)) ?? [];
    await localSet(ROUTINES_KEY, [routine, ...existing]);
    await markDirty(DIRTY_ROUTINES_KEY, routine.id);

    dispatch({ type: 'ADD_ROUTINE', payload: routine });
    return routine;
  }, [authState.user?.id, dispatch]);

  const updateRoutine = useCallback(async (
    id: string,
    changes: Partial<Routine>
  ): Promise<Routine> => {
    if (changes.name !== undefined && !validateTitle(changes.name)) {
      throw new Error('Routine name cannot be empty or whitespace-only.');
    }

    const existing = (await localGet<Routine[]>(ROUTINES_KEY)) ?? [];
    const target = existing.find((r) => r.id === id);
    if (!target) throw new Error(`Routine ${id} not found`);

    const now = new Date().toISOString();
    const updated: Routine = { ...target, ...changes, updatedAt: now, isDirty: true };
    await localSet(ROUTINES_KEY, existing.map((r) => (r.id === id ? updated : r)));
    await markDirty(DIRTY_ROUTINES_KEY, id);

    dispatch({ type: 'UPDATE_ROUTINE', payload: updated });
    return updated;
  }, [dispatch]);

  const deleteRoutine = useCallback(async (id: string): Promise<void> => {
    const existing = (await localGet<Routine[]>(ROUTINES_KEY)) ?? [];
    const now = new Date().toISOString();
    const updated = existing.map((r) =>
      r.id === id ? { ...r, isDeleted: true, isDirty: true, updatedAt: now } : r
    );
    await localSet(ROUTINES_KEY, updated);
    await markDirty(DIRTY_ROUTINES_KEY, id);
    dispatch({ type: 'DELETE_ROUTINE', payload: id });
  }, [dispatch]);

  const addHabit = useCallback(async (routineId: string, dto: CreateHabitDto): Promise<Habit> => {
    if (!validateTitle(dto.name)) {
      throw new Error('Habit name cannot be empty.');
    }

    const userId = authState.user?.id ?? 'local';
    const now = new Date().toISOString();

    const habit: Habit = {
      id: generateId(),
      routineId,
      userId,
      name: dto.name.trim(),
      isCompleted: false,
      isDirty: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const existing = (await localGet<Habit[]>(HABITS_KEY)) ?? [];
    await localSet(HABITS_KEY, [...existing, habit]);
    await markDirty(DIRTY_HABITS_KEY, habit.id);

    dispatch({ type: 'ADD_HABIT', payload: habit });
    return habit;
  }, [authState.user?.id, dispatch]);

  const markHabitComplete = useCallback(async (
    habitId: string,
    complete: boolean
  ): Promise<void> => {
    const existing = (await localGet<Habit[]>(HABITS_KEY)) ?? [];
    const now = new Date().toISOString();
    const updated = existing.map((h) =>
      h.id === habitId
        ? { ...h, isCompleted: complete, completedAt: complete ? now : undefined, isDirty: true, updatedAt: now }
        : h
    );
    await localSet(HABITS_KEY, updated);
    await markDirty(DIRTY_HABITS_KEY, habitId);

    const updatedHabit = updated.find((h) => h.id === habitId);
    if (updatedHabit) {
      dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit });
    }
  }, [dispatch]);

  const routines = state.routines.filter((r) => !r.isDeleted);

  return {
    routines,
    loading: state.loading,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addHabit,
    markHabitComplete,
  };
}
