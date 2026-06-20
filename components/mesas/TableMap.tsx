'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { TableCard } from './TableCard';
import type { Tables } from '@/types/database.types';

interface MesaConOrden {
  id: number;
  numero: number;
  zona: string | null;
  capacidad: number;
  estado: Tables<'mesas'>['estado'];
  orden_activa_id: number | null;
  orden_created_at: string | null;
}

interface TableMapProps {
  initialMesas: MesaConOrden[];
}

function formatTiempo(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest > 0 ? `${hrs}h ${rest}m` : `${hrs}h`;
}

export function TableMap({ initialMesas }: TableMapProps) {
  const router = useRouter();
  const [mesas, setMesas] = useState<MesaConOrden[]>(initialMesas);
  const [, setNow] = useState(() => Date.now());

  const handleClick = useCallback((mesa: MesaConOrden) => {
    if (mesa.estado === 'disponible') {
      router.push(`/mesero/mesas/${mesa.id}/nueva`);
    } else if (mesa.orden_activa_id) {
      router.push(`/mesero/mesas/${mesa.id}`);
    }
  }, [router]);

  useEffect(() => {
    const supabase = createClientSupabaseClient();
    const ESTADOS_ACTIVOS = ['pendiente', 'en_preparacion', 'listo', 'entregado'];

    const channel = supabase
      .channel('mesas-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'mesas',
      }, (payload) => {
        const updated = payload.new as { id: number; estado: string };
        setMesas(prev => prev.map(m =>
          m.id === updated.id
            ? { ...m, estado: updated.estado as Tables<'mesas'>['estado'] }
            : m
        ));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ordenes',
      }, (payload) => {
        const orden = payload.new as { mesa_id: number; id: number; created_at: string; estado: string };
        if (ESTADOS_ACTIVOS.includes(orden.estado)) {
          setMesas(prev => prev.map(m =>
            m.id === orden.mesa_id
              ? { ...m, estado: 'ocupada' as Tables<'mesas'>['estado'], orden_activa_id: orden.id, orden_created_at: orden.created_at }
              : m
          ));
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ordenes',
        filter: 'estado=eq.cerrado',
      }, (payload) => {
        const orden = payload.new as { mesa_id: number };
        setMesas(prev => prev.map(m =>
          m.id === orden.mesa_id
            ? { ...m, estado: 'disponible' as Tables<'mesas'>['estado'], orden_activa_id: null, orden_created_at: null }
            : m
        ));
      })
      .subscribe();

    const interval = setInterval(() => setNow(Date.now()), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const zonas = [...new Set(mesas.map(m => m.zona ?? 'sin_zona'))].sort();

  if (mesas.length === 0) {
    return (
      <p className="py-16 text-center text-muted">No hay mesas registradas</p>
    );
  }

  return (
    <div className="space-y-8">
      {zonas.map(zona => {
        const mesasZona = mesas.filter(m => (m.zona ?? 'sin_zona') === zona);
        return (
          <section key={zona}>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 px-1">
              {zona === 'sin_zona' ? 'General' : zona.replace('_', ' ')}
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {mesasZona.map(mesa => (
                <TableCard
                  key={mesa.id}
                  id={mesa.id}
                  numero={mesa.numero}
                  zona={mesa.zona}
                  capacidad={mesa.capacidad}
                  estado={mesa.estado as Tables<'mesas'>['estado']}
                  tiempoOcupada={mesa.estado === 'ocupada' ? formatTiempo(mesa.orden_created_at) : null}
                  ordenActivaId={mesa.orden_activa_id}
                  onClick={() => handleClick(mesa)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
