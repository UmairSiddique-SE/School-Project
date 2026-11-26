import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const isPublicRoute = (pathname: string) =>
  pathname === '/' ||
  pathname === '/portal' ||
  pathname === '/school-login' ||
  pathname.startsWith('/school-login/') ||
  pathname.startsWith('/register-school') ||
  pathname === '/admin' ||
  pathname === '/admin-login' ||
  pathname === '/admin/login' ||
  pathname === '/forgot-password' ||
  pathname === '/reset-password' ||
  pathname === '/login' ||
  pathname.startsWith('/school/') ||
  pathname.startsWith('/school-offline/') ||
  pathname.endsWith('/offline') ||
  /^\/[^/]+\/login$/.test(pathname);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    } catch (error) {
      console.warn('Could not read the saved SchoolOS theme preference.', error);
      return 'light';
    }
  });

  useEffect(() => {
    const activeTheme = isPublicRoute(pathname) ? 'light' : theme;
    const root = window.document.documentElement;
    root.classList.toggle('dark', activeTheme === 'dark');
    root.classList.toggle('light', activeTheme === 'light');
    root.style.colorScheme = activeTheme;

    if (!isPublicRoute(pathname)) {
      try {
        window.localStorage.setItem('theme', theme);
      } catch (error) {
        console.warn('Could not save the SchoolOS theme preference.', error);
      }
    }
  }, [pathname, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light') }}>
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
