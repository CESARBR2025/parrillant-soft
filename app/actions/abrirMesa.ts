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

  const { data: orden, error } = await supabase
    .from('ordenes')
    .insert({
      mesa_id,
      mesero_id: user.id,
      estado: 'pendiente',
      comensales,
    })
    .select('id')
    .single();

  if (error || !orden) {
    return { error: error?.message ?? 'Error al abrir la mesa' };
  }

  await supabase
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', mesa_id);

  revalidatePath('/mesero');

  return { success: true, ordenId: orden.id };
}
