import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonDatetime, IonButton, IonText, IonActionSheet, IonCheckbox,
  IonBackButton, IonButtons, IonSpinner,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import type { Priority, Category, RecurrenceType, LeadTime, RecurrenceScope } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const isNew = id === 'new';
  const { tasks, createTask, updateTask, deleteTask, markComplete } = useTasks();

  const existing = isNew ? null : tasks.find((t) => t.id === id) ?? null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(existing?.scheduledAt ?? new Date().toISOString());
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [category, setCategory] = useState<Category>(existing?.category ?? 'personal');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(existing?.recurrenceType ?? 'none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(existing?.recurrenceDays ?? []);
  const [leadTime, setLeadTime] = useState<LeadTime>(existing?.reminderLeadTime ?? 15);
  const [titleError, setTitleError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showScopeSheet, setShowScopeSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setScheduledAt(existing.scheduledAt);
      setPriority(existing.priority);
      setCategory(existing.category);
      setRecurrenceType(existing.recurrenceType);
      setRecurrenceDays(existing.recurrenceDays ?? []);
      setLeadTime(existing.reminderLeadTime);
    }
  }, [existing?.id]);

  const validate = () => {
    if (!title.trim()) {
      setTitleError('Title is required.');
      return false;
    }
    setTitleError('');
    return true;
  };

  const doSave = async (scope: RecurrenceScope = 'this') => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isNew) {
        await createTask({ title, scheduledAt, priority, category, recurrenceType, recurrenceDays, reminderLeadTime: leadTime });
      } else {
        await updateTask(id, { title, scheduledAt, priority, category, recurrenceType, recurrenceDays, reminderLeadTime: leadTime }, scope);
      }
      history.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!validate()) return;
    if (!isNew && existing?.recurrenceType !== 'none') {
      setShowScopeSheet(true);
    } else {
      doSave('this');
    }
  };

  const handleDelete = async (scope: RecurrenceScope) => {
    await deleteTask(id, scope);
    history.goBack();
  };

  const toggleDay = (day: number) =>
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/tabs/tasks" />
          </IonButtons>
          <IonTitle>{isNew ? 'New Task' : 'Edit Task'}</IonTitle>
          {!isNew && (
            <IonButtons slot="end">
              <IonButton color="danger" onClick={() => setShowDeleteSheet(true)}>Delete</IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Title *</IonLabel>
          <IonInput value={title} onIonChange={(e) => setTitle(e.detail.value ?? '')} placeholder="Task title" />
        </IonItem>
        {titleError && <IonText color="danger"><p style={{ padding: '0 16px' }}>{titleError}</p></IonText>}

        <IonItem>
          <IonLabel position="stacked">Date &amp; Time</IonLabel>
          <IonDatetime
            value={scheduledAt}
            onIonChange={(e) => setScheduledAt(e.detail.value as string)}
            presentation="date-time"
          />
        </IonItem>

        <IonItem>
          <IonLabel>Priority</IonLabel>
          <IonSelect value={priority} onIonChange={(e) => setPriority(e.detail.value)}>
            <IonSelectOption value="high">High</IonSelectOption>
            <IonSelectOption value="medium">Medium</IonSelectOption>
            <IonSelectOption value="low">Low</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Category</IonLabel>
          <IonSelect value={category} onIonChange={(e) => setCategory(e.detail.value)}>
            <IonSelectOption value="school">School</IonSelectOption>
            <IonSelectOption value="work">Work</IonSelectOption>
            <IonSelectOption value="personal">Personal</IonSelectOption>
            <IonSelectOption value="health">Health</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Recurrence</IonLabel>
          <IonSelect value={recurrenceType} onIonChange={(e) => setRecurrenceType(e.detail.value)}>
            <IonSelectOption value="none">None</IonSelectOption>
            <IonSelectOption value="daily">Daily</IonSelectOption>
            <IonSelectOption value="weekly">Weekly</IonSelectOption>
            <IonSelectOption value="monthly">Monthly</IonSelectOption>
            <IonSelectOption value="selected_days">Selected Days</IonSelectOption>
          </IonSelect>
        </IonItem>

        {recurrenceType === 'selected_days' && (
          <div style={{ padding: '8px 16px' }}>
            <IonText><p>Repeat on:</p></IonText>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map((day, i) => (
                <IonItem key={i} lines="none" style={{ '--padding-start': 0 }}>
                  <IonCheckbox
                    checked={recurrenceDays.includes(i)}
                    onIonChange={() => toggleDay(i)}
                  />
                  <IonLabel style={{ marginLeft: 4 }}>{day}</IonLabel>
                </IonItem>
              ))}
            </div>
          </div>
        )}

        <IonItem>
          <IonLabel>Reminder</IonLabel>
          <IonSelect value={leadTime} onIonChange={(e) => setLeadTime(e.detail.value)}>
            {([5, 10, 15, 30, 60] as LeadTime[]).map((t) => (
              <IonSelectOption key={t} value={t}>{t} min before</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {!isNew && existing && (
          <IonButton
            expand="block"
            fill="outline"
            color={existing.isCompleted ? 'medium' : 'success'}
            onClick={() => markComplete(id, !existing.isCompleted)}
            style={{ marginTop: 16 }}
          >
            {existing.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
          </IonButton>
        )}

        <IonButton expand="block" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? <IonSpinner name="crescent" /> : 'Save'}
        </IonButton>

        {/* Recurrence scope sheet for edits */}
        <IonActionSheet
          isOpen={showScopeSheet}
          onDidDismiss={() => setShowScopeSheet(false)}
          header="Edit recurring task"
          buttons={[
            { text: 'This task only', handler: () => doSave('this') },
            { text: 'This and future tasks', handler: () => doSave('future') },
            { text: 'All tasks in series', handler: () => doSave('all') },
            { text: 'Cancel', role: 'cancel' },
          ]}
        />

        {/* Delete scope sheet */}
        <IonActionSheet
          isOpen={showDeleteSheet}
          onDidDismiss={() => setShowDeleteSheet(false)}
          header="Delete task"
          buttons={[
            { text: 'This task only', role: 'destructive', handler: () => handleDelete('this') },
            { text: 'This and future tasks', role: 'destructive', handler: () => handleDelete('future') },
            { text: 'All tasks in series', role: 'destructive', handler: () => handleDelete('all') },
            { text: 'Cancel', role: 'cancel' },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TaskDetailPage;
