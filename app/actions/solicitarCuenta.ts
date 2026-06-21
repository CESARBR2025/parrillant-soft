'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function solicitarCuenta(orden_id: number) {
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

  if (orden.estado !== 'entregado') {
    return { error: 'Solo puedes solicitar cuenta cuando la orden ha sido servida' };
  }

  const { error } = await supabase
    .from('ordenes')
    .update({ estado: 'cuenta_solicitada' })
    .eq('id', orden_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/mesero');
  revalidatePath('/caja');

  return { success: true };
}
