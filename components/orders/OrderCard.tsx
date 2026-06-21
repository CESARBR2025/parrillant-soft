'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { Rol } from '@/types/roles';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DetalleOrden {
    id: number;
    cantidad: number;
    notas: string | null;
    listo: boolean;
    tipo: string;
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

const ESTADO_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'purple' | 'default' | 'danger'> = {
    pendiente: 'warning',
    en_preparacion: 'info',
    listo: 'success',
    entregado: 'purple',
    cerrado: 'default',
    cancelado: 'danger',
};

const ESTADO_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_preparacion: 'Preparando',
    listo: 'Listo',
    entregado: 'Entregado',
    cerrado: 'Cerrado',
    cancelado: 'Cancelado',
};

export default function OrderCard({ orden, rolUsuario }: OrderCardProps) {
    const [isPending, startTransition] = useTransition();
    const [estadoLocal, setEstadoLocal] = useState(orden.estado);

    const puedeVerPrecio = ['caja', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeCerrarMesa = ['caja', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeCancelar = ['caja', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeMarcarListo = ['cocina', 'barra', 'admin', 'super_admin'].includes(rolUsuario);
    const puedeEnviarCocina = ['mesero', 'admin', 'super_admin'].includes(rolUsuario)
        && estadoLocal === 'pendiente';

    const totalEstimado = orden.detalles_orden.reduce(
        (acc, detalle) => acc + (detalle.productos_menu?.precio ?? 0) * detalle.cantidad,
        0
    );

    async function handleCambiarEstado(nuevoEstado: string) {
        startTransition(async () => {
            const res = await fetch(`/api/ordenes/${orden.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (res.ok) {
                setEstadoLocal(nuevoEstado);
                toast.success(`Orden #${orden.id} actualizada a "${ESTADO_LABEL[nuevoEstado] ?? nuevoEstado}"`);
            } else {
                const data = await res.json();
                toast.error(data.error ?? 'Error al actualizar la orden');
            }
        });
    }

    return (
        <Card padding="none" className="overflow-hidden">
            {/* Encabezado */}
            <div className="flex items-center justify-between bg-bg-base/50 px-5 py-3.5 border-b border-border/40">
                <div>
                    <span className="text-base font-bold text-text-primary">
                        Mesa {orden.mesas?.numero}
                    </span>
                    {orden.mesas?.zona && (
                        <span className="text-xs text-muted ml-2">{orden.mesas.zona}</span>
                    )}
                </div>
                <Badge variant={ESTADO_VARIANT[estadoLocal] ?? 'default'}>
                    {ESTADO_LABEL[estadoLocal] ?? estadoLocal}
                </Badge>
            </div>

            {/* Ítems */}
            <ul className="divide-y divide-border/40 px-5">
                {orden.detalles_orden.map(detalle => (
                    <li key={detalle.id} className="flex items-center gap-3 py-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${detalle.listo ? 'bg-green-500' : 'bg-yellow-400'}`} />
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-body">
                                {detalle.cantidad}x {detalle.productos_menu?.nombre}
                            </p>
                            {detalle.notas && (
                                <p className="truncate text-xs text-muted italic mt-0.5">
                                    {detalle.notas}
                                </p>
                            )}
                        </div>
                        {puedeVerPrecio && detalle.productos_menu && (
                            <span className="text-xs text-muted shrink-0">
                                ${(detalle.productos_menu.precio * detalle.cantidad).toFixed(2)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            {/* Total */}
            {puedeVerPrecio && (
                <div className="border-t border-border/40 px-5 py-3">
                    <div className="flex justify-between text-sm font-semibold">
                        <span className="text-text-primary font-bold">Total estimado</span>
                        <span className="text-text-primary">${totalEstimado.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 px-5 pb-5 pt-2">
                {puedeEnviarCocina && (
                    <button
                        onClick={() => handleCambiarEstado('en_preparacion')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? 'Enviando...' : 'Enviar a Cocina'}
                    </button>
                )}

                {puedeMarcarListo && estadoLocal === 'en_preparacion' && (
                    <button
                        onClick={() => handleCambiarEstado('listo')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        Marcar Listo
                    </button>
                )}

                {rolUsuario === 'mesero' && estadoLocal === 'listo' && (
                    <button
                        onClick={() => handleCambiarEstado('entregado')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        Marcar Entregado
                    </button>
                )}

                {puedeCerrarMesa && estadoLocal === 'entregado' && (
                    <button
                        onClick={() => handleCambiarEstado('cerrado')}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                        Cerrar Mesa
                    </button>
                )}

                {puedeCancelar && !['cerrado', 'cancelado'].includes(estadoLocal) && (
                    <button
                        onClick={() => handleCambiarEstado('cancelado')}
                        disabled={isPending}
                        className="rounded-xl border border-danger/30 px-4 py-2.5 text-sm font-medium text-danger
                       hover:bg-danger/10 disabled:opacity-50 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </Card>
    );
}
