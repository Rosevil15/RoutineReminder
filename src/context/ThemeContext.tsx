import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Theme } from '../types';

// ---- State ----
interface ThemeState {
  theme: Theme;
}

// ---- Actions ----
type ThemeAction = { type: 'SET_THEME'; payload: Theme };

// ---- Reducer ----
function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return { theme: action.payload };
    default:
      return state;
  }
}

// ---- Context ----
interface ThemeContextValue {
  state: ThemeState;
  dispatch: React.Dispatch<ThemeAction>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---- Provider ----
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [state, dispatch] = useReducer(themeReducer, {
    theme: 'system',
  });

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---- Hook ----
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}
