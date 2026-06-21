'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { servirCategoria } from '@/app/actions/servirCategoria';
import { solicitarCuenta } from '@/app/actions/solicitarCuenta';
import { UtensilsCrossed, Wine, Check } from 'lucide-react';

interface Detalle {
  id: number;
  cantidad: number;
  notas: string | null;
  listo: boolean;
  tipo: string;
  ronda: number;
  servido: boolean;
  producto_id: number;
  precio_unitario: number;
  productos_menu: { nombre: string; precio: number } | null;
}

interface Orden {
  id: number;
  estado: string;
  notas: string | null;
  created_at: string;
  alimentos_servidos: boolean;
  bebidas_servidos: boolean;
  detalles_orden: Detalle[];
}

interface Mesa {
  id: number;
  numero: number;
  zona: string | null;
}

const ESTADO_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  pendiente: { label: 'Abierta', variant: 'default' },
  en_preparacion: { label: 'En Preparación', variant: 'warning' },
  listo: { label: 'Por Recoger', variant: 'purple' },
  entregado: { label: 'Servida', variant: 'info' },
  cuenta_solicitada: { label: 'Cuenta Solicitada', variant: 'info' },
};

function RondaSection({
  rondaNum,
  items,
  itemsReady,
  onServir,
  isSubmitting,
}: {
  rondaNum: number;
  items: Detalle[];
  itemsReady: boolean;
  onServir: (ronda: number, tipo: 'alimento' | 'bebida') => void;
  isSubmitting: string | null;
}) {
  const alimentos = items.filter(d => d.tipo === 'alimento');
  const bebidas = items.filter(d => d.tipo === 'bebida');
  const hasAlimentosSinServir = alimentos.some(d => !d.servido);
  const hasBebidasSinServir = bebidas.some(d => !d.servido);

  const rondaLabel = rondaNum === 1 ? 'Orden inicial' : `Ronda ${rondaNum}`;

  return (
    <section>
      <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{rondaLabel}</span>
        <span className="text-xs text-gray-400 ml-auto">{items.length} ítems</span>
      </div>

      {alimentos.length > 0 && (
        <div className="border-b border-gray-100 last:border-b-0">
          <div className="px-5 py-3 flex items-center gap-2 bg-emerald-50/30">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Alimentos</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {alimentos.map(detalle => (
              <li key={detalle.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${detalle.listo ? 'bg-green-500' : 'bg-yellow-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${detalle.servido ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {detalle.cantidad}x {detalle.productos_menu?.nombre ?? `Producto #${detalle.producto_id}`}
                  </p>
                  {detalle.notas && (
                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">{detalle.notas}</p>
                  )}
                </div>
                {detalle.servido ? (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Servido
                  </span>
                ) : (
                  <Badge variant={detalle.listo ? 'success' : 'warning'}>
                    {detalle.listo ? 'Listo' : 'Prep.'}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          {itemsReady && hasAlimentosSinServir && (
            <div className="px-5 pb-3 pt-1">
              <button
                onClick={() => onServir(rondaNum, 'alimento')}
                disabled={isSubmitting !== null}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting === `${rondaNum}-alimento` ? 'Procesando...' : (
                  <>
                    <UtensilsCrossed className="w-4 h-4" />
                    Servir alimentos
                  </>
                )}
              </button>
            </div>
          )}
          {hasAlimentosSinServir && !itemsReady && (
            <div className="px-5 pb-3 pt-1">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700 text-center">
                Esperando que estén listos
              </div>
            </div>
          )}
        </div>
      )}

      {bebidas.length > 0 && (
        <div className="border-b border-gray-100 last:border-b-0">
          <div className="px-5 py-3 flex items-center gap-2 bg-sky-50/30">
            <Wine className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-xs font-medium text-sky-700 uppercase tracking-wider">Bebidas</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {bebidas.map(detalle => (
              <li key={detalle.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${detalle.listo ? 'bg-green-500' : 'bg-yellow-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${detalle.servido ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {detalle.cantidad}x {detalle.productos_menu?.nombre ?? `Producto #${detalle.producto_id}`}
                  </p>
                  {detalle.notas && (
                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">{detalle.notas}</p>
                  )}
                </div>
                {detalle.servido ? (
                  <span className="text-xs text-sky-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Servido
                  </span>
                ) : (
                  <Badge variant={detalle.listo ? 'success' : 'warning'}>
                    {detalle.listo ? 'Listo' : 'Prep.'}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          {itemsReady && hasBebidasSinServir && (
            <div className="px-5 pb-3 pt-1">
              <button
                onClick={() => onServir(rondaNum, 'bebida')}
                disabled={isSubmitting !== null}
                className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting === `${rondaNum}-bebida` ? 'Procesando...' : (
                  <>
                    <Wine className="w-4 h-4" />
                    Servir bebidas
                  </>
                )}
              </button>
            </div>
          )}
          {hasBebidasSinServir && !itemsReady && (
            <div className="px-5 pb-3 pt-1">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700 text-center">
                Esperando que estén listos
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ActiveOrderView({ mesa, orden: ordenInicial }: { mesa: Mesa; orden: Orden }) {
  const router = useRouter();
  const [orden, setOrden] = useState<Orden>(ordenInicial);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
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
          alimentos_servidos,
          bebidas_servidos,
          detalles_orden (
            id,
            cantidad,
            notas,
            listo,
            tipo,
            ronda,
            servido,
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
  const cfg = ESTADO_CONFIG[orden.estado];

  // Sort by id (insertion order) to maintain ronda sequence
  const rondas = useMemo(() => {
    const map = new Map<number, Detalle[]>();
    for (const d of orden.detalles_orden) {
      const list = map.get(d.ronda) ?? [];
      list.push(d);
      map.set(d.ronda, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [orden.detalles_orden]);

  const handleServir = async (ronda: number, tipo: 'alimento' | 'bebida') => {
    const key = `${ronda}-${tipo}`;
    setIsSubmitting(key);
    await servirCategoria(orden.id, tipo, ronda);
    setIsSubmitting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/mesero/mapa')}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-1"
          >
            ← Mapa de Mesas
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Mesa {mesa.numero}
            {mesa.zona && (
              <span className="text-sm font-normal text-gray-400 ml-2 capitalize">
                {mesa.zona.replace('_', ' ')}
              </span>
            )}
          </h1>
        </div>
        {cfg && (
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        )}
      </div>

      {orden.notas && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Nota: {orden.notas}
        </div>
      )}

      {/* Items grouped by ronda */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {rondas.map(([rondaNum, items], idx) => (
          <div key={rondaNum}>
            {idx > 0 && <div className="border-t-2 border-dashed border-gray-300" />}
            <RondaSection
              rondaNum={rondaNum}
              items={items}
              itemsReady={allItemsReady}
              onServir={handleServir}
              isSubmitting={isSubmitting}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {(orden.estado === 'pendiente' || orden.estado === 'en_preparacion' || orden.estado === 'entregado') && (
          <button
            onClick={() => router.push(`/mesero/mesas/${mesa.id}/nueva?ordenId=${orden.id}`)}
            className="w-full rounded-xl bg-accent text-white px-4 py-3 text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            + Agregar {orden.estado === 'pendiente' ? '' : 'más '}ítems
          </button>
        )}

        {orden.estado === 'listo' && !allItemsReady && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 text-center">
            Esperando a que todos los ítems estén listos
          </div>
        )}

        {orden.estado === 'entregado' && (
          <button
            onClick={async () => {
              setIsSubmitting('cuenta');
              const result = await solicitarCuenta(orden.id);
              setIsSubmitting(null);
              if (result.error) {
                console.error(result.error);
              }
            }}
            disabled={isSubmitting !== null}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting === 'cuenta' ? 'Procesando...' : 'Solicitar cuenta'}
          </button>
        )}

        {orden.estado === 'cuenta_solicitada' && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 text-center">
            Esperando cobro en Caja
          </div>
        )}
      </div>
    </div>
  );
}
