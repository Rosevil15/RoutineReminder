import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonRefresher, IonRefresherContent, IonList, IonItem,
  IonLabel, IonAlert, IonText, IonButtons, IonButton, IonIcon,
} from '@ionic/react';
import { settingsOutline, checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useRoutines } from '../hooks/useRoutines';
import { useProgress } from '../hooks/useProgress';
import { useSync } from '../hooks/useSync';
import { priorityToColor } from '../utils/taskFilters';
import { groupByTimeBlock } from '../utils/routineUtils';
import OfflineBanner from '../components/OfflineBanner';

const BLOCK_EMOJI: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

const HomePage: React.FC = () => {
  const history = useHistory();
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const { tasks, markComplete } = useTasks({ date: todayStr });
  const { routines } = useRoutines();
  const { getDailySummary } = useProgress();
  const { syncNow } = useSync();

  const summary = getDailySummary(today);
  const [showCongrats, setShowCongrats] = useState(false);

  const handleRefresh = async (event: CustomEvent) => {
    await syncNow();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const handleToggleComplete = async (id: string, current: boolean) => {
    await markComplete(id, !current);
    const updated = getDailySummary(today);
    if (updated.percentage === 100 && updated.scheduled > 0) setShowCongrats(true);
  };

  const grouped = groupByTimeBlock(routines);
  const pct = summary.percentage;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: 700 }}>Today</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/settings')}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <OfflineBanner />

        {/* Hero summary card */}
        <div style={{
          margin: '16px 16px 8px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '20px 20px 16px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.8 }}>{greeting} 👋</p>
          <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>
            {pct === 100 && summary.scheduled > 0
              ? 'All done! 🎉'
              : summary.scheduled === 0
              ? 'No tasks today'
              : `${summary.completed} of ${summary.scheduled} done`}
          </h2>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: '#fff',
              width: `${pct}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.75 }}>{pct}% complete</p>
        </div>

        {/* Tasks */}
        <div style={{ padding: '8px 16px 4px' }}>
          <IonText><h4 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Tasks</h4></IonText>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
            <IonText color="medium"><p style={{ margin: 0 }}>No tasks scheduled for today</p></IonText>
          </div>
        ) : (
          <IonList style={{ background: 'transparent' }}>
            {tasks.map((task) => (
              <IonItem
                key={task.id}
                button
                onClick={() => history.push(`/task-detail/${task.id}`)}
                style={{ '--background': 'var(--ion-item-background)', '--border-radius': '12px', margin: '4px 16px' }}
              >
                <IonButton
                  fill="clear"
                  slot="start"
                  style={{ '--padding-start': 0, '--padding-end': 0, margin: 0 }}
                  onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id, task.isCompleted); }}
                >
                  <IonIcon
                    icon={task.isCompleted ? checkmarkCircle : ellipseOutline}
                    style={{ fontSize: 24, color: task.isCompleted ? '#10b981' : '#d1d5db' }}
                  />
                </IonButton>
                <IonLabel>
                  <h2 style={{
                    fontWeight: 600, fontSize: 15,
                    textDecoration: task.isCompleted ? 'line-through' : 'none',
                    color: task.isCompleted ? '#9ca3af' : 'var(--ion-text-color)',
                  }}>
                    {task.title}
                  </h2>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                    {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    <span style={{ textTransform: 'capitalize' }}>{task.category}</span>
                  </p>
                </IonLabel>
                <div slot="end" style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: priorityToColor(task.priority),
                }} />
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Routines */}
        {(['morning', 'afternoon', 'evening'] as const).map((block) => {
          const br = grouped[block];
          if (!br.length) return null;
          return (
            <div key={block}>
              <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>{BLOCK_EMOJI[block]}</span>
                <IonText><h4 style={{ margin: 0, fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{block}</h4></IonText>
              </div>
              <IonList style={{ background: 'transparent' }}>
                {br.map((r) => (
                  <IonItem
                    key={r.id}
                    button
                    onClick={() => history.push(`/routine-detail/${r.id}`)}
                    style={{ '--background': 'var(--ion-item-background)', '--border-radius': '12px', margin: '4px 16px' }}
                  >
                    <IonLabel>
                      <h2 style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</h2>
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>{r.recurrenceType}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </div>
          );
        })}

        <div style={{ height: 80 }} />

        <IonAlert
          isOpen={showCongrats}
          onDidDismiss={() => setShowCongrats(false)}
          header="🎉 All Done!"
          message="You completed all tasks for today. Great work!"
          buttons={['Awesome!']}
        />
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
