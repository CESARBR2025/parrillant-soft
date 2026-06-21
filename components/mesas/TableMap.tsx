'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';
import { TableCard } from './TableCard';
import { Search, MapPin, UtensilsCrossed, X } from 'lucide-react';
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
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
}

export function TableMap({ initialMesas }: TableMapProps) {
  const router = useRouter();
  const { play } = useSound('/sounds/iosbells.mp3');
  const [mesas, setMesas] = useState<MesaConOrden[]>(initialMesas);
  const notifiedRef = useRef<Set<number>>(new Set());
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
      color: 'text-gray-900',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      activeBg: 'bg-gray-100',
      activeBorder: 'border-accent',
    },
    {
      key: 'disponible',
      label: 'Libres',
      value: rawStats.disponibles,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      activeBg: 'bg-emerald-100',
      activeBorder: 'border-emerald-500',
    },
    {
      key: 'ocupada',
      label: 'Ocupadas',
      value: rawStats.ocupadas,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      activeBg: 'bg-rose-100',
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
      router.push(`/mesero/mesas/${abrirMesaData.id}/nueva?ordenId=${result.ordenId}`);
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

        if (orden.estado === 'listo') {
          if (!notifiedRef.current.has(orden.id)) {
            notifiedRef.current.add(orden.id);
            play();
          }
        } else {
          notifiedRef.current.delete(orden.id);
        }

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

    const pollListo = async () => {
      const { data } = await supabase
        .from('ordenes')
        .select('id')
        .eq('estado', 'listo');

      if (!data) return;

      data.forEach((o) => {
        if (!notifiedRef.current.has(o.id)) {
          notifiedRef.current.add(o.id);
          play();
        }
      });
    };

    const interval = setInterval(() => setNow(Date.now()), 30000);
    const pollInterval = setInterval(pollListo, 5000);

    pollListo();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, [play]);

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
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <UtensilsCrossed className="w-10 h-10 mb-3" />
        <p className="text-sm">No hay mesas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
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
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar mesa por número..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* Active filter indicator */}
      {filterEstado && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Filtrando por: <strong className="text-gray-700 capitalize">{filterEstado === 'disponible' ? 'Libres' : 'Ocupadas'}</strong></span>
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
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Search className="w-8 h-8 mb-2" />
          <p className="text-sm">No se encontraron mesas</p>
        </div>
      ) : (
        zonas.map(zona => {
          const mesasZona = mesasFiltradas.filter(m => (m.zona ?? 'sin_zona') === zona);
          return (
            <section key={zona}>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 mb-3">
                <MapPin className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-gray-800 capitalize">
                  {zona === 'sin_zona' ? 'General' : zona.replace('_', ' ')}
                </h2>
                <span className="text-xs text-gray-400 ml-auto">{mesasZona.length} mesas</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Abrir Mesa {abrirMesaData.numero}</h2>
                <button
                  onClick={() => setShowAbrirModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Número de comensales
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setComensalesInput(Math.max(1, comensalesInput - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-2xl font-bold text-gray-900 tabular-nums">
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
              <button
                onClick={handleAbrirMesa}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Abriendo mesa...' : 'Abrir mesa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
