import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import type { Theme } from '../types';

const THEME_KEY = 'app_theme';

/**
 * Applies the theme synchronously by toggling document.body.classList.
 * Property 26: Theme application is synchronous.
 */
export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.body.classList.toggle('dark', useDark);
}

interface ThemeHook {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
}

/**
 * useTheme — manages the app color theme.
 * Reads persisted preference from @capacitor/preferences on mount.
 * Falls back to 'system' on first launch.
 * Property 25: Theme preference persists across reads.
 */
export function useTheme(): ThemeHook {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Load persisted theme on mount
    Preferences.get({ key: THEME_KEY }).then(({ value }) => {
      const saved = (value as Theme) || 'system';
      setThemeState(saved);
      applyTheme(saved);
    });

    // Listen for system theme changes when theme === 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      setThemeState((current) => {
        if (current === 'system') {
          applyTheme('system');
        }
        return current;
      });
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const setTheme = async (newTheme: Theme): Promise<void> => {
    await Preferences.set({ key: THEME_KEY, value: newTheme });
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme };
}
