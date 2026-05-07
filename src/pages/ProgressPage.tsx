import React from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonProgressBar, IonText, IonBadge,
} from '@ionic/react';
import { useProgress } from '../hooks/useProgress';

const ProgressPage: React.FC = () => {
  const { getDailySummary, streakCount, weeklyChart } = useProgress();
  const today = new Date();
  const summary = getDailySummary(today);

  const maxCompleted = Math.max(...weeklyChart.map((d) => d.completed), 1);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progress</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        {/* Today's summary */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Today</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>{summary.completed} of {summary.scheduled} tasks completed</p>
            </IonText>
            <IonProgressBar value={summary.percentage / 100} color="primary" style={{ marginTop: 8 }} />
            <IonText color="medium"><p>{summary.percentage}%</p></IonText>
            {summary.percentage === 100 && summary.scheduled > 0 && (
              <IonText color="success"><p>🎉 All tasks complete! Great work!</p></IonText>
            )}
          </IonCardContent>
        </IonCard>

        {/* Streak */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Current Streak</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IonBadge color="warning" style={{ fontSize: 24, padding: '8px 16px' }}>
                🔥 {streakCount}
              </IonBadge>
              <IonText color="medium">
                <p>consecutive {streakCount === 1 ? 'day' : 'days'} with all tasks completed</p>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 7-day chart */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Last 7 Days</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
              {weeklyChart.map((entry) => {
                const height = maxCompleted > 0 ? (entry.completed / maxCompleted) * 70 : 0;
                const label = new Date(entry.date + 'T12:00:00').toLocaleDateString('default', { weekday: 'short' });
                return (
                  <div key={entry.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <IonText color="medium" style={{ fontSize: 10 }}>{entry.completed}</IonText>
                    <div style={{
                      width: '100%', height: Math.max(height, 4),
                      backgroundColor: 'var(--ion-color-primary)', borderRadius: 4,
                    }} />
                    <IonText color="medium" style={{ fontSize: 10, marginTop: 2 }}>{label}</IonText>
                  </div>
                );
              })}
            </div>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default ProgressPage;
