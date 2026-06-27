'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { servirCategoria } from '@/app/actions/servirCategoria';
import { solicitarCuenta } from '@/app/actions/solicitarCuenta';
import { UtensilsCrossed, Wine, Check } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import type { Database } from '@/types/database.types';

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
  comensales?: number | null;
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

const DETALLE_HIDDEN = ['cerrado', 'cancelado', 'cuenta_solicitada'];

function itemsListos(detalles: Detalle[]): boolean {
  const sinServir = detalles.filter(d => !d.servido);
  return sinServir.length > 0 && sinServir.every(d => d.listo);
}

function RondaSection({
  ordenId,
  rondaNum,
  items,
  onServir,
  isSubmitting,
}: {
  ordenId: number;
  rondaNum: number;
  items: Detalle[];
  onServir: (ordenId: number, ronda: number, tipo: 'alimento' | 'bebida') => void;
  isSubmitting: string | null;
}) {
  const alimentos = items.filter(d => d.tipo === 'alimento');
  const bebidas = items.filter(d => d.tipo === 'bebida');
  const hasAlimentosSinServir = alimentos.some(d => !d.servido);
  const hasBebidasSinServir = bebidas.some(d => !d.servido);

  const rondaLabel = rondaNum === 1 ? 'Orden inicial' : `Ronda ${rondaNum}`;
  const ready = itemsListos(items);

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
          {ready && hasAlimentosSinServir && (
            <div className="px-5 pb-3 pt-1">
              <button
                onClick={() => onServir(ordenId, rondaNum, 'alimento')}
                disabled={isSubmitting !== null}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting === `${ordenId}-${rondaNum}-alimento` ? 'Procesando...' : (
                  <>
                    <UtensilsCrossed className="w-4 h-4" />
                    Servir alimentos
                  </>
                )}
              </button>
            </div>
          )}
          {hasAlimentosSinServir && !ready && (
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
          {ready && hasBebidasSinServir && (
            <div className="px-5 pb-3 pt-1">
              <button
                onClick={() => onServir(ordenId, rondaNum, 'bebida')}
                disabled={isSubmitting !== null}
                className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting === `${ordenId}-${rondaNum}-bebida` ? 'Procesando...' : (
                  <>
                    <Wine className="w-4 h-4" />
                    Servir bebidas
                  </>
                )}
              </button>
            </div>
          )}
          {hasBebidasSinServir && !ready && (
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

function OrdenSection({
  orden,
  label,
  isParent,
  onServir,
  isSubmitting,
}: {
  orden: Orden;
  label: string;
  isParent: boolean;
  onServir: (ordenId: number, ronda: number, tipo: 'alimento' | 'bebida') => void;
  isSubmitting: string | null;
}) {
  const rondas = useMemo(() => {
    const map = new Map<number, Detalle[]>();
    for (const d of orden.detalles_orden) {
      const list = map.get(d.ronda) ?? [];
      list.push(d);
      map.set(d.ronda, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [orden.detalles_orden]);

  const hidden = DETALLE_HIDDEN.includes(orden.estado) &&
    orden.detalles_orden.every(d => d.servido);

  if (hidden) return null;

  const cfg = ESTADO_CONFIG[orden.estado];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
      </div>

      {rondas.map(([rondaNum, items], idx) => (
        <div key={rondaNum}>
          {idx > 0 && <div className="border-t-2 border-dashed border-gray-300" />}
          <RondaSection
            ordenId={orden.id}
            rondaNum={rondaNum}
            items={items}
            onServir={onServir}
            isSubmitting={isSubmitting}
          />
        </div>
      ))}

      {rondas.length === 0 && (
        <div className="px-5 py-6 text-center text-sm text-gray-400">
          Sin ítems
        </div>
      )}
    </div>
  );
}

export function ActiveOrderView({
  mesa,
  ordenPadre: padreInicial,
  subOrdenes: subsIniciales,
}: {
  mesa: Mesa;
  ordenPadre: Orden;
  subOrdenes: Orden[];
}) {
  const router = useRouter();
  const sucursal = useSucursal();
  const [padre, setPadre] = useState<Orden>(padreInicial);
  const [subOrdenes, setSubOrdenes] = useState<Orden[]>(subsIniciales);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [regresando, setRegresando] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClientSupabaseClient();
    const ESTADOS_ACTIVOS: Database['public']['Enums']['estado_orden'][] = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada'];

    const { data: p } = await supabase
      .from('ordenes')
      .select(`
        id, estado, notas, created_at, alimentos_servidos, bebidas_servidos, comensales,
        detalles_orden (
          id, cantidad, notas, listo, tipo, ronda, servido, producto_id, precio_unitario,
          productos_menu (nombre, precio)
        )
      `)
      .eq('id', padreInicial.id)
      .single();

    if (p) setPadre(p as unknown as Orden);

    const { data: subs } = await supabase
      .from('ordenes')
      .select(`
        id, estado, notas, created_at, alimentos_servidos, bebidas_servidos,
        detalles_orden (
          id, cantidad, notas, listo, tipo, ronda, servido, producto_id, precio_unitario,
          productos_menu (nombre, precio)
        )
      `)
      .eq('orden_padre_id', padreInicial.id)
      .in('estado', ESTADOS_ACTIVOS)
      .order('created_at', { ascending: true });

    if (subs) setSubOrdenes(subs as unknown as Orden[]);
  }, [padreInicial.id]);

  useEffect(() => {
    const supabase = createClientSupabaseClient();

    fetchData();

    const channel = supabase
      .channel(`mesa-${mesa.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordenes',
        filter: `id=eq.${padreInicial.id}`,
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'detalles_orden',
      }, () => fetchData())
      .subscribe();

    const interval = setInterval(fetchData, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [mesa.id, padreInicial.id, fetchData]);

  const todasEntregadas = useMemo(() => {
    if (padre.estado !== 'entregado') return false;
    return subOrdenes.every(s => s.estado === 'entregado');
  }, [padre.estado, subOrdenes]);

  const handleServir = async (ordenId: number, ronda: number, tipo: 'alimento' | 'bebida') => {
    const key = `${ordenId}-${ronda}-${tipo}`;
    setIsSubmitting(key);
    await servirCategoria(ordenId, tipo, ronda);
    setIsSubmitting(null);
  };

  const handleSolicitarCuenta = async () => {
    setIsSubmitting('cuenta');
    const result = await solicitarCuenta(padre.id);
    setIsSubmitting(null);
    if (result.error) {
      console.error(result.error);
    }
  };

  const cfg = ESTADO_CONFIG[padre.estado];

  return (
    <>
      <LoadingOverlay show={regresando} />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => {
              setRegresando(true);
              router.push(`/${sucursal?.slug}/mesero/mapa`);
            }}
            disabled={regresando}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent bg-accent/10 hover:bg-accent hover:text-white border border-accent/20 hover:border-accent rounded-md px-3 py-1.5 transition-colors mb-3 disabled:opacity-70"
          >
            ← Regresar
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Mesa {mesa.numero}
            {mesa.zona && (
              <span className="text-sm font-normal text-gray-400 ml-2 capitalize">
                {mesa.zona.replace('_', ' ')}
              </span>
            )}
            {padre.comensales != null && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                {padre.comensales} comensal{padre.comensales !== 1 ? 'es' : ''}
              </span>
            )}
          </h1>
        </div>
        {cfg && (
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        )}
      </div>

      <OrdenSection
        orden={padre}
        label="Orden inicial"
        isParent
        onServir={handleServir}
        isSubmitting={isSubmitting}
      />

      {subOrdenes.map((sub, idx) => (
        <OrdenSection
          key={sub.id}
          orden={sub}
          label={`Adicional ${idx + 1}`}
          isParent={false}
          onServir={handleServir}
          isSubmitting={isSubmitting}
        />
      ))}

      <div className="flex flex-col gap-3">
        {(padre.estado === 'pendiente' || padre.estado === 'en_preparacion' || padre.estado === 'entregado') && (
          <button
            onClick={() => router.push(`/${sucursal?.slug}/mesero/mesas/${mesa.id}/nueva?ordenId=${padre.id}`)}
            className="w-full rounded-xl bg-accent text-white px-4 py-3 text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            + Agregar ítems
          </button>
        )}

        {padre.estado === 'entregado' && subOrdenes.some(s => s.estado !== 'entregado') && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 text-center">
            Esperando a que los pedidos adicionales estén servidos
          </div>
        )}

        {todasEntregadas && (
          <button
            onClick={handleSolicitarCuenta}
            disabled={isSubmitting !== null}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting === 'cuenta' ? 'Procesando...' : 'Solicitar cuenta'}
          </button>
        )}

        {padre.estado === 'cuenta_solicitada' && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 text-center">
            Esperando cobro en Caja
          </div>
        )}
      </div>
    </div>
    </>
  );
}
