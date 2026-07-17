import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type AccentColor = 'indigo' | 'emerald' | 'sky' | 'rose' | 'amber';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [accentColor, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem('accentColor') as AccentColor) || 'indigo';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Define accent mappings for CSS custom properties
    const accents: Record<AccentColor, { hex: string; glow: string }> = {
      indigo: { hex: '79, 70, 229', glow: 'rgba(79, 70, 229, 0.15)' },
      emerald: { hex: '16, 185, 129', glow: 'rgba(16, 185, 129, 0.15)' },
      sky: { hex: '14, 165, 233', glow: 'rgba(14, 165, 233, 0.15)' },
      rose: { hex: '244, 63, 94', glow: 'rgba(244, 63, 94, 0.15)' },
      amber: { hex: '245, 158, 11', glow: 'rgba(245, 158, 11, 0.15)' },
    };

    const selected = accents[accentColor];
    root.style.setProperty('--accent-color', selected.hex);
    root.style.setProperty('--accent-glow', selected.glow);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentState(color);
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, toggleTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
