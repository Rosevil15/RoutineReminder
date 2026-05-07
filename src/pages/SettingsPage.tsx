import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonToggle, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonButton, IonText,
  IonBackButton, IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import type { Theme, LeadTime } from '../types';

const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setGlobalEnabled } = useNotifications();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [defaultLeadTime, setDefaultLeadTime] = useState<LeadTime>(15);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleLogout = async () => {
    await logout();
    history.replace('/auth/login');
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsOn(enabled);
    await setGlobalEnabled(enabled);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/tabs/home" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {/* Theme */}
          <IonItem>
            <IonLabel>Theme</IonLabel>
          </IonItem>
          <IonItem>
            <IonSegment
              value={theme}
              onIonChange={(e) => setTheme(e.detail.value as Theme)}
              style={{ width: '100%' }}
            >
              <IonSegmentButton value="light"><IonLabel>Light</IonLabel></IonSegmentButton>
              <IonSegmentButton value="dark"><IonLabel>Dark</IonLabel></IonSegmentButton>
              <IonSegmentButton value="system"><IonLabel>System</IonLabel></IonSegmentButton>
            </IonSegment>
          </IonItem>

          {/* Notifications */}
          <IonItem>
            <IonLabel>Notifications</IonLabel>
            <IonToggle
              checked={notificationsOn}
              onIonChange={(e) => handleNotificationsToggle(e.detail.checked)}
              slot="end"
            />
          </IonItem>

          {/* Default lead time */}
          <IonItem>
            <IonLabel>Default Reminder</IonLabel>
            <IonSelect
              value={defaultLeadTime}
              onIonChange={(e) => setDefaultLeadTime(e.detail.value)}
              slot="end"
            >
              {([5, 10, 15, 30, 60] as LeadTime[]).map((t) => (
                <IonSelectOption key={t} value={t}>{t} min before</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Biometric login */}
          <IonItem>
            <IonLabel>Biometric Login</IonLabel>
            <IonToggle
              checked={biometricEnabled}
              onIonChange={(e) => setBiometricEnabled(e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonList>

        <div style={{ padding: '16px' }}>
          <IonButton expand="block" color="danger" fill="outline" onClick={handleLogout}>
            Sign Out
          </IonButton>
          <IonText color="medium">
            <p style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>
              TaskReminder v0.1.0
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
