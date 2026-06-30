'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { marcarOrdenLista } from '@/app/actions/marcarOrdenLista';
import { Spinner } from '@/components/ui/Spinner';
import { StationTicket } from './StationTicket';
import type { QueueItem } from '@/hooks/useKitchenOrders';
import { CookingPot, Wine } from 'lucide-react';

interface StationQueueProps {
  queue: QueueItem[];
  loading: boolean;
  tipo: 'alimento' | 'bebida';
  onRefetch: () => void;
}

export function StationQueue({ queue, loading, tipo, onRefetch }: StationQueueProps) {
  const [pendingId, setPendingId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (queue.length === 0) {
    const Icon = tipo === 'alimento' ? CookingPot : Wine;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Icon className="w-16 h-16 text-muted mb-4" />
        <p className="text-lg text-muted">
          No hay órdenes de {tipo === 'alimento' ? 'cocina' : 'barra'} pendientes
        </p>
      </div>
    );
  }

  async function handleMarkReady(ordenId: number) {
    setPendingId(ordenId);
    try {
      const res = await marcarOrdenLista(ordenId);
      if (res.error) toast.error(res.error);
    } catch {
      toast.error('Error de red al marcar orden');
    } finally {
      setPendingId(null);
    }
    onRefetch();
  }

  return (
    <div className="space-y-3">
      {queue.map((order) => (
        <StationTicket
          key={order.id}
          order={order}
          onMarkReady={handleMarkReady}
          isPending={pendingId === order.id}
          esSubOrden={order.esSubOrden}
        />
      ))}
    </div>
  );
}
