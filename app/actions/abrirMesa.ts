'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { verificarTurnoActivo } from '@/lib/turno';

export async function abrirMesa(mesa_id: number, comensales: number) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  if (comensales < 1) {
    return { error: 'Debe haber al menos 1 comensal' };
  }

  const sucursalId = await getServerSucursalId();
  if (sucursalId) {
    const { error: turnoError } = await verificarTurnoActivo(sucursalId);
    if (turnoError) return { error: turnoError };
  }

  await (supabase
    .from('mesas') as any)
    .update({ estado: 'ocupada' })
    .eq('id', mesa_id);

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/mesero`);

  return { success: true };
}
