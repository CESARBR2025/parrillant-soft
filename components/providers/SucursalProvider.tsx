'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Sucursal } from '@/types/roles';

const SucursalContext = createContext<Sucursal | null>(null);

export function useSucursal() {
  return useContext(SucursalContext);
}

export function SucursalProvider({
  sucursal,
  children,
}: {
  sucursal: Sucursal | null;
  children: ReactNode;
}) {
  return (
    <SucursalContext.Provider value={sucursal}>
      {children}
    </SucursalContext.Provider>
  );
}
