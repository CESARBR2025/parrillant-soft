import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreditCard } from 'lucide-react';

export default async function CajaPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: ordenes } = await supabase
        .from('ordenes')
        .select(`
      id,
      estado,
      total,
      created_at,
      mesas (numero, zona),
      mesero_id,
      detalles_orden (
        cantidad, precio_unitario, listo,
        productos_menu (nombre)
      )
    `)
        .in('estado', ['entregado', 'listo'])
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Caja</h1>
                <p className="text-sm text-muted mt-1">Órdenes listas para cobrar</p>
            </div>

            {!ordenes?.length && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CreditCard className="w-12 h-12 text-muted mb-4" />
                    <p className="text-muted">No hay órdenes pendientes de cobro</p>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ordenes?.map(orden => {
                    const total = orden.detalles_orden?.reduce(
                        (acc, d) => acc + (d.cantidad * Number(d.precio_unitario)), 0
                    ) ?? 0;

                    return (
                        <div key={orden.id} className="bg-card rounded-2xl border border-border/60 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="text-lg font-bold text-white">Mesa {orden.mesas?.numero}</span>
                                    {orden.mesas?.zona && (
                                        <span className="text-xs text-muted ml-2">{orden.mesas.zona}</span>
                                    )}
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                    orden.estado === 'entregado'
                                        ? 'bg-purple-900/30 text-purple-400'
                                        : 'bg-green-900/30 text-green-400'
                                }`}>
                                    {orden.estado === 'entregado' ? 'Entregado' : 'Listo'}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-accent">${total.toFixed(2)}</p>
                                <p className="text-xs text-muted mt-1">
                                    {orden.detalles_orden?.length ?? 0} ítems
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}