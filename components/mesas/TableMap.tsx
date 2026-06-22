'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { TableCard } from './TableCard';
import { Search, MapPin, UtensilsCrossed, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { abrirMesa } from '@/app/actions/abrirMesa';
import type { Tables } from '@/types/database.types';

interface MesaConOrden {
  id: number;
  numero: number;
  zona: string | null;
  capacidad: number;
  estado: Tables<'mesas'>['estado'];
  orden_activa_id: number | null;
  orden_created_at: string | null;
  orden_estado: string | null;
  comensales: number | null;
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

type FilterEstado = 'disponible' | 'ocupada' | null;

interface StatDef {
  key: FilterEstado;
  label: string;
  value: number;
  valueText: string;
  inactiveBg: string;
  inactiveBorder: string;
  activeBg: string;
  activeBorder: string;
}

export function TableMap({ initialMesas }: TableMapProps) {
  const router = useRouter();
  const [mesas, setMesas] = useState<MesaConOrden[]>(initialMesas);
  const [, setNow] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>(null);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [abrirMesaData, setAbrirMesaData] = useState<{ id: number; numero: number } | null>(null);
  const [comensalesInput, setComensalesInput] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawStats = useMemo(() => ({
    total: mesas.length,
    disponibles: mesas.filter(m => m.estado === 'disponible').length,
    ocupadas: mesas.filter(m => m.estado === 'ocupada').length,
  }), [mesas]);

  const stats: StatDef[] = useMemo(() => [
    {
      key: null,
      label: 'Totales',
      value: rawStats.total,
      valueText: 'text-text-primary',
      inactiveBg: 'bg-card',
      inactiveBorder: 'border-border/60',
      activeBg: 'bg-accent/10',
      activeBorder: 'border-accent',
    },
    {
      key: 'disponible',
      label: 'Libres',
      value: rawStats.disponibles,
      valueText: 'text-emerald-600',
      inactiveBg: 'bg-card',
      inactiveBorder: 'border-border/60',
      activeBg: 'bg-emerald-500/10',
      activeBorder: 'border-emerald-500',
    },
    {
      key: 'ocupada',
      label: 'Ocupadas',
      value: rawStats.ocupadas,
      valueText: 'text-rose-600',
      inactiveBg: 'bg-card',
      inactiveBorder: 'border-border/60',
      activeBg: 'bg-rose-500/10',
      activeBorder: 'border-rose-500',
    },
  ], [rawStats]);

  const toggleFilter = useCallback((key: FilterEstado) => {
    setFilterEstado(prev => prev === key ? null : key);
  }, []);

  const handleClick = useCallback((mesa: MesaConOrden) => {
    if (mesa.estado === 'disponible') {
      setAbrirMesaData({ id: mesa.id, numero: mesa.numero });
      setComensalesInput(2);
      setShowAbrirModal(true);
    } else if (mesa.orden_estado === 'pendiente') {
      router.push(`/mesero/mesas/${mesa.id}/nueva?ordenId=${mesa.orden_activa_id}`);
    } else if (mesa.orden_activa_id) {
      router.push(`/mesero/mesas/${mesa.id}`);
    }
  }, [router]);

  const handleAbrirMesa = useCallback(async () => {
    if (!abrirMesaData) return;
    setIsSubmitting(true);
    const result = await abrirMesa(abrirMesaData.id, comensalesInput);
    setIsSubmitting(false);
    setShowAbrirModal(false);
    if (result.error) {
      alert(result.error);
    } else {
      router.push(`/mesero/mesas/${abrirMesaData.id}/nueva?comensales=${comensalesInput}`);
    }
  }, [abrirMesaData, comensalesInput, router]);

  useEffect(() => {
    const supabase = createClientSupabaseClient();
    const ESTADOS_ACTIVOS = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada'];

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
        const orden = payload.new as { mesa_id: number; id: number; created_at: string; estado: string; comensales: number | null };
        if (ESTADOS_ACTIVOS.includes(orden.estado)) {
          setMesas(prev => prev.map(m =>
            m.id === orden.mesa_id
              ? { ...m, estado: 'ocupada' as Tables<'mesas'>['estado'], orden_activa_id: orden.id, orden_created_at: orden.created_at, orden_estado: orden.estado, comensales: orden.comensales }
              : m
          ));
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ordenes',
      }, (payload) => {
        const orden = payload.new as { mesa_id: number; id: number; estado: string; comensales: number | null };

        if (orden.estado === 'cerrado') {
          setMesas(prev => prev.map(m =>
            m.id === orden.mesa_id
              ? { ...m, estado: 'disponible' as Tables<'mesas'>['estado'], orden_activa_id: null, orden_created_at: null, orden_estado: null, comensales: null }
              : m
          ));
        } else if (ESTADOS_ACTIVOS.includes(orden.estado)) {
          setMesas(prev => prev.map(m =>
            m.id === orden.mesa_id
              ? { ...m, orden_estado: orden.estado }
              : m
          ));
        }
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
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ key, label, value, valueText, inactiveBg, inactiveBorder, activeBg, activeBorder }) => {
          const isActive = filterEstado === key;
          return (
            <button
              key={label}
              onClick={() => toggleFilter(key)}
              className={`rounded-xl border-2 text-left p-3 sm:p-4 cursor-pointer transition-all duration-200
                ${isActive ? `${activeBg} ${activeBorder}` : `${inactiveBg} ${inactiveBorder}`}
                ${isActive ? 'shadow-sm' : 'hover:shadow-sm'}`}
            >
              <p className="text-xs text-muted mb-0.5">{label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${valueText}`}>{value}</p>
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
          <span>Filtrando por: <strong className="text-text-primary capitalize">{filterEstado === 'disponible' ? 'Libres' : 'Ocupadas'}</strong></span>
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
              <div className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-4 py-2.5 mb-3">
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
                    ordenEstado={mesa.orden_estado}
                    comensales={mesa.comensales}
                    onClick={() => handleClick(mesa)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* Abrir mesa modal */}
      {showAbrirModal && abrirMesaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Abrir Mesa {abrirMesaData.numero}</h2>
                    <p className="text-xs text-muted mt-0.5">Ingresa los comensales</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAbrirModal(false)}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Número de comensales
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setComensalesInput(Math.max(1, comensalesInput - 1))}
                    className="w-10 h-10 rounded-xl bg-bg-base text-muted hover:text-body flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-2xl font-bold text-text-primary tabular-nums">
                    {comensalesInput}
                  </span>
                  <button
                    onClick={() => setComensalesInput(Math.min(20, comensalesInput + 1))}
                    className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowAbrirModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={isSubmitting}
                  onClick={handleAbrirMesa}
                >
                  {isSubmitting ? 'Abriendo...' : 'Abrir mesa'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
