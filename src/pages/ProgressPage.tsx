import React from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonText,
} from '@ionic/react';
import { useProgress } from '../hooks/useProgress';

const ProgressPage: React.FC = () => {
  const { getDailySummary, streakCount, weeklyChart } = useProgress();
  const today = new Date();
  const summary = getDailySummary(today);
  const maxCompleted = Math.max(...weeklyChart.map((d) => d.completed), 1);
  const pct = summary.percentage;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: 700 }}>Progress</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        {/* Today card */}
        <div style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '20px',
          color: '#fff',
          marginBottom: 16,
          boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.8 }}>Today's progress</p>
          <h2 style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 700 }}>
            {pct === 100 && summary.scheduled > 0 ? '🎉 All done!' : `${pct}%`}
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, background: '#fff',
              width: `${pct}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.75 }}>
            {summary.completed} of {summary.scheduled} tasks completed
          </p>
          {pct === 100 && summary.scheduled > 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.9 }}>🌟 Great work today!</p>
          )}
        </div>

        {/* Streak */}
        <div style={{
          borderRadius: 16,
          background: 'var(--ion-item-background)',
          padding: '16px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0,
          }}>🔥</div>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Current streak</p>
            <h3 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 700 }}>
              {streakCount} {streakCount === 1 ? 'day' : 'days'}
            </h3>
          </div>
        </div>

        {/* 7-day chart */}
        <div style={{
          borderRadius: 16,
          background: 'var(--ion-item-background)',
          padding: '16px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>
          <IonText><h4 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15 }}>Last 7 Days</h4></IonText>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
            {weeklyChart.map((entry) => {
              const barH = maxCompleted > 0 ? Math.max((entry.completed / maxCompleted) * 70, entry.completed > 0 ? 8 : 4) : 4;
              const label = new Date(entry.date + 'T12:00:00').toLocaleDateString('default', { weekday: 'short' });
              const isToday = entry.date === today.toLocaleDateString('en-CA');
              return (
                <div key={entry.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                    {entry.completed > 0 ? entry.completed : ''}
                  </span>
                  <div style={{
                    width: '100%', height: barH, borderRadius: 6,
                    background: isToday
                      ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                      : entry.completed > 0 ? '#c7d2fe' : '#e5e7eb',
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{
                    fontSize: 10, marginTop: 4,
                    color: isToday ? '#6366f1' : '#9ca3af',
                    fontWeight: isToday ? 700 : 400,
                  }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
};

export default ProgressPage;
