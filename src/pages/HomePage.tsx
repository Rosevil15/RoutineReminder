import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonRefresher, IonRefresherContent, IonList, IonItem,
  IonLabel, IonBadge, IonAlert, IonProgressBar, IonText,
  IonButtons, IonButton, IonIcon,
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useRoutines } from '../hooks/useRoutines';
import { useProgress } from '../hooks/useProgress';
import { useSync } from '../hooks/useSync';
import { priorityToColor } from '../utils/taskFilters';
import { groupByTimeBlock } from '../utils/routineUtils';
import OfflineBanner from '../components/OfflineBanner';

const HomePage: React.FC = () => {
  const history = useHistory();
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');

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
    if (updated.percentage === 100 && updated.scheduled > 0) {
      setShowCongrats(true);
    }
  };

  const grouped = groupByTimeBlock(routines);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Today</IonTitle>
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

        {/* Daily Summary */}
        <div style={{ padding: '16px' }}>
          <IonText>
            <h3>
              {summary.completed}/{summary.scheduled} tasks completed ({summary.percentage}%)
            </h3>
          </IonText>
          <IonProgressBar value={summary.percentage / 100} color="primary" />
        </div>

        {/* Today's Tasks */}
        <IonText style={{ padding: '0 16px' }}>
          <h4>Tasks</h4>
        </IonText>
        {tasks.length === 0 ? (
          <IonText color="medium" style={{ padding: '0 16px' }}>
            <p>No tasks scheduled for today.</p>
          </IonText>
        ) : (
          <IonList>
            {tasks.map((task) => (
              <IonItem
                key={task.id}
                button
                onClick={() => history.push(`/task-detail/${task.id}`)}
              >
                <div
                  slot="start"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: priorityToColor(task.priority),
                  }}
                />
                <IonLabel>
                  <h2 style={{ textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                    {task.title}
                  </h2>
                  <p>{new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </IonLabel>
                <IonBadge color={task.isCompleted ? 'success' : 'medium'} slot="end">
                  {task.isCompleted ? 'Done' : task.category}
                </IonBadge>
                <IonButton
                  fill="clear"
                  slot="end"
                  onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id, task.isCompleted); }}
                >
                  {task.isCompleted ? '↩' : '✓'}
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Today's Routines */}
        {(['morning', 'afternoon', 'evening'] as const).map((block) => {
          const blockRoutines = grouped[block];
          if (blockRoutines.length === 0) return null;
          return (
            <div key={block}>
              <IonText style={{ padding: '0 16px' }}>
                <h4 style={{ textTransform: 'capitalize' }}>{block} Routines</h4>
              </IonText>
              <IonList>
                {blockRoutines.map((r) => (
                  <IonItem key={r.id} button onClick={() => history.push(`/routine-detail/${r.id}`)}>
                    <IonLabel>{r.name}</IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </div>
          );
        })}

        <IonAlert
          isOpen={showCongrats}
          onDidDismiss={() => setShowCongrats(false)}
          header="🎉 All Done!"
          message="You completed all tasks for today. Great work!"
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
