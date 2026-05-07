import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppUser } from '../types';

// ---- State ----
interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

// ---- Actions ----
type AuthAction =
  | { type: 'SET_USER'; payload: AppUser | null }
  | { type: 'SET_LOADING'; payload: boolean };

// ---- Reducer ----
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ---- Context ----
interface AuthContextValue {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---- Provider ----
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
