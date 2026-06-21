'use client';

import { useEffect, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useSession';
import { useSound } from '@/hooks/useSound';

export function WaiterNotification() {
  const { rol } = useSession();
  const { play } = useSound('/sounds/iosbells.mp3');
  const notifiedRef = useRef<Set<number>>(new Set());
  const isInitialSeed = useRef(true);

  useEffect(() => {
    if (rol !== 'mesero') return;

    const supabase = createClientSupabaseClient();

    const channel = supabase
      .channel('waiter-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ordenes',
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
      const { data } = await supabase
        .from('ordenes')
        .select('id')
        .eq('estado', 'listo');

      if (!data) return;

      if (isInitialSeed.current) {
        data.forEach((o) => notifiedRef.current.add(o.id));
        isInitialSeed.current = false;
        return;
      }

      data.forEach((o) => {
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
  }, [rol, play]);

  return null;
}
