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

  const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/mesero';
  redirect(rutaInicio);
}
