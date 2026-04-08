import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './index';
import { useAppStore } from '@/stores/app-store';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const appTheme = useAppStore((s) => s.theme);

  const theme = useMemo(() => {
    if (appTheme === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return appTheme === 'dark' ? darkTheme : lightTheme;
  }, [appTheme, systemScheme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
