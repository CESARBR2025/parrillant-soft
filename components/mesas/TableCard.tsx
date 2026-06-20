'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Clock, Plus, ChevronRight } from 'lucide-react';

interface TableCardProps {
  id: number;
  numero: number;
  zona: string | null;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'reservada' | 'fuera_de_servicio';
  tiempoOcupada?: string | null;
  ordenActivaId?: number | null;
  onClick: () => void;
}

const ESTADO_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  disponible: {
    label: 'Disponible',
    dot: 'bg-green-500',
    text: 'text-green-600',
    bg: 'bg-green-500/10',
  },
  ocupada: {
    label: 'Ocupada',
    dot: 'bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-500/10',
  },
  reservada: {
    label: 'Reservada',
    dot: 'bg-yellow-500',
    text: 'text-yellow-600',
    bg: 'bg-yellow-500/10',
  },
  fuera_de_servicio: {
    label: 'Fuera de servicio',
    dot: 'bg-gray-400',
    text: 'text-gray-500',
    bg: 'bg-gray-500/10',
  },
};

export function TableCard({ numero, zona, capacidad, estado, tiempoOcupada, onClick }: TableCardProps) {
  const cfg = ESTADO_CONFIG[estado];
  const prevEstado = useRef(estado);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (prevEstado.current !== estado) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      prevEstado.current = estado;
      return () => clearTimeout(timer);
    }
  }, [estado]);

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 ${cfg.bg} transition-all duration-300
                 hover:shadow-md hover:border-accent/30
                 active:scale-[0.98] text-left w-full
                 ${animate ? 'ring-2 ring-accent/50 scale-[1.02]' : 'border-border/60'}`}
    >
      <div className="p-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card shadow-sm">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
        </div>

        <span className="text-2xl font-bold text-text-primary">Mesa {numero}</span>

        <div className="flex items-center gap-3 text-xs text-muted">
          {zona && (
            <span className="capitalize">{zona.replace('_', ' ')}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {capacidad}
          </span>
        </div>

        {tiempoOcupada && (
          <span className="text-xs font-medium text-accent tabular-nums flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {tiempoOcupada}
          </span>
        )}

        <div className="w-full pt-2.5 mt-1 border-t border-border/40">
          {estado === 'disponible' ? (
            <span className="flex items-center justify-center gap-1 text-xs font-semibold text-accent">
              <Plus className="w-3.5 h-3.5" />
              Nueva orden
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1 text-xs font-semibold text-accent">
              <ChevronRight className="w-3.5 h-3.5" />
              {estado === 'ocupada' ? 'Ver orden' : 'Ver detalles'}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
