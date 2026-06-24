import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RUTA_INICIO_POR_ROL } from '@/types/roles';
import type { Rol } from '@/types/roles';

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil) {
    redirect('/login');
  }

  const rol = perfil.rol as Rol;

  if (rol === 'super_admin' || rol === 'admin') {
    redirect('/admin');
  }

  const { data: userSucursales } = await supabase
    .from('usuario_sucursales')
    .select('sucursales!inner(slug)')
    .eq('usuario_id', user.id)
    .limit(1);

  const slug = (userSucursales?.[0] as unknown as { sucursales: { slug: string } })?.sucursales?.slug;

  if (!slug) {
    redirect('/login');
  }

  const rutaInicio = RUTA_INICIO_POR_ROL[rol] ?? '/mesero';
  redirect(`/${slug}${rutaInicio}`);
}
