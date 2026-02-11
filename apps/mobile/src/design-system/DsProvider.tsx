import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { createDs, ds as darkDs, type DS } from './tokens/ds';

interface DsContextValue {
  ds: DS;
  isDark: boolean;
}

const DsContext = createContext<DsContextValue>({ ds: darkDs, isDark: true });

export function DsProvider({
  children,
  forcedColorScheme,
}: {
  children: React.ReactNode;
  forcedColorScheme?: 'light' | 'dark';
}): React.ReactElement {
  const systemScheme = useColorScheme();
  const isDark = forcedColorScheme ? forcedColorScheme === 'dark' : systemScheme !== 'light';

  const value = useMemo(
    () => ({
      ds: createDs(isDark),
      isDark,
    }),
    [isDark],
  );

  return <DsContext.Provider value={value}>{children}</DsContext.Provider>;
}

export function useDs(): DS {
  return useContext(DsContext).ds;
}

export function useDsIsDark(): boolean {
  return useContext(DsContext).isDark;
}
