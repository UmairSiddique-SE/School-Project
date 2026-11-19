import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('theme', 'light');
    } catch {
      // ignore storage errors
    }
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }, []);

  const setTheme = () => {
    // Only light theme is supported across SchoolOS
  };

  const toggleTheme = () => {
    // Only light theme is supported across SchoolOS
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
