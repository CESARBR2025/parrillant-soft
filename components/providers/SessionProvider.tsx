'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import type { Perfil, Rol } from '@/types/roles';

interface SessionContextValue {
  user: User | null;
  perfil: Perfil | null;
  rol: Rol | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  perfil: null,
  rol: null,
  isLoading: true,
  refresh: async () => { },
});

export function useSession() {
  return useContext(SessionContext);
}

interface SessionProviderProps {
  initialUser: User;
  initialPerfil: Perfil;
  children: ReactNode;
}

export function SessionProvider({ initialUser, initialPerfil, children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [perfil, setPerfil] = useState<Perfil | null>(initialPerfil);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClientSupabaseClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setUser(null);
      setPerfil(null);
      setIsLoading(false);
      return;
    }
    const { data: currentPerfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    setUser(currentUser);
    setPerfil(currentPerfil as Perfil | null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClientSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const rol = (perfil?.rol as Rol) ?? null;

  return (
    <SessionContext.Provider value={{ user, perfil, rol, isLoading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}
