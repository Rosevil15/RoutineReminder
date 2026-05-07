import React from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonCheckbox, IonFab, IonFabButton,
  IonIcon, IonText,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useRoutines } from '../hooks/useRoutines';
import { groupByTimeBlock } from '../utils/routineUtils';

const RoutinePlannerPage: React.FC = () => {
  const history = useHistory();
  const { routines, markHabitComplete } = useRoutines();
  const grouped = groupByTimeBlock(routines);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Routines</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {(['morning', 'afternoon', 'evening'] as const).map((block) => {
          const blockRoutines = grouped[block];
          if (blockRoutines.length === 0) return null;
          return (
            <div key={block}>
              <IonText style={{ padding: '8px 16px 0' }}>
                <h4 style={{ textTransform: 'capitalize', margin: 0 }}>{block}</h4>
              </IonText>
              <IonList>
                {blockRoutines.map((routine) => (
                  <div key={routine.id}>
                    <IonItem button onClick={() => history.push(`/routine-detail/${routine.id}`)}>
                      <IonLabel>
                        <h2>{routine.name}</h2>
                        <p>{routine.recurrenceType}</p>
                      </IonLabel>
                    </IonItem>
                    {(routine.habits ?? []).map((habit) => (
                      <IonItem key={habit.id} style={{ '--padding-start': '32px' }}>
                        <IonCheckbox
                          slot="start"
                          checked={habit.isCompleted}
                          onIonChange={(e) => markHabitComplete(habit.id, e.detail.checked)}
                        />
                        <IonLabel style={{ textDecoration: habit.isCompleted ? 'line-through' : 'none' }}>
                          {habit.name}
                        </IonLabel>
                      </IonItem>
                    ))}
                  </div>
                ))}
              </IonList>
            </div>
          );
        })}

        {routines.length === 0 && (
          <IonText color="medium" style={{ padding: '16px' }}>
            <p>No routines yet. Tap + to create one.</p>
          </IonText>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/routine-detail/new')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default RoutinePlannerPage;
