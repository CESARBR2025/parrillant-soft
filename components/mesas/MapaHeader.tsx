'use client';

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
    </div>
  );
}
