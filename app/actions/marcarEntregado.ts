'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function marcarEntregado(orden_id: number) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  const { data: orden } = await supabase
    .from('ordenes')
    .select('id, estado, mesero_id')
    .eq('id', orden_id)
    .single();

  if (!orden) {
    return { error: 'Orden no encontrada' };
  }

  if (orden.mesero_id !== user.id) {
    return { error: 'No autorizado para modificar esta orden' };
  }

  if (orden.estado !== 'listo') {
    return { error: 'Solo puedes marcar como entregado cuando todos los ítems están listos' };
  }

  const { error } = await supabase
    .from('ordenes')
    .update({ estado: 'entregado' })
    .eq('id', orden_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/mesero');

  return { success: true };
}
