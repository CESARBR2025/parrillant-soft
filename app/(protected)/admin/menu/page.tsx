import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MenuClient } from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function GlobalMenuPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || perfil.rol !== 'super_admin') {
    redirect('/admin');
  }

  const sucursalesRaw = await supabase
    .from('sucursales')
    .select('id, slug, nombre, activa')
    .order('nombre');
  const sucursales: { id: string; slug: string; nombre: string; activa: boolean }[] = sucursalesRaw.data ?? [];

  const categoriasCount: Record<string, number> = {};
  for (const s of sucursales) {
    const { count } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true })
      .eq('sucursal_id', s.id);
    categoriasCount[s.id] = count ?? 0;
  }

  if (sucursales.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Menú</h1>
        <p className="text-muted">No hay sucursales registradas.</p>
      </div>
    );
  }

  if (sucursales.length === 1) {
    redirect(`/${sucursales[0].slug}/admin/menu`);
  }

  return (
    <MenuClient initialSucursales={sucursales} categoriasCount={categoriasCount} />
  );
}
