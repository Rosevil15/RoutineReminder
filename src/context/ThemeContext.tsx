import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import { applyTheme } from '../hooks/useTheme';
import type { Theme } from '../types';

const THEME_KEY = 'app_theme';

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

  // Load persisted theme on mount and apply it synchronously
  useEffect(() => {
    Preferences.get({ key: THEME_KEY }).then(({ value }) => {
      const saved = (value as Theme) || 'system';
      dispatch({ type: 'SET_THEME', payload: saved });
      applyTheme(saved);
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Re-read current theme from state ref and re-apply if system
      applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Re-apply theme whenever it changes
  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

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
