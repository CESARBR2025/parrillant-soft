'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface HeaderActionsContextType {
  headerCenter: ReactNode;
  setHeaderCenter: (node: ReactNode) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType>({
  headerCenter: null,
  setHeaderCenter: () => {},
});

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [headerCenter, setHeaderCenter] = useState<ReactNode>(null);

  return (
    <HeaderActionsContext.Provider value={{ headerCenter, setHeaderCenter }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}
