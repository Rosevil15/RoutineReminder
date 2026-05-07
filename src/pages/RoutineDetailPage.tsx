import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonText, IonCheckbox, IonIcon, IonList,
  IonBackButton, IonButtons, IonSpinner,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useRoutines } from '../hooks/useRoutines';
import type { TimeBlock, RecurrenceType, LeadTime } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RoutineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const isNew = id === 'new';
  const { routines, createRoutine, updateRoutine, deleteRoutine, addHabit } = useRoutines();

  const existing = isNew ? null : routines.find((r) => r.id === id) ?? null;

  const [name, setName] = useState(existing?.name ?? '');
  const [timeBlock, setTimeBlock] = useState<TimeBlock>(existing?.timeBlock ?? 'morning');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(existing?.recurrenceType ?? 'daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(existing?.recurrenceDays ?? []);
  const [leadTime, setLeadTime] = useState<LeadTime>(existing?.reminderLeadTime ?? 15);
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setTimeBlock(existing.timeBlock);
      setRecurrenceType(existing.recurrenceType);
      setRecurrenceDays(existing.recurrenceDays ?? []);
      setLeadTime(existing.reminderLeadTime);
    }
  }, [existing?.id]);

  const validate = () => {
    if (!name.trim()) { setNameError('Name is required.'); return false; }
    setNameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isNew) {
        await createRoutine({ name, timeBlock, recurrenceType, recurrenceDays, reminderLeadTime: leadTime });
      } else {
        await updateRoutine(id, { name, timeBlock, recurrenceType, recurrenceDays, reminderLeadTime: leadTime });
      }
      history.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim() || !existing) return;
    await addHabit(existing.id, { name: newHabitName, routineId: existing.id });
    setNewHabitName('');
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
            <IonBackButton defaultHref="/app/tabs/routines" />
          </IonButtons>
          <IonTitle>{isNew ? 'New Routine' : 'Edit Routine'}</IonTitle>
          {!isNew && (
            <IonButtons slot="end">
              <IonButton color="danger" onClick={async () => { await deleteRoutine(id); history.goBack(); }}>
                Delete
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Name *</IonLabel>
          <IonInput value={name} onIonChange={(e) => setName(e.detail.value ?? '')} placeholder="Routine name" />
        </IonItem>
        {nameError && <IonText color="danger"><p style={{ padding: '0 16px' }}>{nameError}</p></IonText>}

        <IonItem>
          <IonLabel>Time Block</IonLabel>
          <IonSelect value={timeBlock} onIonChange={(e) => setTimeBlock(e.detail.value)}>
            <IonSelectOption value="morning">Morning</IonSelectOption>
            <IonSelectOption value="afternoon">Afternoon</IonSelectOption>
            <IonSelectOption value="evening">Evening</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Recurrence</IonLabel>
          <IonSelect value={recurrenceType} onIonChange={(e) => setRecurrenceType(e.detail.value)}>
            <IonSelectOption value="daily">Daily</IonSelectOption>
            <IonSelectOption value="weekly">Weekly</IonSelectOption>
            <IonSelectOption value="selected_days">Selected Days</IonSelectOption>
          </IonSelect>
        </IonItem>

        {recurrenceType === 'selected_days' && (
          <div style={{ padding: '8px 16px' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map((day, i) => (
                <IonItem key={i} lines="none" style={{ '--padding-start': 0 }}>
                  <IonCheckbox checked={recurrenceDays.includes(i)} onIonChange={() => toggleDay(i)} />
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

        <IonButton expand="block" onClick={handleSave} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? <IonSpinner name="crescent" /> : 'Save'}
        </IonButton>

        {/* Habits section (only for existing routines) */}
        {!isNew && existing && (
          <>
            <IonText style={{ padding: '16px 0 0' }}><h4>Habits</h4></IonText>
            <IonList>
              {(existing.habits ?? []).map((habit) => (
                <IonItem key={habit.id}>
                  <IonLabel>{habit.name}</IonLabel>
                  <IonIcon icon={trashOutline} slot="end" color="danger" />
                </IonItem>
              ))}
            </IonList>
            <IonItem>
              <IonInput
                value={newHabitName}
                onIonChange={(e) => setNewHabitName(e.detail.value ?? '')}
                placeholder="Add a habit..."
              />
              <IonButton slot="end" fill="clear" onClick={handleAddHabit}>Add</IonButton>
            </IonItem>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RoutineDetailPage;
