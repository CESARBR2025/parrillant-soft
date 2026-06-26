'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug } from '@/lib/sucursal';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

async function authorizeAdmin(): Promise<{
  error: string | null;
  supabase: SupabaseClient<Database> | null;
  slug: string | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado', supabase: null, slug: null };

  const perfilRaw = await (supabase
    .from('perfiles') as any)
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) {
    return { error: 'No tienes permiso', supabase: null, slug: null };
  }

  const slug = await getServerSucursalSlug();
  return { error: null, supabase, slug };
}

export async function actualizarMesa(
  id: number,
  data: { numero?: number; capacidad?: number; zona?: string | null },
) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase || !auth.slug) return { error: auth.error ?? 'Error' };

  const { error } = await (auth.supabase
    .from('mesas') as any)
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/mesas`);
  return { success: true };
}

type EstadoMesa = 'disponible' | 'ocupada' | 'reservada' | 'fuera_de_servicio';

export async function cambiarEstadoMesa(id: number, estado: EstadoMesa) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase || !auth.slug) return { error: auth.error ?? 'Error' };

  const { error } = await (auth.supabase
    .from('mesas') as any)
    .update({ estado })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/mesas`);
  return { success: true };
}

export async function eliminarMesa(id: number) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase || !auth.slug) return { error: auth.error ?? 'Error' };

  const { error } = await (auth.supabase
    .from('mesas') as any)
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/mesas`);
  return { success: true };
}
