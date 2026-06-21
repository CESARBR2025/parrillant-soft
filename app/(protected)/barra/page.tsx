'use client';

import { Wine } from 'lucide-react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { StationQueue } from '@/components/kitchen/StationQueue';

export default function BarraPage() {
  const { queueOrders, loading, refetch } = useKitchenOrders('bebida');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wine className="w-7 h-7 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Barra</h1>
          <p className="text-sm text-muted">
            {queueOrders.length} orden{queueOrders.length !== 1 ? 'es' : ''} pendiente{queueOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <StationQueue
        queue={queueOrders}
        loading={loading}
        tipo="bebida"
        onRefetch={refetch}
      />
    </div>
  );
}
