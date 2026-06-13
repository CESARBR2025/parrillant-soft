// src/components/orders/OrderCard.tsx
'use client';

import { useState, useTransition } from 'react';
import type { Rol } from '@/types/roles';

interface DetalleOrden {
    id: number;
    cantidad: number;
    notas: string | null;
    listo: boolean;
    productos_menu: { nombre: string; precio: number } | null;
}

interface Mesa {
    numero: number;
    zona: string | null;
}

interface Orden {
    id: number;
    estado: string;
    notas: string | null;
    created_at: string;
    mesas: Mesa | null;
    detalles_orden: DetalleOrden[];
}

interface OrderCardProps {
    orden: Orden;
    rolUsuario: Rol;
}

// Colores de estado para badges
const ESTADO_ESTILOS: Record<string, { bg: string; text: string; label: string }> = {
    pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
    en_preparacion: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Preparación' },
    listo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Listo' },
    entregado: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Entregado' },
    cerrado: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cerrado' },
    cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
};

export default function OrderCard({ orden, rolUsuario }: OrderCardProps) {
    const [isPending, startTransition] = useTransition();
    const [estadoLocal, setEstadoLocal] = useState(orden.estado);

    const estiloEstado = ESTADO_ESTILOS[estadoLocal] ?? ESTADO_ESTILOS.pendiente;

    // --- Permisos por rol ---
    const puedeVerPrecio = ['caja', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeCerrarMesa = ['caja', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeCancelar = ['caja', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeMarcarListo = ['cocina', 'barra', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeEnviarCocina = ['mesero', 'admin', 'super_admin'].includes(rolUsuario)
        && estadoLocal === 'pendiente';

    // Total calculado en cliente para mostrar (la fuente de verdad está en el servidor)
    const totalEstimado = orden.detalles_orden.reduce(
        (acc, detalle) => acc + (detalle.productos_menu?.precio ?? 0) * detalle.cantidad,
        0
    );

    async function handleCambiarEstado(nuevoEstado: string) {
        startTransition(async () => {
            // Server Action o API Route para cambiar el estado
            const res = await fetch(`/api/ordenes/${orden.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (res.ok) {
                setEstadoLocal(nuevoEstado);
            }
        });
    }

    return (
        <article className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Encabezado */}
            <div className="flex items-center justify-between rounded-t-2xl bg-gray-50 px-4 py-3">
                <div>
                    <span className="text-lg font-semibold text-gray-900">
                        Mesa {orden.mesas?.numero}
                    </span>
                    {orden.mesas?.zona && (
                        <span className="ml-2 text-xs text-gray-400">{orden.mesas.zona}</span>
                    )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${estiloEstado.bg} ${estiloEstado.text}`}>
                    {estiloEstado.label}
                </span>
            </div>

            {/* Ítems */}
            <ul className="divide-y divide-gray-100 px-4">
                {orden.detalles_orden.map(detalle => (
                    <li key={detalle.id} className="flex items-center gap-3 py-3">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${detalle.listo ? 'bg-green-500' : 'bg-yellow-400'
                            }`} />
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                                {detalle.cantidad}x {detalle.productos_menu?.nombre}
                            </p>
                            {detalle.notas && (
                                <p className="truncate text-xs text-gray-400 italic">
                                    {detalle.notas}
                                </p>
                            )}
                        </div>
                        {/* Precio: solo visible para caja/admin */}
                        {puedeVerPrecio && detalle.productos_menu && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                                ${(detalle.productos_menu.precio * detalle.cantidad).toFixed(2)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            {/* Total: solo para caja/admin */}
            {puedeVerPrecio && (
                <div className="border-t border-gray-100 px-4 py-3">
                    <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-600">Total estimado</span>
                        <span className="text-gray-900">${totalEstimado.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Acciones según rol */}
            <div className="flex flex-wrap gap-2 rounded-b-2xl px-4 pb-4 pt-2">

                {/* Mesero: enviar orden a cocina/barra */}
                {puedeEnviarCocina && (
                    <button
                        onClick={() => handleCambiarEstado('en_preparacion')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? 'Enviando...' : 'Enviar a Cocina'}
                    </button>
                )}

                {/* Cocina/Barra: marcar como listo */}
                {puedeMarcarListo && estadoLocal === 'en_preparacion' && (
                    <button
                        onClick={() => handleCambiarEstado('listo')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        ✓ Marcar Listo
                    </button>
                )}

                {/* Mesero: marcar como entregado */}
                {rolUsuario === 'mesero' && estadoLocal === 'listo' && (
                    <button
                        onClick={() => handleCambiarEstado('entregado')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        Marcar Entregado
                    </button>
                )}

                {/* Caja: cerrar mesa y cobrar — SOLO VISIBLE PARA CAJA/ADMIN */}
                {puedeCerrarMesa && estadoLocal === 'entregado' && (
                    <button
                        onClick={() => handleCambiarEstado('cerrado')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white
                       hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                        💳 Cerrar Mesa
                    </button>
                )}

                {/* Cancelar: solo caja/admin */}
                {puedeCancelar && !['cerrado', 'cancelado'].includes(estadoLocal) && (
                    <button
                        onClick={() => handleCambiarEstado('cancelado')}
                        disabled={isPending}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600
                       hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </article>
    );
}