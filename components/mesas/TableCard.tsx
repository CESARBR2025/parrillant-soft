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
  cardBg: string;
  cardBorder: string;
  dot: string;
  badge: string;
  badgeText: string;
  text: string;
  muted: string;
  action: string;
  icon: React.ReactNode;
}

const ESTADOS: Record<string, EstadoCfg> = {
  libre: {
    label: 'Libre',
    cardBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'bg-white/70',
    badgeText: 'text-emerald-700',
    text: 'text-emerald-900',
    muted: 'text-emerald-600/60',
    action: 'Abrir mesa',
    icon: <UserPlus className="w-3.5 h-3.5" />,
  },
  abierta: {
    label: 'Abierta',
    cardBg: 'bg-slate-50',
    cardBorder: 'border-slate-200',
    dot: 'bg-slate-400',
    badge: 'bg-white/70',
    badgeText: 'text-slate-600',
    text: 'text-slate-800',
    muted: 'text-slate-500/60',
    action: 'Tomar orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
  },
  preparacion: {
    label: 'En preparación',
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-200',
    dot: 'bg-amber-500',
    badge: 'bg-white/70',
    badgeText: 'text-amber-700',
    text: 'text-amber-900',
    muted: 'text-amber-600/60',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
  },
  listo: {
    label: 'Por recoger',
    cardBg: 'bg-violet-50',
    cardBorder: 'border-violet-200',
    dot: 'bg-violet-500',
    badge: 'bg-white/70',
    badgeText: 'text-violet-700',
    text: 'text-violet-900',
    muted: 'text-violet-600/60',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
  },
  servida: {
    label: 'Servida',
    cardBg: 'bg-rose-50',
    cardBorder: 'border-rose-200',
    dot: 'bg-rose-500',
    badge: 'bg-white/70',
    badgeText: 'text-rose-700',
    text: 'text-rose-900',
    muted: 'text-rose-600/60',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
  },
  cuenta: {
    label: 'Cuenta solicitada',
    cardBg: 'bg-sky-50',
    cardBorder: 'border-sky-200',
    dot: 'bg-sky-500',
    badge: 'bg-white/70',
    badgeText: 'text-sky-700',
    text: 'text-sky-900',
    muted: 'text-sky-600/60',
    action: 'Ver orden',
    icon: <ChevronRight className="w-3.5 h-3.5" />,
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

function dividerBorder(cardBorder: string): string {
  return cardBorder.replace('-200', '-100');
}

export function TableCard({
  numero, zona, capacidad, estado, tiempoOcupada,
  ordenEstado, comensales, onClick,
}: TableCardProps) {
  const cfg = getCfg(estado, ordenEstado);

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border ${cfg.cardBg} ${cfg.cardBorder} transition-all duration-300
                 hover:shadow-md active:shadow-sm active:scale-[0.98] text-left w-full shadow-sm`}
    >
      <div className="p-4 flex flex-col items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-medium ${cfg.badgeText}`}>{cfg.label}</span>
        </div>

        <span className={`text-2xl font-bold ${cfg.text}`}>Mesa {numero}</span>

        <div className={`flex items-center gap-3 text-xs ${cfg.muted}`}>
          {zona && (
            <span className="capitalize">{zona.replace('_', ' ')}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {capacidad}
          </span>
        </div>

        {comensales != null && (
          <span className={`text-xs ${cfg.muted} tabular-nums`}>
            {comensales} comensal{comensales !== 1 ? 'es' : ''}
          </span>
        )}

        {tiempoOcupada && (
          <span className={`text-xs font-medium ${cfg.muted} tabular-nums flex items-center gap-1 mt-0.5`}>
            <Clock className="w-3 h-3" />
            {tiempoOcupada}
          </span>
        )}

        <div className={`w-full pt-2.5 mt-1 border-t ${dividerBorder(cfg.cardBorder)}`}>
          <span className={`flex items-center justify-center gap-1 text-xs font-medium ${cfg.badgeText}`}>
            {cfg.icon}
            {cfg.action}
          </span>
        </div>
      </div>
    </button>
  );
}
