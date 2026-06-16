'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type OrdenRow = Database['public']['Tables']['ordenes']['Row'];
type DetalleRow = Database['public']['Tables']['detalles_orden']['Row'];

export interface KitchenItem {
  id: number;
  cantidad: number;
  notas: string | null;
  listo: boolean;
  tipo: string;
  producto_nombre: string;
}

export interface KitchenOrder {
  id: number;
  estado: 'pendiente' | 'en_preparacion' | 'listo';
  notas: string | null;
  created_at: string;
  updated_at: string | null;
  mesa_id: number;
  mesa_numero: number;
  items: KitchenItem[];
}

export interface KitchenOrdersGrouped {
  pendiente: KitchenOrder[];
  en_preparacion: KitchenOrder[];
  listo: KitchenOrder[];
}

export interface QueueItem extends KitchenOrder {
  elapsedMs: number;
}

const TIEMPO_LIMITE_MINUTOS = 15;

interface OrdenWithRelations extends OrdenRow {
  mesas: { numero: number } | null;
  detalles_orden: (DetalleRow & {
    productos_menu: { nombre: string } | null;
  })[];
}

export function useKitchenOrders(tipo: 'alimento' | 'bebida') {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(() => Date.now());
  const channelRef = useRef<ReturnType<ReturnType<typeof createClientSupabaseClient>['channel']> | null>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = createClientSupabaseClient();

    const { data } = await supabase
      .from('ordenes')
      .select(`
        id,
        estado,
        notas,
        created_at,
        updated_at,
        mesa_id,
        mesas (numero),
        detalles_orden (
          id,
          cantidad,
          notas,
          listo,
          tipo,
          productos_menu (nombre)
        )
      `)
      .in('estado', ['pendiente', 'en_preparacion', 'listo'])
      .order('created_at', { ascending: true });

    if (!data) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const typedData = data as unknown as OrdenWithRelations[];

    const transformed: KitchenOrder[] = typedData
      .map((o) => {
        const mesaNumero = o.mesas?.numero ?? 0;
        const items: KitchenItem[] = (o.detalles_orden ?? [])
          .filter((d) => d.tipo === tipo && !d.listo)
          .map((d) => ({
            id: d.id,
            cantidad: d.cantidad,
            notas: d.notas,
            listo: d.listo,
            tipo: d.tipo,
            producto_nombre: d.productos_menu?.nombre ?? 'Producto',
          }));

        return {
          id: o.id,
          estado: o.estado as KitchenOrder['estado'],
          notas: o.notas,
          created_at: o.created_at,
          updated_at: o.updated_at,
          mesa_id: o.mesa_id,
          mesa_numero: mesaNumero,
          items,
        };
      })
      .filter((o) => o.items.length > 0);

    setOrders(transformed);
    setLoading(false);
  }, [tipo]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await fetchOrders();
      if (!mounted) return;

      const supabase = createClientSupabaseClient();
      const channelName = `kitchen-${tipo}-${Math.random().toString(36).slice(2, 9)}`;

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ordenes',
        }, () => { if (mounted) fetchOrders(); })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes',
        }, () => { if (mounted) fetchOrders(); })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'detalles_orden',
        }, () => { if (mounted) fetchOrders(); })
        .subscribe();

      channelRef.current = channel;

      const interval = setInterval(() => {
        if (mounted) setNow(Date.now());
      }, 1000);

      return { channel, supabase, interval };
    }

    const cleanup = { channel: null as ReturnType<ReturnType<typeof createClientSupabaseClient>['channel']> | null, supabase: null as ReturnType<typeof createClientSupabaseClient> | null, interval: null as ReturnType<typeof setInterval> | null };

    init().then((c) => { if (c) { cleanup.channel = c.channel; cleanup.supabase = c.supabase; cleanup.interval = c.interval; } });

    return () => {
      mounted = false;
      if (cleanup.supabase && cleanup.channel) {
        cleanup.supabase.removeChannel(cleanup.channel);
      }
      if (cleanup.interval) {
        clearInterval(cleanup.interval);
      }
    };
  }, [fetchOrders, tipo]);

  const grouped: KitchenOrdersGrouped = {
    pendiente: orders.filter((o) => o.estado === 'pendiente'),
    en_preparacion: orders.filter((o) => o.estado === 'en_preparacion'),
    listo: orders.filter((o) => {
      if (o.estado !== 'listo') return false;
      const elapsed = now - new Date(o.created_at).getTime();
      return elapsed < 120000;
    }),
  };

  function excedeTiempoLimite(order: KitchenOrder): boolean {
    const elapsed = now - new Date(order.created_at).getTime();
    return elapsed > TIEMPO_LIMITE_MINUTOS * 60 * 1000;
  }

  const queueOrders: QueueItem[] = orders
    .filter((o) => o.estado === 'en_preparacion')
    .map((o) => ({
      ...o,
      elapsedMs: now - new Date(o.updated_at ?? o.created_at).getTime(),
    }))
    .sort((a, b) => b.elapsedMs - a.elapsedMs);

  return { orders, grouped, queueOrders, loading, excedeTiempoLimite, now, refetch: fetchOrders };
}
