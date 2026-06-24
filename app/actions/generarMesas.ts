'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';

export async function generarMesas(
  cantidad: number,
  desde: number,
  capacidad: number,
  zona: string | null,
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) {
    return { error: 'No tienes permiso para generar mesas' };
  }

  const sucursalId = await getServerSucursalId();
  const slug = await getServerSucursalSlug();
  if (!sucursalId || !slug) return { error: 'Sucursal no encontrada' };
  if (cantidad < 1) return { error: 'Cantidad debe ser al menos 1' };
  if (capacidad < 1) return { error: 'Capacidad debe ser al menos 1' };

  const mesas = Array.from({ length: cantidad }, (_, i) => ({
    numero: desde + i,
    capacidad,
    zona,
    sucursal_id: sucursalId,
  }));

  const { error } = await supabase.from('mesas').insert(mesas);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/mesas`);

  return { success: true, creadas: cantidad };
}
