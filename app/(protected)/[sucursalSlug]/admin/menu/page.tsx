import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId } from '@/lib/sucursal';
import { AdminMenuClient } from './AdminMenuClient';
import type { Tables } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function AdminMenuPage({
  params,
}: {
  params: Promise<{ sucursalSlug: string }>;
}) {
  const { sucursalSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) {
    redirect(`/${sucursalSlug}/admin`);
  }

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect(`/${sucursalSlug}/admin`);

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .order('orden', { ascending: true });

  const { data: productos } = await supabase
    .from('productos_menu')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .order('nombre', { ascending: true });

  const totalProductos = productos?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/${sucursalSlug}/admin`}
          className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
        >
          ← Panel de Administración
        </a>
        <h1 className="text-xl font-bold text-text-primary">Menú</h1>
        <p className="text-sm text-muted mt-1">{totalProductos} productos en {categorias?.length ?? 0} categorías</p>
      </div>
      <AdminMenuClient
        categorias={(categorias ?? []) as Tables<'categorias'>[]}
        productos={(productos ?? []) as Tables<'productos_menu'>[]}
        sucursalId={sucursalId}
      />
    </div>
  );
}
