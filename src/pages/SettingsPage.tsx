import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonToggle, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonButton, IonText, IonIcon,
  IonBackButton, IonButtons,
} from '@ionic/react';
import {
  moonOutline, sunnyOutline, phonePortraitOutline,
  notificationsOutline, timeOutline, fingerPrintOutline, logOutOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import type { Theme, LeadTime } from '../types';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 8 }}>
    <p style={{ margin: '16px 16px 6px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {title}
    </p>
    <IonList style={{ background: 'transparent' }}>
      {children}
    </IonList>
  </div>
);

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

  const itemStyle = {
    '--background': 'var(--ion-item-background)',
    '--border-radius': '12px',
    margin: '4px 16px',
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/tabs/home" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>

        <Section title="Appearance">
          <IonItem style={itemStyle}>
            <IonIcon icon={theme === 'dark' ? moonOutline : theme === 'light' ? sunnyOutline : phonePortraitOutline} slot="start" color="primary" />
            <IonLabel>Theme</IonLabel>
            <IonSegment
              value={theme}
              onIonChange={(e) => setTheme(e.detail.value as Theme)}
              style={{ maxWidth: 180 }}
            >
              <IonSegmentButton value="light" style={{ fontSize: 12 }}>
                <IonIcon icon={sunnyOutline} />
              </IonSegmentButton>
              <IonSegmentButton value="dark" style={{ fontSize: 12 }}>
                <IonIcon icon={moonOutline} />
              </IonSegmentButton>
              <IonSegmentButton value="system" style={{ fontSize: 12 }}>
                <IonIcon icon={phonePortraitOutline} />
              </IonSegmentButton>
            </IonSegment>
          </IonItem>
        </Section>

        <Section title="Notifications">
          <IonItem style={itemStyle}>
            <IonIcon icon={notificationsOutline} slot="start" color="primary" />
            <IonLabel>Enable Notifications</IonLabel>
            <IonToggle
              checked={notificationsOn}
              onIonChange={(e) => handleNotificationsToggle(e.detail.checked)}
              slot="end"
              color="primary"
            />
          </IonItem>
          <IonItem style={itemStyle}>
            <IonIcon icon={timeOutline} slot="start" color="primary" />
            <IonLabel>Default Reminder</IonLabel>
            <IonSelect
              value={defaultLeadTime}
              onIonChange={(e) => setDefaultLeadTime(e.detail.value)}
              slot="end"
              interface="popover"
            >
              {([5, 10, 15, 30, 60] as LeadTime[]).map((t) => (
                <IonSelectOption key={t} value={t}>{t} min before</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </Section>

        <Section title="Security">
          <IonItem style={itemStyle}>
            <IonIcon icon={fingerPrintOutline} slot="start" color="primary" />
            <IonLabel>Biometric Login</IonLabel>
            <IonToggle
              checked={biometricEnabled}
              onIonChange={(e) => setBiometricEnabled(e.detail.checked)}
              slot="end"
              color="primary"
            />
          </IonItem>
        </Section>

        <div style={{ padding: '16px' }}>
          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            onClick={handleLogout}
            style={{ '--border-radius': '12px' }}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Sign Out
          </IonButton>
          <IonText color="medium">
            <p style={{ textAlign: 'center', fontSize: 12, marginTop: 12 }}>
              TaskReminder v0.1.0
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
