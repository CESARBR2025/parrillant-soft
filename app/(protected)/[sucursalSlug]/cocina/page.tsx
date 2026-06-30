'use client';

import { CookingPot, Volume2 } from 'lucide-react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { useSound } from '@/hooks/useSound';
import { StationQueue } from '@/components/kitchen/StationQueue';

export default function CocinaPage() {
  const { play } = useSound();
  const { queueOrders, loading, refetch } = useKitchenOrders('alimento', play);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CookingPot className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Cocina</h1>
            <p className="text-sm text-muted">
              {queueOrders.length} orden{queueOrders.length !== 1 ? 'es' : ''} pendiente{queueOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => { console.log('[cocina] Test manual de sonido'); play(); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Test Sonido
        </button>
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
