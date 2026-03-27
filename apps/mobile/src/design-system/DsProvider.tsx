import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { createDs, type DS } from './tokens/ds';
import { type ThemeName, isDarkTheme } from './tokens/themes';

interface DsContextValue {
  ds: DS;
  themeName: ThemeName;
  isDark: boolean;
  setTheme: (name: ThemeName) => void;
}

const defaultDs = createDs('dark');
const DsContext = createContext<DsContextValue>({
  ds: defaultDs,
  themeName: 'dark',
  isDark: true,
  setTheme: () => {},
});

export function DsProvider({
  children,
  forcedTheme,
}: {
  children: React.ReactNode;
  forcedTheme?: ThemeName;
}): React.ReactElement {
  const systemScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>(
    forcedTheme || (systemScheme === 'light' ? 'light' : 'dark'),
  );

  useEffect(() => {
    if (forcedTheme) {
      setThemeName(forcedTheme);
    }
  }, [forcedTheme]);

  const isDark = useMemo(() => isDarkTheme(themeName), [themeName]);

  const value = useMemo(
    () => ({
      ds: createDs(themeName),
      themeName,
      isDark,
      setTheme: setThemeName,
    }),
    [themeName, isDark],
  );

  return <DsContext.Provider value={value}>{children}</DsContext.Provider>;
}

export function useDs(): DS {
  return useContext(DsContext).ds;
}

export function useDsName(): ThemeName {
  return useContext(DsContext).themeName;
}

export function useDsIsDark(): boolean {
  return useContext(DsContext).isDark;
}

export function useDsSetTheme(): (name: ThemeName) => void {
  return useContext(DsContext).setTheme;
}
