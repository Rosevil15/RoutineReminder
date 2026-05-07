import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { supabase } from '../lib/supabaseClient';
import { validateEmail, validatePassword } from '../utils/validators';
import {
  localClear,
  SESSION_TOKEN_KEY,
} from '../utils/localStore';
import type { AppUser } from '../types';

interface AuthHook {
  user: AppUser | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * useAuth — manages authentication state and operations.
 * Wraps Supabase Auth with local validation and biometric support.
 */
export function useAuth(): AuthHook {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      }
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format. Please enter a valid email address.');
    }
    if (!validatePassword(password)) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Store session token for biometric re-auth
    if (data.session?.access_token) {
      await Preferences.set({
        key: SESSION_TOKEN_KEY,
        value: data.session.access_token,
      });
    }
  }, []);

  const loginWithBiometrics = useCallback(async (): Promise<void> => {
    // Authenticate with biometrics
    await BiometricAuth.authenticate({
      reason: 'Authenticate to access your tasks',
      cancelTitle: 'Cancel',
    });

    // Retrieve stored session token
    const { value: token } = await Preferences.get({ key: SESSION_TOKEN_KEY });
    if (!token) {
      throw new Error('No stored session. Please log in with your password first.');
    }

    // Restore Supabase session using the stored token
    const { error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token, // Supabase will refresh automatically
    });
    if (error) throw new Error('Session expired. Please log in with your password.');
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    // Clear all local user data
    await localClear();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }, []);

  return { user, loading, register, login, loginWithBiometrics, logout, resetPassword };
}
