import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption,
  IonLabel, IonBadge, IonFab, IonFabButton, IonIcon,
  IonChip, IonActionSheet,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { filterByPriority, filterByCategory, sortByPriority, priorityToColor } from '../utils/taskFilters';
import type { Priority, Category, RecurrenceScope } from '../types';

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const CATEGORIES: Category[] = ['school', 'work', 'personal', 'health'];

const TaskListPage: React.FC = () => {
  const history = useHistory();
  const { tasks, deleteTask } = useTasks();
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [sortByPri, setSortByPri] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const togglePriority = (p: Priority) =>
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const toggleCategory = (c: Category) =>
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  let displayed = filterByPriority(tasks, selectedPriorities);
  displayed = filterByCategory(displayed, selectedCategories);
  if (sortByPri) displayed = sortByPriority(displayed);

  const handleDelete = async (scope: RecurrenceScope) => {
    if (deleteTarget) {
      await deleteTask(deleteTarget, scope);
      setDeleteTarget(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Priority filters */}
        <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {PRIORITIES.map((p) => (
            <IonChip
              key={p}
              color={selectedPriorities.includes(p) ? 'primary' : 'medium'}
              onClick={() => togglePriority(p)}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: priorityToColor(p), marginRight: 4 }} />
              {p}
            </IonChip>
          ))}
          <IonChip
            color={sortByPri ? 'primary' : 'medium'}
            onClick={() => setSortByPri((v) => !v)}
          >
            Sort by priority
          </IonChip>
        </div>

        {/* Category filters */}
        <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CATEGORIES.map((c) => (
            <IonChip
              key={c}
              color={selectedCategories.includes(c) ? 'secondary' : 'medium'}
              onClick={() => toggleCategory(c)}
            >
              {c}
            </IonChip>
          ))}
        </div>

        <IonList>
          {displayed.map((task) => (
            <IonItemSliding key={task.id}>
              <IonItem button onClick={() => history.push(`/task-detail/${task.id}`)}>
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
                  <p>
                    {task.category} ·{' '}
                    {new Date(task.scheduledAt).toLocaleString([], {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </IonLabel>
                {task.isCompleted && <IonBadge color="success" slot="end">Done</IonBadge>}
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="danger" onClick={() => setDeleteTarget(task.id)}>
                  Delete
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/task-detail/new')}>
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
