import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner,
  IonBackButton, IonButtons,
} from '@ionic/react';
import { useAuth } from '../../hooks/useAuth';

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email');
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
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {success ? (
          <IonText color="success">
            <p>Password reset email sent! Check your inbox.</p>
          </IonText>
        ) : (
          <>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value ?? '')}
                placeholder="you@example.com"
              />
            </IonItem>

            {error && (
              <IonText color="danger">
                <p style={{ padding: '0 16px' }}>{error}</p>
              </IonText>
            )}

            <IonButton expand="block" onClick={handleReset} disabled={loading} style={{ marginTop: 16 }}>
              {loading ? <IonSpinner name="crescent" /> : 'Send Reset Email'}
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ForgotPasswordPage;
