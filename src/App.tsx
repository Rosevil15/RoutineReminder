import React, { useEffect } from 'react';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, Switch } from 'react-router-dom';
import {
  homeOutline,
  checkboxOutline,
  calendarOutline,
  barChartOutline,
  listOutline,
} from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SyncProvider } from './context/SyncContext';
import { TaskProvider } from './context/TaskContext';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import RoutinePlannerPage from './pages/RoutinePlannerPage';
import RoutineDetailPage from './pages/RoutineDetailPage';
import CalendarPage from './pages/CalendarPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

setupIonicReact();

// ---- Helper: schedule a notification safely ----
async function scheduleLocalNotification(
  id: number,
  title: string,
  body: string,
  fireAt: Date
): Promise<void> {
  // Only schedule if fire time is in the future
  if (fireAt.getTime() <= Date.now()) return;
  await LocalNotifications.schedule({
    notifications: [{
      id,
      title,
      body,
      schedule: { at: fireAt },
      channelId: 'task-reminders',
      extra: {},
      sound: undefined,
      attachments: undefined,
      actionTypeId: '',
      smallIcon: undefined,
      iconColor: undefined,
    }],
  });
}

// ---- Helper: get next occurrence of a given hour:minute ----
function nextOccurrence(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

const MOTIVATIONAL_MESSAGES = [
  { title: '💪 Keep it up!', body: "You're building great habits. Check your tasks for today." },
  { title: '🌟 Stay focused!', body: 'Small steps every day lead to big results.' },
  { title: '🚀 You got this!', body: "Don't let today's tasks slip by. You're on a roll!" },
  { title: '🎯 Stay on track!', body: "Your goals are waiting. Let's get things done." },
  { title: '⚡ Power through!', body: 'A productive day starts with checking your task list.' },
];

const TabsLayout: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/app/tabs/home" component={HomePage} />
      <Route exact path="/app/tabs/tasks" component={TaskListPage} />
      <Route exact path="/app/tabs/routines" component={RoutinePlannerPage} />
      <Route exact path="/app/tabs/calendar" component={CalendarPage} />
      <Route exact path="/app/tabs/progress" component={ProgressPage} />
      <Redirect exact from="/app/tabs" to="/app/tabs/home" />
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/app/tabs/home">
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="tasks" href="/app/tabs/tasks">
        <IonIcon icon={checkboxOutline} />
        <IonLabel>Tasks</IonLabel>
      </IonTabButton>
      <IonTabButton tab="routines" href="/app/tabs/routines">
        <IonIcon icon={listOutline} />
        <IonLabel>Routines</IonLabel>
      </IonTabButton>
      <IonTabButton tab="calendar" href="/app/tabs/calendar">
        <IonIcon icon={calendarOutline} />
        <IonLabel>Calendar</IonLabel>
      </IonTabButton>
      <IonTabButton tab="progress" href="/app/tabs/progress">
        <IonIcon icon={barChartOutline} />
        <IonLabel>Progress</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

const App: React.FC = () => {
  useEffect(() => {
    const init = async () => {
      // 1. Request permission — REQUIRED on Android 13+ and iOS
      //    Without this, all notifications are silently dropped.
      const { display } = await LocalNotifications.requestPermissions();
      if (display !== 'granted') {
        console.warn('[Notifications] Permission not granted:', display);
        return; // Don't schedule if permission denied
      }

      // 2. Register notification channel (Android only, no-op on iOS)
      await LocalNotifications.createChannel({
        id: 'task-reminders',
        name: 'Task Reminders',
        description: 'Reminders for your tasks and routines',
        importance: 5,       // IMPORTANCE_HIGH — shows as heads-up notification
        sound: 'default',
        vibration: true,
        visibility: 1,       // VISIBILITY_PUBLIC
        lights: true,
        lightColor: '#6366f1',
      });

      // 3. Daily morning reminder at 8:00 AM
      await scheduleLocalNotification(
        900_000_001,
        '📋 Good morning! Your day awaits',
        'Check your tasks and routines for today.',
        nextOccurrence(8, 0)
      );

      // 4. Motivational notification at 10:00 AM
      const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      await scheduleLocalNotification(
        900_000_002,
        msg.title,
        msg.body,
        nextOccurrence(10, 0)
      );
    };

    init().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <SyncProvider>
          <TaskProvider>
            <IonApp>
              <IonReactRouter>
                <Switch>
                  <Route exact path="/auth/login" component={LoginPage} />
                  <Route exact path="/auth/register" component={RegisterPage} />
                  <Route exact path="/auth/forgot-password" component={ForgotPasswordPage} />
                  <Route path="/app/tabs" component={TabsLayout} />
                  <Route exact path="/task-detail/:id" component={TaskDetailPage} />
                  <Route exact path="/routine-detail/:id" component={RoutineDetailPage} />
                  <Route exact path="/settings" component={SettingsPage} />
                  <Redirect exact from="/" to="/auth/login" />
                </Switch>
              </IonReactRouter>
            </IonApp>
          </TaskProvider>
        </SyncProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
