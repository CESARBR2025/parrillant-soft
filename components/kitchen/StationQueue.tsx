'use client';

import { useTransition } from 'react';
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
  const [isPending, startTransition] = useTransition();

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

  function handleMarkReady(ordenId: number) {
    startTransition(async () => {
      const res = await marcarOrdenLista(ordenId);
      if (res.error) {
        toast.error(res.error);
      }
      onRefetch();
    });
  }

  return (
    <div className="space-y-3">
      {queue.map((order) => (
        <StationTicket
          key={order.id}
          order={order}
          onMarkReady={handleMarkReady}
          isPending={isPending}
          esSubOrden={order.esSubOrden}
        />
      ))}
    </div>
  );
}
