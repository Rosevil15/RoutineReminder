# Requirements Document

## Introduction

A mobile application that helps users manage their daily schedules, tasks, and routines through automated notifications and reminders. The app enables users to create and schedule tasks, define recurring daily routines, track habits and productivity, and receive timely push notifications — all with offline support and cloud backup. The goal is to improve user productivity and time management through a structured, intuitive interface.

## Glossary

- **App**: The Task Reminder and Daily Routine Management mobile application.
- **User**: A registered or guest person using the App on a mobile device.
- **Task**: A single schedulable unit of work with a title, date/time, priority, category, and optional recurrence.
- **Routine**: A named collection of Tasks grouped into a time-of-day block (Morning, Afternoon, or Evening) that repeats on a defined schedule.
- **Habit**: A Routine item tracked over time to measure consistency of completion.
- **Notification**: A push or local alert delivered to the User's device to remind them of an upcoming Task or Routine.
- **Scheduler**: The App subsystem responsible for computing and dispatching Notifications.
- **Calendar_View**: The App screen that displays Tasks and Routines in a monthly or weekly grid layout.
- **Auth_Service**: The App subsystem responsible for user registration, login, and session management (backed by Firebase or Supabase).
- **Sync_Service**: The App subsystem responsible for uploading and downloading data between local storage and the cloud backend.
- **Local_Store**: The on-device persistent storage used when the device is offline.
- **Cloud_Store**: The remote database (Firebase or Supabase) used for cloud backup and cross-device sync.
- **Priority**: A classification of task urgency — High, Medium, or Low.
- **Category**: A label grouping Tasks by context — School, Work, Personal, or Health.
- **Progress_Tracker**: The App subsystem that records task completion and computes productivity statistics.
- **Dark_Mode**: A display theme that uses a dark color palette to reduce eye strain in low-light environments.

---

## Requirements

### Requirement 1: Task Scheduling

**User Story:** As a User, I want to create tasks with a specific date, time, priority, and category, so that I can organize my responsibilities and know exactly when each task is due.

#### Acceptance Criteria

1. THE App SHALL allow the User to create a Task with a title, date, time, Priority, and Category.
2. WHEN the User saves a Task, THE App SHALL persist the Task to the Local_Store immediately.
3. THE App SHALL support recurrence options of daily, weekly, and monthly for any Task.
4. WHEN a recurring Task is created, THE Scheduler SHALL generate future Task instances according to the selected recurrence pattern.
5. WHEN the User edits a recurring Task, THE App SHALL prompt the User to apply the change to only the current instance or to all future instances.
6. WHEN the User deletes a Task, THE App SHALL remove the Task and all associated Notifications from the Local_Store.
7. THE App SHALL enforce that every Task has a non-empty title before saving.
8. IF the User attempts to save a Task without a title, THEN THE App SHALL display a validation error message and prevent saving.

---

### Requirement 2: Push Notifications and Reminders

**User Story:** As a User, I want to receive reminder alerts before my tasks start, so that I am notified in time to prepare and act.

#### Acceptance Criteria

1. WHEN a Task's scheduled time is reached, THE Scheduler SHALL deliver a Notification to the User's device.
2. THE App SHALL allow the User to configure a reminder lead time of 5, 10, 15, 30, or 60 minutes before a Task's scheduled time.
3. WHEN a Notification is triggered, THE Scheduler SHALL activate both sound and vibration on the device, subject to the device's system settings.
4. WHERE the device supports notification channels, THE App SHALL register a dedicated notification channel for Task reminders.
5. WHEN the User taps a Notification, THE App SHALL open the App and navigate directly to the associated Task's detail screen.
6. WHILE the device is offline, THE Scheduler SHALL deliver Notifications using the Local Notifications API without requiring a network connection.
7. THE App SHALL allow the User to enable or disable Notifications globally from the App settings screen.
8. IF the User disables Notifications, THEN THE Scheduler SHALL cancel all pending Notifications and not schedule new ones until Notifications are re-enabled.

---

### Requirement 3: Daily Routine Planner

**User Story:** As a User, I want to define and manage morning, afternoon, and evening routines, so that I can build consistent daily habits and structure my day.

#### Acceptance Criteria

1. THE App SHALL allow the User to create a Routine assigned to one of three time blocks: Morning, Afternoon, or Evening.
2. THE App SHALL allow the User to add one or more Habits to a Routine.
3. WHEN the User views the Daily Routine Planner screen, THE App SHALL display all Routines grouped by their time block in chronological order.
4. WHEN the User marks a Habit as complete, THE Progress_Tracker SHALL record the completion with the current date and time.
5. THE App SHALL allow the User to set a recurrence schedule (daily, weekly, or on selected days of the week) for each Routine.
6. WHEN a Routine's scheduled time arrives, THE Scheduler SHALL deliver a Notification for the Routine using the same lead-time setting as Tasks.
7. IF the User attempts to create a Routine without a name, THEN THE App SHALL display a validation error and prevent saving.

---

### Requirement 4: Calendar Integration

**User Story:** As a User, I want to view my tasks and routines in a calendar layout, so that I can see my schedule at a glance and plan ahead.

#### Acceptance Criteria

1. THE Calendar_View SHALL display Tasks and Routines in both a monthly grid view and a weekly timeline view.
2. WHEN the User selects a date in the Calendar_View, THE App SHALL display a list of all Tasks and Routines scheduled for that date.
3. WHEN the User taps a Task or Routine in the Calendar_View, THE App SHALL navigate to the detail screen for that item.
4. THE Calendar_View SHALL visually distinguish dates that have scheduled Tasks or Routines from dates with no items.
5. THE Calendar_View SHALL color-code Tasks according to their Priority: red for High, orange for Medium, and green for Low.
6. WHEN the User navigates to a future or past month in the monthly view, THE Calendar_View SHALL load and display the Tasks and Routines for that month within 500ms.

---

### Requirement 5: Priority Levels and Color Coding

**User Story:** As a User, I want to assign priority levels to my tasks and see them color-coded, so that I can quickly identify what needs my attention most.

#### Acceptance Criteria

1. THE App SHALL support exactly three Priority levels for Tasks: High, Medium, and Low.
2. WHEN a Task is displayed in any list or calendar view, THE App SHALL render a color indicator using red for High priority, orange for Medium priority, and green for Low priority.
3. THE App SHALL allow the User to filter the Task list by one or more Priority levels.
4. WHEN the User creates a Task without selecting a Priority, THE App SHALL assign Medium as the default Priority.
5. THE App SHALL allow the User to sort the Task list by Priority in descending order (High first).

---

### Requirement 6: Progress Tracking

**User Story:** As a User, I want to mark tasks as completed and view my daily productivity statistics, so that I can measure my progress and stay motivated.

#### Acceptance Criteria

1. WHEN the User marks a Task as complete, THE Progress_Tracker SHALL record the Task ID, completion timestamp, and User ID in the Local_Store.
2. THE App SHALL display a daily productivity summary showing the total number of Tasks scheduled, the number completed, and the completion percentage for the current day.
3. THE Progress_Tracker SHALL compute a streak count representing the number of consecutive days on which the User completed all scheduled Tasks.
4. WHEN the User views the progress screen, THE App SHALL display a 7-day completion chart showing the number of Tasks completed per day.
5. THE App SHALL allow the User to mark a completed Task as incomplete, updating the Progress_Tracker records accordingly.
6. WHEN the User completes all Tasks scheduled for a day, THE App SHALL display a congratulatory message on the progress screen.

---

### Requirement 7: Offline Mode

**User Story:** As a User, I want the app to work without an internet connection, so that I can manage my tasks and receive reminders regardless of network availability.

#### Acceptance Criteria

1. WHILE the device has no network connection, THE App SHALL allow the User to create, read, update, and delete Tasks and Routines using the Local_Store.
2. WHILE the device has no network connection, THE Scheduler SHALL continue to deliver Notifications using locally stored schedule data.
3. WHEN the device regains network connectivity, THE Sync_Service SHALL automatically synchronize all pending Local_Store changes to the Cloud_Store.
4. WHEN a sync conflict is detected (the same Task was modified both locally and in the Cloud_Store), THE Sync_Service SHALL retain the version with the most recent modification timestamp.
5. THE App SHALL display a visual indicator in the UI when the device is operating in offline mode.
6. WHEN the Sync_Service completes a synchronization, THE App SHALL update the UI to reflect the latest data from the Cloud_Store.

---

### Requirement 8: User Authentication

**User Story:** As a User, I want to register and log in to the app, so that my data is securely stored and backed up to the cloud.

#### Acceptance Criteria

1. THE Auth_Service SHALL allow the User to register with an email address and password.
2. THE Auth_Service SHALL allow the User to log in with a registered email address and password.
3. WHEN the User registers, THE Auth_Service SHALL validate that the email address is in a valid format and that the password is at least 8 characters long.
4. IF the User provides an invalid email format or a password shorter than 8 characters during registration, THEN THE Auth_Service SHALL display a descriptive error message and prevent account creation.
5. WHEN the User successfully logs in, THE Sync_Service SHALL download the User's cloud data to the Local_Store.
6. THE Auth_Service SHALL allow the User to reset their password via a link sent to their registered email address.
7. WHEN the User logs out, THE App SHALL clear all locally cached user data from the device.
8. WHERE the device supports biometric authentication, THE Auth_Service SHALL allow the User to log in using fingerprint or face recognition after the initial password login.

---

### Requirement 9: Task Categories

**User Story:** As a User, I want to assign categories to my tasks, so that I can organize and filter them by context such as school, work, personal, or health.

#### Acceptance Criteria

1. THE App SHALL support exactly four built-in Categories: School, Work, Personal, and Health.
2. WHEN the User creates or edits a Task, THE App SHALL allow the User to assign exactly one Category to the Task.
3. THE App SHALL allow the User to filter the Task list by one or more Categories.
4. WHEN the User views the Task list filtered by a Category, THE App SHALL display only Tasks belonging to the selected Categories.
5. WHEN a Task is displayed, THE App SHALL show the Category label alongside the Task title.
6. WHEN the User creates a Task without selecting a Category, THE App SHALL assign Personal as the default Category.

---

### Requirement 10: Dark Mode

**User Story:** As a User, I want to switch to a dark color theme, so that I can use the app comfortably in low-light environments without straining my eyes.

#### Acceptance Criteria

1. THE App SHALL provide a Dark_Mode theme and a light theme as display options.
2. WHEN the User enables Dark_Mode, THE App SHALL apply the dark color palette to all screens immediately without requiring a restart.
3. WHERE the device operating system provides a system-wide dark mode setting, THE App SHALL default to matching the system theme on first launch.
4. THE App SHALL persist the User's theme preference in the Local_Store so that the selected theme is applied on subsequent launches.
5. WHEN the User switches between Dark_Mode and light mode, THE App SHALL transition the theme within 300ms.
