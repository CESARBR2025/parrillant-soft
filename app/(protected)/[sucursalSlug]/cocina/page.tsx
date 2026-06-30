'use client';

import { CookingPot } from 'lucide-react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { useSound } from '@/hooks/useSound';
import { StationQueue } from '@/components/kitchen/StationQueue';

export default function CocinaPage() {
  const { play } = useSound();
  const { queueOrders, loading, refetch } = useKitchenOrders('alimento', play);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
          <CookingPot className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Cocina</h1>
            <p className="text-sm text-muted">
              {queueOrders.length} orden{queueOrders.length !== 1 ? 'es' : ''} pendiente{queueOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

      <StationQueue
        queue={queueOrders}
        loading={loading}
        tipo="alimento"
        onRefetch={refetch}
      />
    </div>
  );
}
