'use client';

import { Users, Clock, ChevronRight, UserPlus } from 'lucide-react';

interface TableCardProps {
  id: number;
  numero: number;
  zona: string | null;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'reservada' | 'fuera_de_servicio';
  tiempoOcupada?: string | null;
  ordenActivaId?: number | null;
  ordenEstado?: string | null;
  comensales?: number | null;
  onClick: () => void;
}

interface EstadoCfg {
  label: string;
  bg: string;
  border: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
  text: string;
  action: string;
  icon: React.ReactNode;
  ctaStyle: 'primary' | 'ghost';
}

const ESTADOS: Record<string, EstadoCfg> = {
  libre: {
    label: 'Libre',
    bg: 'bg-emerald-50/60',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600',
    text: 'text-emerald-800',
    action: 'Abrir mesa',
    icon: <UserPlus className="w-3.5 h-3.5" />,
    ctaStyle: 'primary',
  },
  abierta: {
    label: 'Abierta',
    bg: 'bg-slate-50/60',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    badgeBg: 'bg-slate-500/10',
    badgeText: 'text-slate-600',
    text: 'text-slate-800',
    action: 'Tomar orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
    ctaStyle: 'ghost',
  },
  preparacion: {
    label: 'En preparación',
    bg: 'bg-amber-50/60',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600',
    text: 'text-amber-800',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
    ctaStyle: 'ghost',
  },
  listo: {
    label: 'Por recoger',
    bg: 'bg-violet-50/60',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-600',
    text: 'text-violet-800',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
    ctaStyle: 'ghost',
  },
  servida: {
    label: 'Servida',
    bg: 'bg-rose-50/60',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-600',
    text: 'text-rose-800',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
    ctaStyle: 'ghost',
  },
  cuenta: {
    label: 'Cuenta solicitada',
    bg: 'bg-sky-50/60',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-600',
    text: 'text-sky-800',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
    ctaStyle: 'ghost',
  },
};

function getCfg(estado: string, ordenEstado: string | null | undefined) {
  if (estado === 'disponible') return ESTADOS.libre;
  switch (ordenEstado) {
    case 'pendiente': return ESTADOS.abierta;
    case 'en_preparacion': return ESTADOS.preparacion;
    case 'listo': return ESTADOS.listo;
    case 'entregado': return ESTADOS.servida;
    case 'cuenta_solicitada': return ESTADOS.cuenta;
    default: return ESTADOS.preparacion;
  }
}

export function TableCard({
  numero, zona, capacidad, estado, tiempoOcupada,
  ordenEstado, comensales, onClick,
}: TableCardProps) {
  const cfg = getCfg(estado, ordenEstado);

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 shadow-sm ${cfg.bg} ${cfg.border}
                 transition-all duration-200 hover:shadow-md active:shadow-sm active:scale-[0.98] text-left w-full`}
    >
      <div className="p-4 flex flex-col items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.badgeBg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-medium ${cfg.badgeText}`}>{cfg.label}</span>
        </div>

        <span className={`text-2xl font-bold ${cfg.text}`}>Mesa {numero}</span>

        <div className="flex items-center gap-3 text-xs text-muted">
          {zona && (
            <span className="capitalize">{zona.replace('_', ' ')}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {capacidad}
          </span>
        </div>

        {comensales != null && (
          <span className="text-xs text-muted tabular-nums">
            {comensales} comensal{comensales !== 1 ? 'es' : ''}
          </span>
        )}

        {tiempoOcupada && (
          <span className="text-xs font-medium text-muted tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {tiempoOcupada}
          </span>
        )}

        <div className="w-full pt-2.5 mt-1 border-t border-border/40">
          {cfg.ctaStyle === 'primary' ? (
            <span className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">
              {cfg.icon}
              {cfg.action}
            </span>
          ) : (
            <span className={`flex items-center justify-center gap-1 text-xs font-medium ${cfg.badgeText}`}>
              {cfg.icon}
              {cfg.action}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
