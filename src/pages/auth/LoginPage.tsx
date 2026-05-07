import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const history = useHistory();
  const { login, loginWithBiometrics } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      history.replace('/app/tabs/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setError('');
    try {
      await loginWithBiometrics();
      history.replace('/app/tabs/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Biometric login failed');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign In</IonTitle>
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
          <IonLabel position="stacked">Password</IonLabel>
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

        <IonButton expand="block" onClick={handleLogin} disabled={loading} style={{ marginTop: 16 }}>
          {loading ? <IonSpinner name="crescent" /> : 'Sign In'}
        </IonButton>

        <IonButton expand="block" fill="outline" onClick={handleBiometric} style={{ marginTop: 8 }}>
          Sign In with Biometrics
        </IonButton>

        <IonButton expand="block" fill="clear" routerLink="/auth/register">
          Create an account
        </IonButton>
        <IonButton expand="block" fill="clear" routerLink="/auth/forgot-password">
          Forgot password?
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
