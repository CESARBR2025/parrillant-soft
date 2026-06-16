'use client';

import { Clock } from 'lucide-react';
import type { QueueItem } from '@/hooks/useKitchenOrders';

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `Hace ${secs}s`;
  const mins = Math.floor(secs / 60);
  const restSecs = secs % 60;
  if (mins < 60) return `Hace ${mins}:${restSecs.toString().padStart(2, '0')}`;
  const hrs = Math.floor(mins / 60);
  const restMins = mins % 60;
  return `Hace ${hrs}h ${restMins}m`;
}

function getColorClass(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins >= 3) return 'border-l-red-500 bg-red-500/5';
  if (mins >= 1) return 'border-l-yellow-500 bg-yellow-500/5';
  return 'border-l-green-500 bg-green-500/5';
}

function getUrgencyDot(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins >= 3) return 'bg-red-500';
  if (mins >= 1) return 'bg-yellow-500';
  return 'bg-green-500';
}

interface StationTicketProps {
  order: QueueItem;
  onMarkReady: (ordenId: number) => void;
  isPending: boolean;
}

export function StationTicket({ order, onMarkReady, isPending }: StationTicketProps) {
  return (
    <div
      className={`bg-card rounded-xl border border-border/40 border-l-4 ${getColorClass(order.elapsedMs)} overflow-hidden`}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${getUrgencyDot(order.elapsedMs)}`} />
          <span className="text-2xl font-bold text-white">MESA {order.mesa_numero}</span>
        </div>
        <span className="text-lg text-muted font-mono tabular-nums">
          {formatHora(order.created_at)}
        </span>
      </div>

      <ul className="px-5 pb-3 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="text-lg text-body">
              {item.cantidad} {item.producto_nombre}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between px-5 pb-5">
        <div className="flex items-center gap-1.5 text-muted">
          <Clock className="w-4 h-4" />
          <span className="text-base tabular-nums">{formatElapsed(order.elapsedMs)}</span>
        </div>

        <button
          onClick={() => onMarkReady(order.id)}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover
            text-white font-semibold text-base transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Procesando...' : 'Preparando'}
        </button>
      </div>
    </div>
  );
}
