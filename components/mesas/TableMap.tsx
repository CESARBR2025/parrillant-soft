'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { TableCard } from './TableCard';
import { Search, MapPin, UtensilsCrossed } from 'lucide-react';
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

type FilterEstado = 'disponible' | 'ocupada' | 'reservada' | null;

interface StatDef {
  key: FilterEstado;
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
}

export function TableMap({ initialMesas }: TableMapProps) {
  const router = useRouter();
  const [mesas, setMesas] = useState<MesaConOrden[]>(initialMesas);
  const [, setNow] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>(null);

  const rawStats = useMemo(() => ({
    total: mesas.length,
    disponibles: mesas.filter(m => m.estado === 'disponible').length,
    ocupadas: mesas.filter(m => m.estado === 'ocupada').length,
    reservadas: mesas.filter(m => m.estado === 'reservada').length,
  }), [mesas]);

  const stats: StatDef[] = useMemo(() => [
    {
      key: null,
      label: 'Totales',
      value: rawStats.total,
      color: 'text-text-primary',
      bg: 'bg-card',
      border: 'border-border/60',
      activeBg: 'bg-accent/10',
      activeBorder: 'border-accent/50',
    },
    {
      key: 'disponible',
      label: 'Disponibles',
      value: rawStats.disponibles,
      color: 'text-green-600',
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
      activeBg: 'bg-green-500/20',
      activeBorder: 'border-green-500',
    },
    {
      key: 'ocupada',
      label: 'Ocupadas',
      value: rawStats.ocupadas,
      color: 'text-red-600',
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      activeBg: 'bg-red-500/20',
      activeBorder: 'border-red-500',
    },
    {
      key: 'reservada',
      label: 'Reservadas',
      value: rawStats.reservadas,
      color: 'text-yellow-600',
      bg: 'bg-yellow-500/5',
      border: 'border-yellow-500/20',
      activeBg: 'bg-yellow-500/20',
      activeBorder: 'border-yellow-500',
    },
  ], [rawStats]);

  const toggleFilter = useCallback((key: FilterEstado) => {
    setFilterEstado(prev => prev === key ? null : key);
  }, []);

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

  const mesasFiltradas = useMemo(() => {
    let result = mesas;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => String(m.numero).includes(q));
    }
    if (filterEstado) {
      result = result.filter(m => m.estado === filterEstado);
    }
    return result;
  }, [mesas, searchQuery, filterEstado]);

  const zonas = useMemo(() =>
    [...new Set(mesasFiltradas.map(m => m.zona ?? 'sin_zona'))].sort(),
    [mesasFiltradas]
  );

  if (mesas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <UtensilsCrossed className="w-10 h-10 mb-3" />
        <p className="text-sm">No hay mesas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ key, label, value, color, bg, border, activeBg, activeBorder }) => {
          const isActive = filterEstado === key;
          return (
            <button
              key={label}
              onClick={() => toggleFilter(key)}
              className={`rounded-xl border-2 text-left p-3 sm:p-4 cursor-pointer transition-all duration-200
                ${isActive ? `${activeBg} ${activeBorder}` : `${bg} ${border}`}
                ${isActive ? 'shadow-sm' : 'hover:shadow-sm'}`}
            >
              <p className="text-xs text-muted mb-0.5">{label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar mesa por número..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Active filter indicator */}
      {filterEstado && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Filtrando por: <strong className="text-text-primary capitalize">{filterEstado === 'disponible' ? 'Disponibles' : filterEstado === 'ocupada' ? 'Ocupadas' : 'Reservadas'}</strong></span>
          <button
            onClick={() => setFilterEstado(null)}
            className="text-accent hover:text-accent-dark font-medium underline"
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* Zones */}
      {zonas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted">
          <Search className="w-8 h-8 mb-2" />
          <p className="text-sm">No se encontraron mesas</p>
        </div>
      ) : (
        zonas.map(zona => {
          const mesasZona = mesasFiltradas.filter(m => (m.zona ?? 'sin_zona') === zona);
          return (
            <section key={zona}>
              <div className="flex items-center gap-2 bg-accent/5 rounded-xl px-4 py-2.5 mb-3">
                <MapPin className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary capitalize">
                  {zona === 'sin_zona' ? 'General' : zona.replace('_', ' ')}
                </h2>
                <span className="text-xs text-muted ml-auto">{mesasZona.length} mesas</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[14px]">
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
        })
      )}
    </div>
  );
}
