import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Task, Routine, Habit } from '../types';

// ---- State ----
interface TaskState {
  tasks: Task[];
  routines: Routine[];
  habits: Habit[];
  loading: boolean;
}

// ---- Actions ----
type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string } // task id
  | { type: 'MARK_COMPLETE'; payload: { id: string; isCompleted: boolean; completedAt?: string } }
  | { type: 'SET_ROUTINES'; payload: Routine[] }
  | { type: 'ADD_ROUTINE'; payload: Routine }
  | { type: 'UPDATE_ROUTINE'; payload: Routine }
  | { type: 'DELETE_ROUTINE'; payload: string } // routine id
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'SET_LOADING'; payload: boolean };

// ---- Reducer ----
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };
    case 'MARK_COMPLETE':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? {
                ...t,
                isCompleted: action.payload.isCompleted,
                completedAt: action.payload.completedAt,
              }
            : t
        ),
      };
    case 'SET_ROUTINES':
      return { ...state, routines: action.payload };
    case 'ADD_ROUTINE':
      return { ...state, routines: [...state.routines, action.payload] };
    case 'UPDATE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_ROUTINE':
      return {
        ...state,
        routines: state.routines.filter((r) => r.id !== action.payload),
      };
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ---- Context ----
interface TaskContextValue {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

// ---- Provider ----
interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    routines: [],
    habits: [],
    loading: true,
  });

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

// ---- Hook ----
export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return ctx;
}
