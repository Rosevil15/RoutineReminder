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
  // Register Android notification channel on mount
  useEffect(() => {
    LocalNotifications.createChannel({
      id: 'task-reminders',
      name: 'Task Reminders',
      importance: 4,
      sound: 'default',
      vibration: true,
      visibility: 1,
    }).catch(console.error);
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
