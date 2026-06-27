import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RUTA_INICIO_POR_ROL } from '@/types/roles';
import type { Rol, KnownRol } from '@/types/roles';

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil) {
    redirect('/login');
  }

  const rol = perfil.rol as Rol;

  if (rol === 'super_admin') {
    redirect('/admin');
  }

  if (rol === 'admin') {
    const userSucRaw = await (supabase as any)
      .from('usuario_sucursales')
      .select('sucursales!inner(slug)')
      .eq('usuario_id', user.id)
      .limit(1)
      .single();
    const userSuc = userSucRaw.data as { sucursales: { slug: string } } | null;
    const slug = userSuc?.sucursales?.slug;
    if (slug) {
      redirect(`/${slug}/admin`);
    }
    redirect('/login');
  }

  const userSucursalesRaw = await (supabase as any)
    .from('usuario_sucursales')
    .select('sucursales!inner(slug)')
    .eq('usuario_id', user.id)
    .limit(1);
  const userSucursales = userSucursalesRaw.data;

  const slug = (userSucursales?.[0] as unknown as { sucursales: { slug: string } })?.sucursales?.slug;

  if (!slug) {
    redirect('/login');
  }

  const rutaInicio = RUTA_INICIO_POR_ROL[rol as KnownRol] ?? '/mesero';
  redirect(`/${slug}${rutaInicio}`);
}
