'use client';

import { Clock } from 'lucide-react';
import type { QueueItem } from '@/hooks/useKitchenOrders';

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const restSecs = secs % 60;
  if (mins < 60) return `${mins}:${restSecs.toString().padStart(2, '0')}`;
  const hrs = Math.floor(mins / 60);
  const restMins = mins % 60;
  return `${hrs}h ${restMins}m`;
}

function getUrgencyCard(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins >= 3) return 'border-l-red-500 bg-red-50/60';
  if (mins >= 1) return 'border-l-yellow-500 bg-yellow-50/60';
  return 'border-l-green-500 bg-green-50/50';
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
      className={`rounded-2xl border-2 border-l-4 border-border/60 shadow-sm
                 transition-shadow duration-200 hover:shadow-md
                 ${getUrgencyCard(order.elapsedMs)}`}
    >
      {/* Header: mesa + time */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${getUrgencyDot(order.elapsedMs)}`} />
          <span className="text-2xl font-bold text-text-primary">MESA {order.mesa_numero}</span>
        </div>
        <span className="inline-flex items-center rounded-full bg-bg-base px-3 py-1 text-xs font-medium text-muted">
          {formatHora(order.created_at)}
        </span>
      </div>

      {/* Items */}
      <ul className="px-5 pb-2 space-y-1">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 py-1"
          >
            <span className="text-sm md:text-base text-body">
              <span className="font-bold text-text-primary">{item.cantidad}x</span>{' '}
              {item.producto_nombre}
            </span>
            {item.notas && (
              <span className="shrink-0 text-xs text-muted italic bg-yellow-500/10 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                {item.notas}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Order-level notes */}
      {order.notas && (
        <div className="mx-5 mb-3 px-3.5 py-2 rounded-lg bg-accent/5 border border-accent/10">
          <p className="text-xs font-medium text-accent">
            <span className="font-semibold">Nota:</span> {order.notas}
          </p>
        </div>
      )}

      {/* Footer: timer + action */}
      <div className="flex items-center justify-between px-5 pb-5 pt-2">
        <div className="flex items-center gap-1.5 text-muted">
          <Clock className="w-4 h-4" />
          <span className={`text-base tabular-nums font-medium ${order.excedeTiempo ? 'text-danger' : 'text-muted'}`}>
            {formatElapsed(order.elapsedMs)}
          </span>
        </div>

        <button
          onClick={() => onMarkReady(order.id)}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-dark
            text-white font-semibold text-base transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Procesando...' : 'Preparando'}
        </button>
      </div>
    </div>
  );
}
