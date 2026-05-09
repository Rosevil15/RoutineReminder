import React, { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner, IonIcon,
} from '@ionic/react';
import { mailOutline, lockClosedOutline, arrowBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const RegisterPage: React.FC = () => {
  const history = useHistory();
  const { register } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const labelColor = isDark ? '#cbd5e1' : '#374151';
  const inputBg = isDark ? '#0f172a' : '#f3f4f6';
  const inputColor = isDark ? '#f1f5f9' : '#111827';
  const iconColor = isDark ? '#64748b' : '#9ca3af';
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
      <IonContent fullscreen>
        <div style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '32px 24px',
          background: 'linear-gradient(160deg, #6366f1 0%, #8b5cf6 100%)',
        }}>
          <button
            onClick={() => history.goBack()}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: 24,
            }}
          >
            <IonIcon icon={arrowBackOutline} style={{ color: '#fff', fontSize: 20 }} />
          </button>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 700 }}>Create account</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '6px 0 0', fontSize: 15 }}>
              Start managing your day
            </p>
          </div>

          <div style={{
            background: cardBg, borderRadius: 20,
            padding: '28px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: labelColor, display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: inputBg, borderRadius: 12, padding: '4px 14px',
              }}>
                <IonIcon icon={mailOutline} style={{ color: iconColor, fontSize: 18 }} />
                <IonInput
                  type="email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value ?? '')}
                  placeholder="you@example.com"
                  style={{ '--padding-start': '0', '--padding-end': '0', fontSize: 15, '--color': inputColor, '--placeholder-color': iconColor }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: labelColor, display: 'block', marginBottom: 6 }}>
                Password <span style={{ color: iconColor, fontWeight: 400 }}>(min 8 characters)</span>
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: inputBg, borderRadius: 12, padding: '4px 14px',
              }}>
                <IonIcon icon={lockClosedOutline} style={{ color: iconColor, fontSize: 18 }} />
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value ?? '')}
                  placeholder="••••••••"
                  style={{ '--padding-start': '0', '--padding-end': '0', fontSize: 15, '--color': inputColor, '--placeholder-color': iconColor }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              }}>
                <IonText color="danger" style={{ fontSize: 13 }}>{error}</IonText>
              </div>
            )}

            <IonButton
              expand="block"
              onClick={handleRegister}
              disabled={loading}
              style={{ '--background': '#6366f1', '--border-radius': '12px', fontWeight: 700 }}
            >
              {loading ? <IonSpinner name="crescent" /> : 'Create Account'}
            </IonButton>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', marginTop: 24, fontSize: 14 }}>
            Already have an account?{' '}
            <a
              onClick={() => history.push('/auth/login')}
              style={{ color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign in
            </a>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
