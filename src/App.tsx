import React from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <div style={{ padding: '20px' }}>
        <h1>TaskReminder App</h1>
        <p>Loading...</p>
      </div>
    </IonApp>
  );
};

export default App;
