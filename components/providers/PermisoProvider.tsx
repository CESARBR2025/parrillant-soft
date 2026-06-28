'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface PermisoContextValue {
  permisos: Set<string>;
  isLoading: boolean;
  can: (codigo: string) => boolean;
}

const PermisoContext = createContext<PermisoContextValue>({
  permisos: new Set(),
  isLoading: true,
  can: () => false,
});

export function usePermisoContext() {
  return useContext(PermisoContext);
}

export function PermisoProvider({ children }: { children: ReactNode }) {
  const [permisos, setPermisos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPermisos(new Set());
        setIsLoading(false);
        return;
      }
      const { data } = await (supabase as any).rpc('mis_permisos');
      setPermisos(new Set<string>(data as string[] ?? []));
      setIsLoading(false);
    };
    load();
  }, []);

  const can = useCallback((codigo: string): boolean => {
    return permisos.has(codigo);
  }, [permisos]);

  return (
    <PermisoContext.Provider value={{ permisos, isLoading, can }}>
      {children}
    </PermisoContext.Provider>
  );
}
