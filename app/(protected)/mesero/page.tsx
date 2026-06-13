// src/app/(protected)/mesero/page.tsx
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Rol } from '@/types/roles';
import OrderCard from '@/components/orders/OrderCard';

// Este componente corre SOLO en el servidor
// Nunca expone datos sensibles al cliente
export default async function MeseroPage() {
    const supabase = await createServerSupabaseClient();

    // 1. Verificar sesión (el middleware ya lo hizo, pero doble verificación en Server Component es buena práctica)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 2. Obtener perfil y validar rol
    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, rol, nombre')
        .eq('id', user.id)
        .single();

    if (perfilError || !perfil || !['mesero', 'admin', 'super_admin'].includes(perfil.rol)) {
        redirect('/login?error=acceso_denegado');
    }

    // 3. Obtener órdenes activas del mesero (RLS filtra automáticamente)
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
        productos_menu (nombre, precio)
      )
    `)
        .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado'])
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-gray-50 p-4">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Panel de Mesero
                    </h1>
                    <p className="text-sm text-gray-500">
                        Bienvenido, {perfil.nombre}
                    </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    {perfil.rol}
                </span>
            </header>

            {ordenesError && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
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
                    <p className="col-span-full py-12 text-center text-gray-400">
                        No tienes órdenes activas
                    </p>
                )}
            </section>
        </main>
    );
}