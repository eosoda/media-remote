
"use client";

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');

  const applyTheme = useCallback((selectedTheme: Theme) => {
    let newEffectiveTheme: EffectiveTheme;
    if (selectedTheme === 'system') {
      newEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newEffectiveTheme = selectedTheme;
    }

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newEffectiveTheme);
    setEffectiveTheme(newEffectiveTheme);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = storedTheme || 'system';
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  // Listen for system theme changes if theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system'); // Re-apply to get the new system theme
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme, effectiveTheme };
}
