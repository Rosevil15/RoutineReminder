// ============================================================
// Enums / Union Types
// ============================================================

export type Priority = 'high' | 'medium' | 'low';
export type Category = 'school' | 'work' | 'personal' | 'health';
export type TimeBlock = 'morning' | 'afternoon' | 'evening';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'selected_days';
export type RecurrenceScope = 'this' | 'future' | 'all';
export type LeadTime = 5 | 10 | 15 | 30 | 60; // minutes before scheduled time
export type Theme = 'light' | 'dark' | 'system';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// ============================================================
// Core Entities
// ============================================================

export interface Task {
  id: string;                        // UUID
  userId: string;
  title: string;                     // non-empty, required
  scheduledAt: string;               // ISO 8601 datetime
  priority: Priority;                // default: 'medium'
  category: Category;                // default: 'personal'
  recurrenceType: RecurrenceType;    // default: 'none'
  recurrenceDays?: number[];         // 0=Sun..6=Sat, used for 'selected_days'
  recurrenceGroupId?: string;        // UUID linking recurring instances
  reminderLeadTime: LeadTime;        // default: 15
  isCompleted: boolean;
  completedAt?: string;              // ISO 8601
  notificationId?: number;           // Capacitor local notification ID
  isDirty: boolean;                  // true = pending sync to Supabase
  isDeleted: boolean;                // soft delete flag for sync
  createdAt: string;                 // ISO 8601
  updatedAt: string;                 // ISO 8601
}

export interface Routine {
  id: string;                        // UUID
  userId: string;
  name: string;                      // non-empty, required
  timeBlock: TimeBlock;
  recurrenceType: RecurrenceType;    // default: 'daily'
  recurrenceDays?: number[];         // 0=Sun..6=Sat, used for 'selected_days'
  reminderLeadTime: LeadTime;        // default: 15
  notificationId?: number;           // Capacitor local notification ID
  isDirty: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  habits?: Habit[];                  // populated on read, not stored flat
}

export interface Habit {
  id: string;                        // UUID
  routineId: string;
  userId: string;
  name: string;                      // non-empty, required
  isCompleted: boolean;
  completedAt?: string;              // ISO 8601
  isDirty: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;                        // UUID
  taskId: string;
  userId: string;
  completedAt: string;               // ISO 8601
  date: string;                      // YYYY-MM-DD for daily aggregation
}

export interface UserPreferences {
  userId: string;
  notificationsEnabled: boolean;
  defaultLeadTime: LeadTime;
  theme: Theme;
  biometricEnabled: boolean;
}

// ============================================================
// DTOs (Data Transfer Objects for creation)
// ============================================================

export interface CreateTaskDto {
  title: string;
  scheduledAt: string;               // ISO 8601
  priority?: Priority;               // defaults to 'medium'
  category?: Category;               // defaults to 'personal'
  recurrenceType?: RecurrenceType;   // defaults to 'none'
  recurrenceDays?: number[];
  reminderLeadTime?: LeadTime;       // defaults to 15
}

export interface CreateRoutineDto {
  name: string;
  timeBlock: TimeBlock;
  recurrenceType?: RecurrenceType;   // defaults to 'daily'
  recurrenceDays?: number[];
  reminderLeadTime?: LeadTime;       // defaults to 15
}

export interface CreateHabitDto {
  name: string;
  routineId: string;
}

// ============================================================
// Filter / Query Types
// ============================================================

export interface TaskFilter {
  priorities?: Priority[];
  categories?: Category[];
  date?: string;                     // YYYY-MM-DD
  completed?: boolean;
}

// ============================================================
// Progress / Statistics Types
// ============================================================

export interface DailySummary {
  date: string;                      // YYYY-MM-DD
  scheduled: number;
  completed: number;
  percentage: number;                // 0-100, rounded
}

export interface DailyCount {
  date: string;                      // YYYY-MM-DD
  completed: number;
}

// ============================================================
// Sync Types
// ============================================================

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// ============================================================
// Auth Types
// ============================================================

export interface AppUser {
  id: string;
  email: string;
}
