'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';

interface Detalle {
  id: number;
  cantidad: number;
  notas: string | null;
  listo: boolean;
  tipo: string;
  producto_id: number;
  precio_unitario: number;
  productos_menu: { nombre: string; precio: number } | null;
}

interface Orden {
  id: number;
  estado: string;
  notas: string | null;
  created_at: string;
  detalles_orden: Detalle[];
}

interface Mesa {
  id: number;
  numero: number;
  zona: string | null;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En Preparación',
  listo: 'Listo',
  entregado: 'Entregado',
};

const ESTADO_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'purple'> = {
  pendiente: 'warning',
  en_preparacion: 'info',
  listo: 'success',
  entregado: 'purple',
};

export function ActiveOrderView({ mesa, orden: ordenInicial }: { mesa: Mesa; orden: Orden }) {
  const router = useRouter();
  const [orden, setOrden] = useState<Orden>(ordenInicial);
  const pollRef = useRef<() => void>(() => { });

  useEffect(() => {
    const ordenId = ordenInicial.id;
    const supabase = createClientSupabaseClient();

    async function poll() {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id,
          estado,
          notas,
          created_at,
          detalles_orden (
            id,
            cantidad,
            notas,
            listo,
            tipo,
            producto_id,
            precio_unitario,
            productos_menu (nombre, precio)
          )
        `)
        .eq('id', ordenId)
        .single();

      if (data) {
        setOrden(data as unknown as Orden);
      } else if (error) {
        console.error('[poll] Error fetching orden', error);
      }
    }

    console.log(orden)

    pollRef.current = poll;

    poll();

    const channel = supabase
      .channel(`mesa-orden-${ordenId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ordenes',
        filter: `id=eq.${ordenId}`,
      }, () => poll())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'detalles_orden',
        filter: `orden_id=eq.${ordenId}`,
      }, () => poll())
      .subscribe();

    const interval = setInterval(poll, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [ordenInicial.id]);

  const allItemsReady = orden.detalles_orden.length > 0 && orden.detalles_orden.every(d => d.listo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/mesero')}
            className="text-sm text-muted hover:text-body transition-colors mb-1"
          >
            ← Mapa de Mesas
          </button>
          <h1 className="text-xl font-bold text-text-primary">
            Mesa {mesa.numero}
            {mesa.zona && (
              <span className="text-sm font-normal text-muted ml-2 capitalize">
                {mesa.zona.replace('_', ' ')}
              </span>
            )}
          </h1>
        </div>
        <Badge variant={ESTADO_VARIANT[orden.estado] ?? 'default'}>
          {ESTADO_LABEL[orden.estado] ?? orden.estado}
        </Badge>
      </div>

      {orden.notas && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 text-sm text-warning">
          Nota: {orden.notas}
        </div>
      )}

      <div className="bg-card rounded-2xl border-2 border-border/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Ítems
            <span className="ml-2 font-normal normal-case text-xs">
              ({orden.detalles_orden.length})
            </span>
          </h2>
        </div>
        <ul className="divide-y divide-border/40">
          {orden.detalles_orden.map(detalle => (
            <li key={detalle.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${detalle.listo ? 'bg-green-500' : 'bg-yellow-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-body">
                  {detalle.cantidad}x {detalle.productos_menu?.nombre ?? `Producto #${detalle.producto_id}`}
                </p>
                {detalle.notas && (
                  <p className="text-xs text-muted italic mt-0.5 truncate">{detalle.notas}</p>
                )}
              </div>
              <Badge variant={detalle.listo ? 'success' : 'warning'}>
                {detalle.listo ? 'Listo' : 'Preparando'}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push(`/mesero/mesas/${mesa.id}/nueva?ordenId=${orden.id}`)}
          className="w-full rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm font-medium text-muted hover:text-body hover:border-accent/50 transition-colors"
        >
          + Agregar más ítems
        </button>

        {allItemsReady && orden.estado !== 'entregado' && (
          <button
            onClick={async () => {
              const res = await fetch(`/api/ordenes/${orden.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'entregado' }),
              });
              if (res.ok) {
                pollRef.current();
              }
            }}
            className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
          >
            Finalizar/Solicitar cuenta
          </button>
        )}

        {orden.estado === 'entregado' && (
          <div className="rounded-xl bg-info/10 border border-info/20 p-3 text-sm text-info text-center">
            Esperando que Caja procese el pago
          </div>
        )}
      </div>
    </div>
  );
}
