'use client';

import { useEffect, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useSession';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { useSound } from '@/hooks/useSound';

export function WaiterNotification() {
  const { rol } = useSession();
  const sucursal = useSucursal();
  const { play } = useSound('/sounds/iosbells.mp3');
  const notifiedRef = useRef<Set<number>>(new Set());
  const isInitialSeed = useRef(true);

  useEffect(() => {
    if (rol !== 'mesero' || !sucursal?.id) return;

    const supabase = createClientSupabaseClient();

    const channel = supabase
      .channel(`waiter-notifications-${sucursal.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ordenes',
        filter: `sucursal_id=eq.${sucursal.id}`,
      }, (payload) => {
        const orden = payload.new as { id: number; estado: string };
        if (orden.estado === 'listo') {
          if (!notifiedRef.current.has(orden.id)) {
            notifiedRef.current.add(orden.id);
            play();
          }
        } else {
          notifiedRef.current.delete(orden.id);
        }
      })
      .subscribe();

    const poll = async () => {
      const { data } = await (supabase as any)
        .from('ordenes')
        .select('id')
        .eq('estado', 'listo')
        .eq('sucursal_id', sucursal.id);

      if (!data) return;

      const ordenes = data as { id: number }[];
      if (isInitialSeed.current) {
        ordenes.forEach((o) => notifiedRef.current.add(o.id));
        isInitialSeed.current = false;
        return;
      }

      ordenes.forEach((o) => {
        if (!notifiedRef.current.has(o.id)) {
          notifiedRef.current.add(o.id);
          play();
        }
      });
    };

    poll();
    const pollInterval = setInterval(poll, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [rol, play, sucursal?.id]);

  return null;
}
