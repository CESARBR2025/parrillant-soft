'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Search, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

interface Detalle {
  id: number;
  cantidad: number;
  notas: string | null;
  listo: boolean;
  tipo: string;
  productos_menu: { nombre: string; precio: number } | null;
}

interface Orden {
  id: number;
  estado: string;
  notas: string | null;
  total: number | null;
  created_at: string;
  mesas: { numero: number; zona: string | null } | null;
  detalles_orden: Detalle[];
}

const ESTADO_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'purple' | 'default' | 'danger'> = {
  pendiente: 'warning',
  en_preparacion: 'info',
  listo: 'success',
  entregado: 'purple',
  cuenta_solicitada: 'info',
  cerrado: 'default',
  cancelado: 'danger',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Abierta',
  en_preparacion: 'En preparación',
  listo: 'Por recoger',
  entregado: 'Servida',
  cuenta_solicitada: 'Cuenta solicitada',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

const FILTERS = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Abiertas' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'listo', label: 'Por recoger' },
  { value: 'entregado', label: 'Servidas' },
  { value: 'cuenta_solicitada', label: 'Cuenta solicitada' },
];

function getEstadoCardStyle(estado: string): string {
  switch (estado) {
    case 'pendiente': return 'border-l-yellow-500 bg-yellow-50/40';
    case 'en_preparacion': return 'border-l-blue-500 bg-blue-50/40';
    case 'listo': return 'border-l-green-500 bg-green-50/40';
    case 'entregado': return 'border-l-purple-500 bg-purple-50/40';
    case 'cuenta_solicitada': return 'border-l-sky-500 bg-sky-50/40';
    case 'cerrado': return 'border-l-gray-400 bg-gray-50/40';
    case 'cancelado': return 'border-l-red-500 bg-red-50/40';
    default: return 'bg-card';
  }
}

function formatElapsed(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const restMins = mins % 60;
  if (hrs < 24) return restMins > 0 ? `hace ${hrs}h ${restMins}m` : `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export function OrderHistoryView({ ordenes }: { ordenes: Orden[] }) {
  const router = useRouter();
  const sucursal = useSucursal();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('todas');
  const [regresando, setRegresando] = useState(false);

  const filtradas = filter === 'todas'
    ? ordenes
    : ordenes.filter(o => o.estado === filter);

  return (
    <>
      <LoadingOverlay show={regresando} />
      <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => {
            setRegresando(true);
            router.push(`/${sucursal?.slug}/mesero`);
          }}
          disabled={regresando}
          className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-accent bg-accent/10 hover:bg-accent hover:text-white border border-accent/20 hover:border-accent rounded-md px-3 py-1.5 transition-colors mb-3 disabled:opacity-70"
        >
          ← Regresar
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <ScrollText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-text-primary">Historial de Órdenes</h1>
            <p className="text-xs text-muted">{ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''} hoy</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f.value
              ? 'bg-accent text-white shadow-sm'
              : 'bg-card text-muted hover:text-body border border-border/60'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description={filter === 'todas' ? 'No hay órdenes registradas hoy' : `No hay órdenes en este estado`}
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map(orden => {
            const isExpanded = expandedId === orden.id;
            const totalLineas = orden.detalles_orden.reduce(
              (sum, d) => sum + d.cantidad * (d.productos_menu?.precio ?? 0),
              0,
            );

            return (
              <div
                key={orden.id}
                className={`rounded-2xl border-2 border-l-4 border-border/60 shadow-sm
                           overflow-hidden transition-all duration-200 hover:shadow-md
                           ${getEstadoCardStyle(orden.estado)}`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : orden.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between px-5 py-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base font-bold text-text-primary whitespace-nowrap">
                          Mesa {orden.mesas?.numero}
                        </span>
                        {orden.mesas?.zona && (
                          <span className="text-xs text-muted capitalize truncate">
                            {orden.mesas.zona.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <Badge variant={ESTADO_VARIANT[orden.estado] ?? 'default'}>
                        {ESTADO_LABEL[orden.estado] ?? orden.estado}
                      </Badge>
                      {orden.total != null && (
                        <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                          ${Number(orden.total).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted shrink-0">
                      <span className="tabular-nums whitespace-nowrap">
                        {new Date(orden.created_at).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-muted/40">·</span>
                      <span className="tabular-nums whitespace-nowrap text-muted/70 hidden sm:inline">
                        {formatElapsed(orden.created_at)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted/50" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted/50" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3">
                    <div className="bg-bg-base rounded-xl divide-y divide-border/40 overflow-hidden">
                      {orden.detalles_orden.map(d => (
                        <div key={d.id} className="flex items-start gap-2.5 px-3.5 py-3">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${d.listo ? 'bg-green-500' : 'bg-yellow-400'
                              }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-body font-medium">
                                {d.cantidad}x {d.productos_menu?.nombre}
                              </span>
                              {d.productos_menu?.precio != null && (
                                <span className="text-xs text-muted tabular-nums font-medium shrink-0">
                                  ${(d.cantidad * d.productos_menu.precio).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {d.notas && (
                              <span className="text-xs text-muted italic flex items-center gap-1 mt-1">
                                <span className="w-1 h-1 rounded-full bg-yellow-500 shrink-0" />
                                {d.notas}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {orden.notas && (
                      <div className="px-3.5 py-2 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-xs font-medium text-accent">
                          <span className="font-semibold">Nota general:</span> {orden.notas}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-border/40">
                      <span className="text-sm font-semibold text-text-primary">Total</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                        ${Number(orden.total ?? totalLineas).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
