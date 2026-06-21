'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

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
  cerrado: 'default',
  cancelado: 'danger',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

export function OrderHistoryView({ ordenes }: { ordenes: Orden[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('todas');

  const filtradas = filter === 'todas'
    ? ordenes
    : ordenes.filter(o => o.estado === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Historial de Órdenes</h1>
        <button
          onClick={() => router.push('/mesero')}
          className="text-sm text-muted hover:text-body transition-colors"
        >
          ← Mapa de Mesas
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'todas', label: 'Todas' },
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'en_preparacion', label: 'Preparando' },
          { value: 'listo', label: 'Listas' },
          { value: 'entregado', label: 'Entregadas' },
          { value: 'cerrado', label: 'Cerradas' },
          { value: 'cancelado', label: 'Canceladas' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-accent text-white'
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
          description={filter === 'todas' ? 'No hay órdenes registradas hoy' : `No hay órdenes con estado "${ESTADO_LABEL[filter]}"`}
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map(orden => {
            const isExpanded = expandedId === orden.id;
            return (
              <div
                key={orden.id}
                className="bg-card rounded-2xl border-2 border-border/60 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : orden.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-semibold text-text-primary">
                        Mesa {orden.mesas?.numero}
                      </span>
                      {orden.mesas?.zona && (
                        <span className="text-xs text-muted ml-2 capitalize">
                          {orden.mesas.zona.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <Badge variant={ESTADO_VARIANT[orden.estado] ?? 'default'}>
                      {ESTADO_LABEL[orden.estado] ?? orden.estado}
                    </Badge>
                    {orden.total != null && (
                      <span className="text-xs text-muted">
                        ${Number(orden.total).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="tabular-nums">
                      {new Date(orden.created_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4">
                    <ul className="divide-y divide-border/40 bg-bg-base rounded-xl">
                      {orden.detalles_orden.map(d => (
                        <li key={d.id} className="flex items-center gap-2 px-3 py-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${d.listo ? 'bg-green-500' : 'bg-yellow-400'}`} />
                          <span className="text-xs text-body flex-1">
                            {d.cantidad}x {d.productos_menu?.nombre}
                          </span>
                          {d.notas && (
                            <span className="text-xs text-muted italic truncate max-w-[120px]">
                              {d.notas}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
