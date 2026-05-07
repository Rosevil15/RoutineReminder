import React, { useState, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon,
  IonList, IonItem, IonText, IonBadge,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useRoutines } from '../hooks/useRoutines';
import { priorityToColor } from '../utils/taskFilters';

type ViewMode = 'monthly' | 'weekly';

const CalendarPage: React.FC = () => {
  const history = useHistory();
  const { tasks } = useTasks();
  const { routines } = useRoutines();
  const [view, setView] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map of date → tasks for fast lookup
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      const d = new Date(t.scheduledAt).toLocaleDateString('en-CA');
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [tasks]);

  // Monthly grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : [];

  // Weekly view: 7 days starting from Monday of current week
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Calendar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSegment value={view} onIonChange={(e) => setView(e.detail.value as ViewMode)}>
          <IonSegmentButton value="monthly"><IonLabel>Monthly</IonLabel></IonSegmentButton>
          <IonSegmentButton value="weekly"><IonLabel>Weekly</IonLabel></IonSegmentButton>
        </IonSegment>

        {view === 'monthly' && (
          <>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
              <IonButton fill="clear" onClick={prevMonth}><IonIcon icon={chevronBackOutline} /></IonButton>
              <IonText><strong>{monthName}</strong></IonText>
              <IonButton fill="clear" onClick={nextMonth}><IonIcon icon={chevronForwardOutline} /></IonButton>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', padding: '0 8px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px' }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = tasksByDate[dateStr] ?? [];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toLocaleDateString('en-CA');

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    style={{
                      padding: '6px 2px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 8,
                      backgroundColor: isSelected ? 'var(--ion-color-primary)' : isToday ? 'var(--ion-color-light)' : 'transparent',
                      color: isSelected ? 'white' : 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 14 }}>{day}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: priorityToColor(t.priority) }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected date items */}
            {selectedDate && (
              <>
                <IonText style={{ padding: '8px 16px 0' }}>
                  <h4>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                </IonText>
                {selectedTasks.length === 0 ? (
                  <IonText color="medium" style={{ padding: '0 16px' }}><p>No tasks on this day.</p></IonText>
                ) : (
                  <IonList>
                    {selectedTasks.map((t) => (
                      <IonItem key={t.id} button onClick={() => history.push(`/task-detail/${t.id}`)}>
                        <div slot="start" style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: priorityToColor(t.priority) }} />
                        <IonLabel>
                          <h2>{t.title}</h2>
                          <p>{new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </IonLabel>
                        <IonBadge color="medium" slot="end">{t.category}</IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </>
            )}
          </>
        )}

        {view === 'weekly' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
              <IonButton fill="clear" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}>
                <IonIcon icon={chevronBackOutline} />
              </IonButton>
              <IonText><strong>Week of {weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</strong></IonText>
              <IonButton fill="clear" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}>
                <IonIcon icon={chevronForwardOutline} />
              </IonButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 4px', gap: 4 }}>
              {weekDays.map((day) => {
                const dateStr = day.toLocaleDateString('en-CA');
                const dayTasks = tasksByDate[dateStr] ?? [];
                const isToday = dateStr === new Date().toLocaleDateString('en-CA');
                return (
                  <div key={dateStr} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>
                      {day.toLocaleDateString('default', { weekday: 'short' })}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? 'var(--ion-color-primary)' : 'inherit',
                    }}>
                      {day.getDate()}
                    </div>
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => history.push(`/task-detail/${t.id}`)}
                        style={{
                          fontSize: 10, padding: '2px 4px', marginTop: 2, borderRadius: 4,
                          backgroundColor: priorityToColor(t.priority), color: 'white',
                          cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CalendarPage;
