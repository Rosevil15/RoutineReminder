import { useCallback, useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { taskNotificationId, routineNotificationId, computeFireAt } from '../utils/notificationIds';
import type { Task, Routine } from '../types';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const SCHEDULED_NOTIFICATION_IDS_KEY = 'scheduled_notification_ids';

interface NotificationsHook {
  scheduleTaskNotification: (task: Task) => Promise<void>;
  cancelTaskNotification: (taskId: string) => Promise<void>;
  scheduleRoutineNotification: (routine: Routine) => Promise<void>;
  cancelRoutineNotification: (routineId: string) => Promise<void>;
  cancelAll: () => Promise<void>;
  setGlobalEnabled: (enabled: boolean) => Promise<void>;
}

async function isNotificationsEnabled(): Promise<boolean> {
  const { value } = await Preferences.get({ key: NOTIFICATIONS_ENABLED_KEY });
  // Default to enabled if not set
  return value === null || value === 'true';
}

async function trackNotificationId(id: number): Promise<void> {
  const { value } = await Preferences.get({ key: SCHEDULED_NOTIFICATION_IDS_KEY });
  const ids: number[] = value ? JSON.parse(value) : [];
  if (!ids.includes(id)) {
    ids.push(id);
    await Preferences.set({ key: SCHEDULED_NOTIFICATION_IDS_KEY, value: JSON.stringify(ids) });
  }
}

async function untrackNotificationId(id: number): Promise<void> {
  const { value } = await Preferences.get({ key: SCHEDULED_NOTIFICATION_IDS_KEY });
  const ids: number[] = value ? JSON.parse(value) : [];
  const filtered = ids.filter((i) => i !== id);
  await Preferences.set({ key: SCHEDULED_NOTIFICATION_IDS_KEY, value: JSON.stringify(filtered) });
}

/**
 * useNotifications — manages local notification scheduling.
 * Uses @capacitor/local-notifications exclusively (works offline).
 * Property 5: Notification fire time = scheduledAt - leadTime * 60_000.
 * Property 6: Disabled notifications prevent scheduling.
 */
export function useNotifications(): NotificationsHook {
  const history = useHistory();
  const historyRef = useRef(history);
  historyRef.current = history;

  // Register notification tap listener once on mount
  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const taskId = action.notification.extra?.taskId as string | undefined;
      if (taskId) {
        historyRef.current.push(`/task-detail/${taskId}`);
      }
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  const scheduleTaskNotification = useCallback(async (task: Task): Promise<void> => {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    const scheduledAtMs = new Date(task.scheduledAt).getTime();
    const fireAt = computeFireAt(scheduledAtMs, task.reminderLeadTime);

    // Skip if fire time is in the past
    if (fireAt <= Date.now()) return;

    const id = taskNotificationId(task.id);

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: `Reminder: ${task.title}`,
          body: `Scheduled for ${new Date(task.scheduledAt).toLocaleTimeString()}`,
          schedule: { at: new Date(fireAt) },
          channelId: 'task-reminders',
          extra: { taskId: task.id },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          smallIcon: undefined,
          iconColor: undefined,
        },
      ],
    });

    await trackNotificationId(id);
  }, []);

  const cancelTaskNotification = useCallback(async (taskId: string): Promise<void> => {
    const id = taskNotificationId(taskId);
    await LocalNotifications.cancel({ notifications: [{ id }] });
    await untrackNotificationId(id);
  }, []);

  const scheduleRoutineNotification = useCallback(async (routine: Routine): Promise<void> => {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    // Routines don't have a single scheduledAt — use a placeholder based on time block
    const timeBlockHours: Record<string, number> = {
      morning: 8,
      afternoon: 13,
      evening: 19,
    };
    const hour = timeBlockHours[routine.timeBlock] ?? 9;
    const today = new Date();
    today.setHours(hour, 0, 0, 0);
    const scheduledAtMs = today.getTime();
    const fireAt = computeFireAt(scheduledAtMs, routine.reminderLeadTime);

    if (fireAt <= Date.now()) return;

    const id = routineNotificationId(routine.id);

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: `Routine: ${routine.name}`,
          body: `Time for your ${routine.timeBlock} routine`,
          schedule: { at: new Date(fireAt) },
          channelId: 'task-reminders',
          extra: { routineId: routine.id },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          smallIcon: undefined,
          iconColor: undefined,
        },
      ],
    });

    await trackNotificationId(id);
  }, []);

  const cancelRoutineNotification = useCallback(async (routineId: string): Promise<void> => {
    const id = routineNotificationId(routineId);
    await LocalNotifications.cancel({ notifications: [{ id }] });
    await untrackNotificationId(id);
  }, []);

  const cancelAll = useCallback(async (): Promise<void> => {
    const { value } = await Preferences.get({ key: SCHEDULED_NOTIFICATION_IDS_KEY });
    const ids: number[] = value ? JSON.parse(value) : [];
    if (ids.length > 0) {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    }
    await Preferences.set({ key: SCHEDULED_NOTIFICATION_IDS_KEY, value: JSON.stringify([]) });
  }, []);

  const setGlobalEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    await Preferences.set({ key: NOTIFICATIONS_ENABLED_KEY, value: String(enabled) });
    if (!enabled) {
      await cancelAll();
    }
  }, [cancelAll]);

  return {
    scheduleTaskNotification,
    cancelTaskNotification,
    scheduleRoutineNotification,
    cancelRoutineNotification,
    cancelAll,
    setGlobalEnabled,
  };
}
