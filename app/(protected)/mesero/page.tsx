import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Rol } from '@/types/roles';
import OrderCard from '@/components/orders/OrderCard';

export default async function MeseroPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('id, rol, nombre')
        .eq('id', user.id)
        .single();

    if (!perfil || !['mesero', 'admin', 'super_admin'].includes(perfil.rol)) {
        redirect('/login?error=acceso_denegado');
    }

    const { data: ordenes, error: ordenesError } = await supabase
        .from('ordenes')
        .select(`
      id,
      estado,
      notas,
      created_at,
      mesas (numero, zona),
      detalles_orden (
        id,
        cantidad,
        notas,
        listo,
        tipo,
        productos_menu (nombre, precio)
      )
    `)
        .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado'])
        .order('created_at', { ascending: false });

    return (
        <>
            {ordenesError && (
                <div className="rounded-xl bg-red-900/20 border border-red-800/30 p-4 text-sm text-red-400 mb-6">
                    Error al cargar órdenes. Intenta de nuevo.
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ordenes?.map(orden => (
                    <OrderCard
                        key={orden.id}
                        orden={orden}
                        rolUsuario={perfil.rol as Rol}
                    />
                ))}

                {ordenes?.length === 0 && (
                    <p className="col-span-full py-16 text-center text-muted">
                        No tienes órdenes activas
                    </p>
                )}
            </section>
        </>
    );
}