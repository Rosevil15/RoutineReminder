import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption,
  IonLabel, IonFab, IonFabButton, IonIcon, IonChip, IonActionSheet, IonText,
} from '@ionic/react';
import { add, checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { filterByPriority, filterByCategory, sortByPriority, priorityToColor } from '../utils/taskFilters';
import type { Priority, Category, RecurrenceScope } from '../types';

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const CATEGORIES: Category[] = ['school', 'work', 'personal', 'health'];
const PRIORITY_LABEL: Record<Priority, string> = { high: '🔴 High', medium: '🟠 Medium', low: '🟢 Low' };
const CATEGORY_EMOJI: Record<Category, string> = { school: '📚', work: '💼', personal: '🏠', health: '💪' };

const TaskListPage: React.FC = () => {
  const history = useHistory();
  const { tasks, deleteTask } = useTasks();
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [sortByPri, setSortByPri] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const togglePriority = (p: Priority) =>
    setSelectedPriorities((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const toggleCategory = (c: Category) =>
    setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  let displayed = filterByPriority(tasks, selectedPriorities);
  displayed = filterByCategory(displayed, selectedCategories);
  if (sortByPri) displayed = sortByPriority(displayed);

  const handleDelete = async (scope: RecurrenceScope) => {
    if (deleteTarget) { await deleteTask(deleteTarget, scope); setDeleteTarget(null); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: 700 }}>Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Filter chips */}
        <div style={{ padding: '8px 16px 4px', overflowX: 'auto', display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
          {PRIORITIES.map((p) => (
            <IonChip
              key={p}
              outline={!selectedPriorities.includes(p)}
              color={selectedPriorities.includes(p) ? 'primary' : 'medium'}
              onClick={() => togglePriority(p)}
              style={{ flexShrink: 0, fontSize: 13 }}
            >
              {PRIORITY_LABEL[p]}
            </IonChip>
          ))}
          <IonChip
            outline={!sortByPri}
            color={sortByPri ? 'primary' : 'medium'}
            onClick={() => setSortByPri((v) => !v)}
            style={{ flexShrink: 0, fontSize: 13 }}
          >
            ↕ Priority
          </IonChip>
        </div>
        <div style={{ padding: '0 16px 8px', overflowX: 'auto', display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
          {CATEGORIES.map((c) => (
            <IonChip
              key={c}
              outline={!selectedCategories.includes(c)}
              color={selectedCategories.includes(c) ? 'secondary' : 'medium'}
              onClick={() => toggleCategory(c)}
              style={{ flexShrink: 0, fontSize: 13, textTransform: 'capitalize' }}
            >
              {CATEGORY_EMOJI[c]} {c}
            </IonChip>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <IonText color="medium"><p style={{ margin: 0 }}>No tasks yet. Tap + to add one.</p></IonText>
          </div>
        ) : (
          <IonList style={{ background: 'transparent' }}>
            {displayed.map((task) => (
              <IonItemSliding key={task.id}>
                <IonItem
                  button
                  onClick={() => history.push(`/task-detail/${task.id}`)}
                  style={{ '--background': 'var(--ion-item-background)', '--border-radius': '12px', margin: '4px 16px' }}
                >
                  <IonIcon
                    slot="start"
                    icon={task.isCompleted ? checkmarkCircle : ellipseOutline}
                    style={{ fontSize: 22, color: task.isCompleted ? '#10b981' : '#d1d5db' }}
                  />
                  <IonLabel>
                    <h2 style={{
                      fontWeight: 600, fontSize: 15,
                      textDecoration: task.isCompleted ? 'line-through' : 'none',
                      color: task.isCompleted ? '#9ca3af' : 'var(--ion-text-color)',
                    }}>
                      {task.title}
                    </h2>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                      {CATEGORY_EMOJI[task.category]} {task.category} ·{' '}
                      {new Date(task.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </IonLabel>
                  <div slot="end" style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: priorityToColor(task.priority),
                  }} />
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => setDeleteTarget(task.id)}>Delete</IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <div style={{ height: 80 }} />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            onClick={() => history.push('/task-detail/new')}
            style={{ '--background': '#6366f1', '--box-shadow': '0 4px 16px rgba(99,102,241,0.4)' }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={!!deleteTarget}
          onDidDismiss={() => setDeleteTarget(null)}
          header="Delete task"
          buttons={[
            { text: 'This task only', role: 'destructive', handler: () => handleDelete('this') },
            { text: 'This and future tasks', role: 'destructive', handler: () => handleDelete('future') },
            { text: 'All recurring tasks', role: 'destructive', handler: () => handleDelete('all') },
            { text: 'Cancel', role: 'cancel' },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TaskListPage;
