'use client';

import { Users } from 'lucide-react';

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

const ESTADO_CONFIG: Record<string, { color: string; label: string; dot: string }> = {
  disponible: { color: 'border-green-500/40 bg-green-500/5', label: 'Disponible', dot: 'bg-green-500' },
  ocupada: { color: 'border-red-500/40 bg-red-500/5', label: 'Ocupada', dot: 'bg-red-500' },
  reservada: { color: 'border-yellow-500/40 bg-yellow-500/5', label: 'Reservada', dot: 'bg-yellow-500' },
  fuera_de_servicio: { color: 'border-gray-500/40 bg-gray-500/5', label: 'Fuera de servicio', dot: 'bg-gray-500' },
};

export function TableCard({ numero, zona, capacidad, estado, tiempoOcupada, onClick }: TableCardProps) {
  const cfg = ESTADO_CONFIG[estado];

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02] active:scale-95 ${cfg.color}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="text-xs font-medium text-muted">{cfg.label}</span>
      </div>

      <span className="text-2xl font-bold text-white mt-1">Mesa {numero}</span>

      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
        {zona && (
          <span className="capitalize">{zona.replace('_', ' ')}</span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {capacidad}
        </span>
      </div>

      {tiempoOcupada && (
        <span className="text-xs text-muted mt-2 tabular-nums">
          {tiempoOcupada}
        </span>
      )}
    </button>
  );
}
