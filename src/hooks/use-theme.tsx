
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HSLToHex, hexToHSL } from '@/lib/color-utils';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  hue: number;
  setHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'paperminer_theme';

const HUES: Record<string, number> = {
  default: 262,
  zinc: 240,
  rose: 347,
  blue: 221,
  green: 142,
  orange: 25,
};

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState('default');
  const [hue, setHueState] = useState(HUES.default);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme) {
        const { theme: savedTheme, hue: savedHue } = JSON.parse(storedTheme);
        setThemeState(savedTheme || 'default');
        setHueState(savedHue || HUES.default);
      }
    } catch (error) {
      console.error("Could not load theme from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const applyTheme = useCallback((currentHue: number) => {
    document.documentElement.style.setProperty('--primary-hue', currentHue.toString());
    const primaryLight = `hsl(${currentHue}, 83.3%, 57.8%)`;
    const primaryDark = `hsl(${currentHue}, 95.2%, 58.4%)`;
    document.documentElement.style.setProperty('--primary-light', primaryLight);
    document.documentElement.style.setProperty('--primary-dark', primaryDark);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      applyTheme(hue);
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ theme, hue }));
    }
  }, [theme, hue, isLoaded, applyTheme]);

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme);
    if (HUES[newTheme]) {
      setHueState(HUES[newTheme]);
    }
  }, []);

  const setHue = useCallback((newHue: number) => {
    setThemeState('custom');
    setHueState(newHue);
  }, []);

  if (!isLoaded) {
    return null;
  }

  const value = { theme, setTheme, hue, setHue };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a CustomThemeProvider');
  }
  return context;
}
