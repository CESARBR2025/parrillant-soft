'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSucursal } from '@/components/providers/SucursalProvider';
import type { Database } from '@/types/database.types';

type OnNewOrderCallback = () => void;

type OrdenRow = Database['public']['Tables']['ordenes']['Row'];
type DetalleRow = {
  id: number;
  cantidad: number;
  notas: string | null;
  listo: boolean;
  tipo: string;
  producto_id: number | null;
  orden_id: number;
};

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
  esSubOrden: boolean;
}

export interface KitchenOrdersGrouped {
  pendiente: KitchenOrder[];
  en_preparacion: KitchenOrder[];
  listo: KitchenOrder[];
}

export interface QueueItem extends KitchenOrder {
  elapsedMs: number;
  excedeTiempo: boolean;
}

const TIEMPO_LIMITE_MINUTOS = 15;

interface OrdenWithRelations extends OrdenRow {
  mesas: { numero: number } | null;
  orden_padre_id: number | null;
  detalles_orden: (DetalleRow & {
    productos_menu: { nombre: string } | null;
  })[];
}

export function useKitchenOrders(tipo: 'alimento' | 'bebida', onNewOrder?: OnNewOrderCallback) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(() => Date.now());
  const sucursal = useSucursal();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClientSupabaseClient>['channel']> | null>(null);
  const prevOrderIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);
  const onNewOrderRef = useRef<OnNewOrderCallback | undefined>(onNewOrder);
  useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);

  const fetchOrders = useCallback(async () => {
    if (!sucursal?.id) return;

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
        orden_padre_id,
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
      .eq('sucursal_id', sucursal.id)
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
          esSubOrden: o.orden_padre_id !== null,
        };
      })
      .filter((o) => o.items.length > 0);

    if (!isFirstLoadRef.current && onNewOrderRef.current) {
      const hasNew = transformed.some((o) => !prevOrderIdsRef.current.has(o.id));
      if (hasNew) {
        onNewOrderRef.current();
      }
    }
    prevOrderIdsRef.current = new Set(transformed.map((o) => o.id));
    isFirstLoadRef.current = false;

    setOrders(transformed);
    setLoading(false);
  }, [tipo, sucursal?.id]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await fetchOrders();
      if (!mounted) return;

      const supabase = createClientSupabaseClient();

      const channelName = `kitchen-${tipo}-${sucursal?.id ?? 'unknown'}-${Math.random().toString(36).slice(2, 9)}`;

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ordenes',
          filter: `sucursal_id=eq.${sucursal?.id}`,
        }, () => { if (mounted) fetchOrders(); })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes',
          filter: `sucursal_id=eq.${sucursal?.id}`,
        }, () => { if (mounted) fetchOrders(); })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'detalles_orden',
        }, () => { if (mounted) fetchOrders(); })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'detalles_orden',
        }, () => { if (mounted) fetchOrders(); })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED' && status !== 'CHANNEL_ERROR') {
            console.warn(`[kitchen ${tipo}] Realtime status:`, status);
          }
        });

      channelRef.current = channel;

      const timerInterval = setInterval(() => {
        if (mounted) setNow(Date.now());
      }, 1000);

      return { channel, supabase, timerInterval };
    }

    const cleanup = {
      channel: null as ReturnType<ReturnType<typeof createClientSupabaseClient>['channel']> | null,
      supabase: null as ReturnType<typeof createClientSupabaseClient> | null,
      timerInterval: null as ReturnType<typeof setInterval> | null,
    };

    init().then((c) => {
      if (!c || !mounted) return;
      cleanup.channel = c.channel;
      cleanup.supabase = c.supabase;
      cleanup.timerInterval = c.timerInterval;
    });

    return () => {
      mounted = false;
      if (cleanup.supabase && cleanup.channel) {
        cleanup.supabase.removeChannel(cleanup.channel);
      }
      if (cleanup.timerInterval) {
        clearInterval(cleanup.timerInterval);
      }
    };
  }, [fetchOrders, tipo, sucursal?.id]);

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
      excedeTiempo: (now - new Date(o.created_at).getTime()) > TIEMPO_LIMITE_MINUTOS * 60 * 1000,
    }))
    .sort((a, b) => b.elapsedMs - a.elapsedMs);

  return { orders, grouped, queueOrders, loading, excedeTiempoLimite, now, refetch: fetchOrders };
}
