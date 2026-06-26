'use client';

import { Store } from 'lucide-react';
import { useSucursal } from '@/components/providers/SucursalProvider';

export function MapaHeader() {
  const sucursal = useSucursal();

  return (
    <div>
      <button
        onClick={() => { window.location.href = `/${sucursal?.slug}/mesero`; }}
        className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1"
      >
        ← Dashboard
      </button>
      <h1 className="text-lg md:text-xl font-bold text-text-primary">Mapa de Mesas</h1>
      {sucursal && (
        <div className="flex items-center gap-1.5 mt-1">
          <Store className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-text-primary">{sucursal.nombre}</span>
        </div>
      )}
    </div>
  );
}
