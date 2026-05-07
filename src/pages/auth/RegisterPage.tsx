import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner,
  IonBackButton, IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RegisterPage: React.FC = () => {
  const history = useHistory();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      history.replace('/app/tabs/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/auth/login" />
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value ?? '')}
            placeholder="you@example.com"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Password (min 8 characters)</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value ?? '')}
            placeholder="••••••••"
          />
        </IonItem>

        {error && (
          <IonText color="danger">
            <p style={{ padding: '0 16px' }}>{error}</p>
          </IonText>
        )}

        <IonButton expand="block" onClick={handleRegister} disabled={loading} style={{ marginTop: 16 }}>
          {loading ? <IonSpinner name="crescent" /> : 'Create Account'}
        </IonButton>

        <IonButton expand="block" fill="clear" routerLink="/auth/login">
          Already have an account? Sign in
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
