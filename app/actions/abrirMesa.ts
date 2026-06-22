'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function abrirMesa(mesa_id: number, comensales: number) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  if (comensales < 1) {
    return { error: 'Debe haber al menos 1 comensal' };
  }

  await supabase
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', mesa_id);

  revalidatePath('/mesero');

  return { success: true };
}
