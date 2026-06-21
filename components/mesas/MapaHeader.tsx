'use client';

export function MapaHeader() {
  return (
    <div>
      <button
        onClick={() => { window.location.href = '/mesero'; }}
        className="text-xs md:text-sm text-gray-400 hover:text-gray-700 transition-colors mb-1"
      >
        ← Dashboard
      </button>
      <h1 className="text-lg md:text-xl font-bold text-gray-900">Mapa de Mesas</h1>
    </div>
  );
}
