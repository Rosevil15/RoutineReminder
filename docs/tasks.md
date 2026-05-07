# Implementation Plan: Task Reminder and Daily Routine Management App

## Overview

This plan converts the full design into incremental coding tasks for an Ionic React + Capacitor + Supabase offline-first mobile app. Each task builds on the previous one, ending with all components wired together. Tasks are ordered so that foundational layers (project setup, types, local store, context) are established before hooks, pages, and tests depend on them.

All package versions are pinned as specified in the design document. React Router v5 is used throughout — do **not** use React Router v6.

## Tasks

- [x] 1. Scaffold the Ionic React + Capacitor project
  - Run `npm create ionic@latest` selecting the React + TypeScript + Vite template, then install all pinned dependencies from the design document's `package.json` block
  - Configure `capacitor.config.ts` with `appId`, `appName`, and `webDir: 'dist'`
  - Add `@capacitor/android` and `@capacitor/ios` platforms (`npx cap add android`, `npx cap add ios`)
  - Create `vitest.config.ts` with `environment: 'jsdom'`, `globals: true`, and `setupFiles: ['./src/setupTests.ts']`
  - Create `src/setupTests.ts` with any global test setup (mock `@capacitor/preferences`, `@capacitor/local-notifications`, `@capacitor/network`)
  - Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholder variables
  - _Requirements: 7.1, 8.1_

- [x] 2. Define all TypeScript types and enums
  - Create `src/types/index.ts` containing every interface and type alias from the design: `Priority`, `Category`, `TimeBlock`, `RecurrenceType`, `RecurrenceScope`, `LeadTime`, `Task`, `Routine`, `Habit`, `TaskCompletion`, `UserPreferences`, `CreateTaskDto`, `CreateRoutineDto`, `CreateHabitDto`, `TaskFilter`, `DailySummary`, `DailyCount`, `SyncResult`, `SyncStatus`
  - Ensure all fields match the design exactly (optional fields, union types, default comments)
  - _Requirements: 1.1, 1.3, 3.1, 5.1, 9.1_

- [x] 3. Implement the local store utility
  - Create `src/utils/localStore.ts` exporting `localGet<T>`, `localSet<T>`, and `localRemove` wrapping `@capacitor/preferences`
  - Define and export the string constants for all store keys: `TASKS_KEY`, `ROUTINES_KEY`, `HABITS_KEY`, `COMPLETIONS_KEY`, `PREFERENCES_KEY`, `DIRTY_TASKS_KEY`, `DIRTY_ROUTINES_KEY`, `DIRTY_HABITS_KEY`, `LAST_SYNC_KEY`, `SESSION_TOKEN_KEY`
  - [ ]* 3.1 Write unit tests for localStore utility
    - Test `localGet` returns `null` when key is absent
    - Test `localSet` then `localGet` round-trip for objects and arrays
    - Test `localRemove` leaves key absent on subsequent `localGet`
    - _Requirements: 7.1_

- [x] 4. Implement pure utility functions
  - Create `src/utils/validators.ts` exporting `validateEmail(email: string): boolean` and `validatePassword(password: string): boolean` (min 8 chars)
  - Create `src/utils/notificationIds.ts` exporting `taskNotificationId(taskId: string): number` and `routineNotificationId(routineId: string): number` using the FNV-1a 32-bit hash from the design
  - Create `src/utils/taskFilters.ts` exporting `filterByPriority`, `filterByCategory`, `filterByDate`, `sortByPriority`, and `priorityToColor` pure functions
  - Create `src/utils/routineUtils.ts` exporting `groupByTimeBlock(routines: Routine[]): Record<TimeBlock, Routine[]>` that always returns groups in morning → afternoon → evening order
  - Create `src/utils/conflictResolution.ts` exporting `resolveConflict(local: Task, remote: Task): Task` using the later `updatedAt` timestamp
  - Create `src/utils/progressUtils.ts` exporting `computeDailySummary`, `computeStreak`, and `getWeeklyChart` pure functions
  - [ ]* 4.1 Write property test for validators (Property 22)
    - **Property 22: Input validation rejects invalid email formats and short passwords**
    - **Validates: Requirements 8.3**
  - [ ]* 4.2 Write property test for notification ID derivation (Property 5)
    - **Property 5: Notification fire time equals scheduled time minus lead time**
    - **Validates: Requirements 2.2, 3.6**
  - [ ]* 4.3 Write property test for priorityToColor (Property 11)
    - **Property 11: Priority-to-color mapping is correct and exhaustive**
    - **Validates: Requirements 4.5, 5.2**
  - [ ]* 4.4 Write property test for filterByPriority (Property 12)
    - **Property 12: Priority filter returns only tasks matching the selected priorities**
    - **Validates: Requirements 5.3**
  - [ ]* 4.5 Write property test for sortByPriority (Property 13)
    - **Property 13: Priority sort places higher-priority tasks before lower-priority tasks**
    - **Validates: Requirements 5.5**
  - [ ]* 4.6 Write property test for filterByDate (Property 10)
    - **Property 10: Date filter returns exactly the items scheduled for that date**
    - **Validates: Requirements 4.2, 4.4**
  - [ ]* 4.7 Write property test for groupByTimeBlock (Property 9)
    - **Property 9: Routines are grouped in chronological time-block order**
    - **Validates: Requirements 3.3**
  - [ ]* 4.8 Write property test for resolveConflict (Property 20)
    - **Property 20: Conflict resolution retains the version with the later timestamp**
    - **Validates: Requirements 7.4**
  - [ ]* 4.9 Write property test for computeDailySummary (Property 15)
    - **Property 15: Daily summary computation invariants**
    - **Validates: Requirements 6.2**
  - [ ]* 4.10 Write property test for computeStreak (Property 16)
    - **Property 16: Streak count equals consecutive fully-completed days**
    - **Validates: Requirements 6.3**
  - [ ]* 4.11 Write property test for getWeeklyChart (Property 17)
    - **Property 17: 7-day chart has exactly 7 entries with correct per-day counts**
    - **Validates: Requirements 6.4**
  - [ ]* 4.12 Write property test for whitespace title/name validation (Property 4)
    - **Property 4: Whitespace-only title or name is rejected**
    - **Validates: Requirements 1.7, 3.7**
  - [ ]* 4.13 Write property test for filterByCategory (Property 24)
    - **Property 24: Category filter returns only tasks matching the selected categories**
    - **Validates: Requirements 9.3, 9.4**

- [x] 5. Set up Supabase client and run database schema
  - Create `src/lib/supabaseClient.ts` initialising `createClient` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`
  - Create `supabase/migrations/001_initial_schema.sql` containing the full PostgreSQL schema from the design (profiles, user_preferences, tasks, routines, habits, task_completions, all indexes, RLS policies, and the `update_updated_at` trigger)
  - _Requirements: 8.1, 8.2, 7.3_

- [x] 6. Implement context providers and reducers
  - Create `src/context/AuthContext.tsx` with `AuthProvider` and `useAuthContext` hook; state shape: `{ user: User | null; loading: boolean }`; actions: `SET_USER`, `SET_LOADING`
  - Create `src/context/TaskContext.tsx` with `TaskProvider` and `useTaskContext` hook; `useReducer` with actions `SET_TASKS`, `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK`, `MARK_COMPLETE`
  - Create `src/context/ThemeContext.tsx` with `ThemeProvider` and `useThemeContext` hook; state shape: `{ theme: 'light' | 'dark' | 'system' }`
  - Create `src/context/SyncContext.tsx` with `SyncProvider` and `useSyncContext` hook; state shape: `{ syncStatus: SyncStatus; pendingChanges: number }`
  - _Requirements: 7.1, 10.1_

- [x] 7. Implement useNetwork hook
  - Create `src/hooks/useNetwork.ts` returning `{ isOffline: boolean; connectionType: string }`
  - Register a `@capacitor/network` `networkStatusChange` listener in a `useEffect`; initialise state from `Network.getStatus()` on mount
  - `isOffline` must be `true` when `connected === false` or `connectionType === 'none'`
  - [ ]* 7.1 Write property test for useNetwork (Property 21)
    - **Property 21: Offline indicator reflects network status correctly**
    - **Validates: Requirements 7.5**

- [x] 8. Implement useTheme hook
  - Create `src/hooks/useTheme.ts` returning `{ theme, setTheme }`
  - On mount, read persisted theme from `@capacitor/preferences`; fall back to `'system'` and detect `window.matchMedia('(prefers-color-scheme: dark)')` on first launch
  - `setTheme` writes to preferences then calls `applyTheme`
  - Export `applyTheme(theme)` as a standalone pure function that synchronously toggles `document.body.classList` with `'dark'`
  - [ ]* 8.1 Write property test for theme persistence (Property 25)
    - **Property 25: Theme preference persists across reads**
    - **Validates: Requirements 10.4**
  - [ ]* 8.2 Write property test for applyTheme (Property 26)
    - **Property 26: Theme application is synchronous**
    - **Validates: Requirements 10.2**

- [x] 9. Implement useAuth hook
  - Create `src/hooks/useAuth.ts` returning `{ user, loading, register, login, loginWithBiometrics, logout, resetPassword }`
  - `register`: validate email format and password length (≥ 8 chars) before calling `supabase.auth.signUp`; throw descriptive errors on validation failure
  - `login`: call `supabase.auth.signInWithPassword`; on success store session token in preferences
  - `loginWithBiometrics`: retrieve stored session token from preferences, call `BiometricAuth.authenticate`, then restore Supabase session
  - `logout`: call `supabase.auth.signOut`, then remove all user-specific keys from local store, then call `cancelAll` on notifications
  - Subscribe to `supabase.auth.onAuthStateChange` in a `useEffect` inside `AuthProvider` to keep `user` state current
  - [ ]* 9.1 Write property test for logout clears local store (Property 23)
    - **Property 23: Logout clears all user data from the local store**
    - **Validates: Requirements 8.7**

- [x] 10. Implement useNotifications hook
  - Create `src/hooks/useNotifications.ts` returning `{ scheduleTaskNotification, cancelTaskNotification, scheduleRoutineNotification, cancelRoutineNotification, cancelAll, setGlobalEnabled }`
  - `scheduleTaskNotification`: compute `fireAt = scheduledAt - reminderLeadTime * 60_000`; skip if `fireAt` is in the past or global notifications are disabled; call `LocalNotifications.schedule` with `channelId: 'task-reminders'` and `extra: { taskId }`
  - `cancelTaskNotification`: call `LocalNotifications.cancel` with the derived notification ID
  - `scheduleRoutineNotification` / `cancelRoutineNotification`: same pattern using `routineNotificationId`
  - `cancelAll`: call `LocalNotifications.cancel` for all known notification IDs; store disabled flag in preferences
  - `setGlobalEnabled`: persist flag; if disabling, call `cancelAll`
  - Register `localNotificationActionPerformed` listener once in a top-level `useEffect` to navigate to `/task-detail/:id` on tap
  - [ ]* 10.1 Write property test for notification fire time (Property 5)
    - **Property 5: Notification fire time equals scheduled time minus lead time**
    - **Validates: Requirements 2.2, 3.6**
  - [ ]* 10.2 Write property test for disabled notifications (Property 6)
    - **Property 6: Disabled notifications prevent scheduling**
    - **Validates: Requirements 2.8**

- [x] 11. Checkpoint — Ensure all utility and hook unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement useSync hook
  - Create `src/hooks/useSync.ts` returning `{ syncNow, syncStatus, pendingChanges }`
  - `syncNow`: read dirty task/routine/habit IDs from local store; upsert each to Supabase; for each record that also exists in Supabase with a different `updatedAt`, call `resolveConflict` and write the winner to both stores; clear dirty flags after successful push; pull any records updated in Supabase since `last_sync`; update `last_sync` timestamp; return `SyncResult`
  - Implement exponential backoff (1s, 2s, 4s, max 30s) for Supabase errors; surface error in `SyncContext` after 3 failures
  - Soft-delete sync: push `isDeleted = true` records to Supabase, then purge from local store after confirmation
  - Register `networkStatusChange` and `appStateChange` listeners in `SyncProvider`'s `useEffect` to trigger `syncNow` automatically
  - _Requirements: 7.3, 7.4, 7.6_

- [x] 13. Implement useTasks hook
  - Create `src/hooks/useTasks.ts` returning `{ tasks, loading, createTask, updateTask, deleteTask, markComplete }`
  - `createTask`: validate non-empty title; generate UUID; write to local store; add to `dirty_tasks`; dispatch `ADD_TASK` to `TaskContext`; call `scheduleTaskNotification`; for recurring tasks, generate instances up to 90 days ahead sharing the same `recurrenceGroupId`
  - `updateTask`: apply changes to local store; add to `dirty_tasks`; dispatch `UPDATE_TASK`; reschedule notification; handle `RecurrenceScope` (`this` / `future` / `all`) for recurring tasks
  - `deleteTask`: set `isDeleted = true` in local store; add to `dirty_tasks`; dispatch `DELETE_TASK`; call `cancelTaskNotification`; handle `RecurrenceScope` for recurring tasks
  - `markComplete`: toggle `isCompleted`; write `TaskCompletion` record to local store; dispatch `MARK_COMPLETE`; update `dirty_tasks`
  - Accept optional `TaskFilter` to return a filtered subset of tasks from context state
  - [ ]* 13.1 Write property test for task creation round-trip (Property 1)
    - **Property 1: Task creation round-trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 9.2**
  - [ ]* 13.2 Write property test for recurring task instance spacing (Property 2)
    - **Property 2: Recurring task instance spacing**
    - **Validates: Requirements 1.4**
  - [ ]* 13.3 Write property test for task deletion removes task and cancels notification (Property 3)
    - **Property 3: Task deletion removes task and cancels notification**
    - **Validates: Requirements 1.6**
  - [ ]* 13.4 Write property test for marking complete creates completion record (Property 14)
    - **Property 14: Marking a task complete creates a completion record**
    - **Validates: Requirements 6.1**
  - [ ]* 13.5 Write property test for completion toggle round-trip (Property 18)
    - **Property 18: Completion toggle is a round-trip**
    - **Validates: Requirements 6.5**
  - [ ]* 13.6 Write property test for offline CRUD (Property 19)
    - **Property 19: Offline CRUD operations succeed without network**
    - **Validates: Requirements 7.1**

- [x] 14. Implement useRoutines hook
  - Create `src/hooks/useRoutines.ts` returning `{ routines, loading, createRoutine, updateRoutine, deleteRoutine, addHabit, markHabitComplete }`
  - `createRoutine`: validate non-empty name; generate UUID; write to local store; add to `dirty_routines`; dispatch to `TaskContext`; call `scheduleRoutineNotification`
  - `updateRoutine`: update local store; add to `dirty_routines`; reschedule notification
  - `deleteRoutine`: soft-delete in local store; add to `dirty_routines`; cancel notification
  - `addHabit`: create `Habit` record linked to `routineId`; write to local store; add to `dirty_habits`
  - `markHabitComplete`: toggle `isCompleted` on habit; write completion timestamp; add to `dirty_habits`
  - [ ]* 14.1 Write property test for routine creation round-trip (Property 7)
    - **Property 7: Routine creation round-trip**
    - **Validates: Requirements 3.1, 3.5**
  - [ ]* 14.2 Write property test for habits added to routine are all retrievable (Property 8)
    - **Property 8: Habits added to a routine are all retrievable**
    - **Validates: Requirements 3.2**

- [x] 15. Implement useProgress hook
  - Create `src/hooks/useProgress.ts` returning `{ getDailySummary, streakCount, weeklyChart, recordCompletion }`
  - `getDailySummary(date)`: read completions and tasks from local store; call `computeDailySummary`
  - `streakCount`: call `computeStreak` over all completions and tasks
  - `weeklyChart`: call `getWeeklyChart` for the last 7 days
  - `recordCompletion`: write or remove a `TaskCompletion` record in local store
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Checkpoint — Ensure all hook tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Set up navigation and App shell
  - Create `src/App.tsx` wrapping the provider tree: `AuthProvider > ThemeProvider > SyncProvider > TaskProvider`
  - Inside `App.tsx`, register the Android notification channel in a `useEffect` on mount: `LocalNotifications.createChannel({ id: 'task-reminders', name: 'Task Reminders', importance: 4, sound: 'default', vibration: true, visibility: 1 })`
  - Define all routes using `IonReactRouter` and `IonRouterOutlet` (React Router v5):
    - `/auth/login`, `/auth/register`, `/auth/forgot-password`
    - `/app/tabs` with `IonTabs` containing tabs: `/app/tabs/home`, `/app/tabs/tasks`, `/app/tabs/routines`, `/app/tabs/calendar`, `/app/tabs/progress`
    - `/task-detail/:id`, `/routine-detail/:id`, `/settings`
  - Add a redirect from `/` to `/auth/login` (or `/app/tabs/home` if authenticated)
  - Create `src/components/OfflineBanner.tsx` that reads `useNetwork().isOffline` and renders an `IonBanner` or `IonChip` when offline
  - _Requirements: 7.5_

- [x] 18. Implement AuthPage screens
  - Create `src/pages/auth/LoginPage.tsx` with email + password fields, login button, link to register, link to forgot-password, and biometric login button (shown only when `biometricEnabled` preference is true)
  - Create `src/pages/auth/RegisterPage.tsx` with email + password fields; inline validation errors for invalid email format and password < 8 chars; calls `useAuth().register`
  - Create `src/pages/auth/ForgotPasswordPage.tsx` with email field; calls `useAuth().resetPassword`; shows success message
  - All auth forms use `IonInput`, `IonButton`, `IonItem`, `IonLabel`, and `IonText` for error display
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

- [x] 19. Implement HomePage (Dashboard)
  - Create `src/pages/HomePage.tsx` showing today's tasks (via `useTasks({ date: today })`) and today's routines (via `useRoutines`)
  - Display `DailySummary` from `useProgress().getDailySummary(today)` — scheduled count, completed count, percentage
  - Show congratulatory `IonAlert` or banner when `percentage === 100` and `scheduled > 0`
  - Include pull-to-refresh (`IonRefresher`) that calls `useSync().syncNow()`
  - Show `OfflineBanner` when offline
  - _Requirements: 6.2, 6.6, 7.5_

- [x] 20. Implement TaskListPage
  - Create `src/pages/TaskListPage.tsx` displaying all tasks from `useTasks()`
  - Add filter controls (priority multi-select, category multi-select) using `IonSelect` or `IonChip` toggles; wire to `filterByPriority` and `filterByCategory`
  - Add sort-by-priority toggle wired to `sortByPriority`
  - Each task row shows title, category label, priority color indicator (red/orange/green dot), and scheduled time
  - Swipe-to-delete gesture using `IonItemSliding` calls `useTasks().deleteTask`
  - FAB button navigates to `/task-detail/new`
  - _Requirements: 5.2, 5.3, 5.5, 9.3, 9.4, 9.5_

- [x] 21. Implement TaskDetailPage
  - Create `src/pages/TaskDetailPage.tsx` for both create (`/task-detail/new`) and edit (`/task-detail/:id`) modes
  - Form fields: title (`IonInput`), date/time (`IonDatetime`), priority (`IonSelect`), category (`IonSelect`), recurrence type (`IonSelect`), recurrence days (day-of-week checkboxes, shown only for `selected_days`), reminder lead time (`IonSelect` with options 5/10/15/30/60)
  - Inline validation: prevent save if title is empty or whitespace-only; show `IonText` error
  - On save: call `useTasks().createTask` or `useTasks().updateTask`; for recurring task edits show `IonActionSheet` asking `this` / `future` / `all`
  - Complete/incomplete toggle button calls `useTasks().markComplete`
  - Delete button (edit mode only) calls `useTasks().deleteTask` with same recurrence scope prompt
  - _Requirements: 1.1, 1.5, 1.7, 1.8, 5.4, 9.6_

- [x] 22. Implement RoutinePlannerPage and RoutineDetailPage
  - Create `src/pages/RoutinePlannerPage.tsx` displaying routines grouped by time block (morning → afternoon → evening) using `groupByTimeBlock`; each group is an `IonList` section
  - Each routine row shows name, time block, recurrence, and a habit completion checklist
  - Habit checkboxes call `useRoutines().markHabitComplete`
  - FAB navigates to `/routine-detail/new`
  - Create `src/pages/RoutineDetailPage.tsx` for create/edit with fields: name, time block, recurrence type, recurrence days, reminder lead time
  - Inline validation: prevent save if name is empty or whitespace-only
  - Add/remove habits inline (each habit is an `IonInput` row with a delete button)
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.7_

- [x] 23. Implement CalendarPage
  - Create `src/pages/CalendarPage.tsx` with a monthly grid view and a weekly timeline view, toggled by a segment control
  - Monthly grid: render a 7-column grid of day cells; highlight dates that have tasks or routines; color-code task dots by priority (red/orange/green)
  - Tapping a date calls `filterByDate` and displays the day's items in a list below the grid
  - Weekly timeline: render 7 columns (Mon–Sun) with time slots; place task/routine chips in their scheduled slots
  - Tapping a task/routine chip navigates to its detail page
  - Month navigation (prev/next arrows) loads data within 500ms using local store reads (no network call required)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 24. Implement ProgressPage
  - Create `src/pages/ProgressPage.tsx` displaying:
    - Today's `DailySummary` (scheduled / completed / percentage) from `useProgress`
    - Streak count badge from `useProgress().streakCount`
    - 7-day bar chart from `useProgress().weeklyChart` (render as `IonProgressBar` rows or a simple SVG bar chart)
    - Congratulatory message when all tasks for today are complete
  - _Requirements: 6.2, 6.3, 6.4, 6.6_

- [x] 25. Implement SettingsPage
  - Create `src/pages/SettingsPage.tsx` with:
    - Theme selector (`IonSegment` with Light / Dark / System options) wired to `useTheme().setTheme`
    - Notifications toggle (`IonToggle`) wired to `useNotifications().setGlobalEnabled`
    - Default lead time selector (`IonSelect`) wired to user preferences in local store
    - Biometric login toggle (`IonToggle`) wired to `useAuth` preferences
    - Logout button calling `useAuth().logout` then redirecting to `/auth/login`
  - _Requirements: 2.7, 8.7, 8.8, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 26. Wire dark mode into the app shell
  - In `ThemeProvider`, call `applyTheme` on mount (reading persisted preference) and whenever `theme` state changes
  - Add `window.matchMedia` listener for `prefers-color-scheme` changes to re-apply when `theme === 'system'`
  - Ensure `document.body.classList` toggle happens synchronously (no `setTimeout` or async operations)
  - _Requirements: 10.2, 10.3, 10.5_

- [x] 27. Checkpoint — Ensure all page rendering tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 28. Write page-level unit and integration tests
  - [x] 28.1 Write unit tests for TaskDetailPage
    - Test that saving with empty title shows validation error and does not call `createTask`
    - Test that saving with whitespace-only title shows validation error
    - Test that recurrence scope action sheet appears on edit of recurring task
    - _Requirements: 1.7, 1.8, 1.5_
  - [ ]* 28.2 Write unit tests for CalendarPage
    - Test that selecting a date renders only tasks/routines for that date
    - Test that priority color dots are rendered correctly
    - _Requirements: 4.2, 4.5_
  - [ ]* 28.3 Write unit tests for ProgressPage
    - Test that congratulatory message appears when all tasks are complete
    - Test that streak count and weekly chart render with mock data
    - _Requirements: 6.3, 6.4, 6.6_
  - [ ]* 28.4 Write unit tests for SettingsPage
    - Test that toggling notifications calls `setGlobalEnabled`
    - Test that theme segment calls `setTheme`
    - _Requirements: 2.7, 10.1_

- [x] 29. Implement Supabase Realtime subscription
  - Inside `TaskProvider`'s `useEffect`, subscribe to `supabase.channel('tasks').on('postgres_changes', ...)` for INSERT/UPDATE/DELETE events on the `tasks` table filtered by `user_id`
  - On receiving a remote change, call `resolveConflict` if the record is also dirty locally; dispatch the winning version to `TaskContext`
  - Unsubscribe on provider unmount
  - _Requirements: 7.6_

- [x] 30. Final integration wiring and smoke tests
  - [x] 30.1 Verify notification tap navigation
    - Confirm `localNotificationActionPerformed` listener in `useNotifications` correctly calls `history.push('/task-detail/:id')` using a mock listener
    - _Requirements: 2.5_
  - [x] 30.2 Verify sync triggers on network reconnect
    - Write an integration test that fires a mock `networkStatusChange` event with `connected: true` and asserts `syncNow` is called
    - _Requirements: 7.3_
  - [x] 30.3 Verify notification channel registration on app init
    - Write a smoke test asserting `LocalNotifications.createChannel` is called with `id: 'task-reminders'` during `App.tsx` mount
    - _Requirements: 2.4_
  - [ ]* 30.4 Write integration test for Supabase auth registration flow
    - Test that `register` with valid credentials calls `supabase.auth.signUp` and stores session
    - _Requirements: 8.1, 8.3_
  - [ ]* 30.5 Write integration test for login triggers sync
    - Test that successful `login` calls `syncNow` to pull cloud data
    - _Requirements: 8.5_

- [x] 31. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All 26 correctness properties from the design document are covered by property-based tests in tasks 4, 7, 8, 9, 10, 13, and 14
- Each task references specific requirements for traceability
- React Router v5 is used throughout — do **not** introduce React Router v6 APIs
- All package versions must remain pinned as specified in the design document
- The local store is always the primary read/write target; Supabase is synced asynchronously
- Property tests use `fast-check` 3.22.0 with Vitest 2.1.8; each test file includes a comment `// Feature: task-reminder-routine-app, Property N: <property text>`
