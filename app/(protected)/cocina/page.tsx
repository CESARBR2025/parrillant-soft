import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CookingPot } from 'lucide-react';

export default async function CocinaPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: ordenes } = await supabase
        .from('ordenes')
        .select(`
      id,
      estado,
      notas,
      created_at,
      mesas (numero),
      detalles_orden (
        id, cantidad, notas, listo, tipo,
        productos_menu (nombre)
      )
    `)
        .in('estado', ['pendiente', 'en_preparacion'])
        .order('created_at', { ascending: true });

    const ordenesAlimento = ordenes?.filter(o =>
        o.detalles_orden?.some(d => d.tipo === 'alimento' || !d.tipo)
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Cocina</h1>
                <p className="text-sm text-muted mt-1">Órdenes de alimentos pendientes</p>
            </div>

            {!ordenesAlimento?.length && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CookingPot className="w-12 h-12 text-muted mb-4" />
                    <p className="text-muted">No hay órdenes de cocina pendientes</p>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ordenesAlimento?.map(orden => (
                    <div key={orden.id} className="bg-card rounded-2xl border border-border/60 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-white">Mesa {orden.mesas?.numero}</span>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                orden.estado === 'pendiente'
                                    ? 'bg-yellow-900/30 text-yellow-400'
                                    : 'bg-blue-900/30 text-blue-400'
                            }`}>
                                {orden.estado === 'pendiente' ? 'Pendiente' : 'Preparando'}
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {orden.detalles_orden?.map(d => (
                                <li key={d.id} className="flex items-center gap-2 text-sm">
                                    <span className={`w-1.5 h-1.5 rounded-full ${d.listo ? 'bg-green-500' : 'bg-yellow-400'}`} />
                                    <span className="text-body">{d.cantidad}x {d.productos_menu?.nombre}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}