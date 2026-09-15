import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    // System default
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    localStorage.setItem('theme', themePreference);
    if (themePreference === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemDark);
    }
  }, [themePreference]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => setDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const setTheme = (theme) => {
    setThemePreference(theme);
    if (theme === 'light') {
      setDarkMode(false);
    } else if (theme === 'dark') {
      setDarkMode(true);
    } else {
      // System
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemDark);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
