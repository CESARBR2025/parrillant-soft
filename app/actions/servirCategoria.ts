'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function servirCategoria(
  ordenId: number,
  tipo: 'alimento' | 'bebida',
  ronda?: number,
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  const { data: orden } = await supabase
    .from('ordenes')
    .select('id, estado')
    .eq('id', ordenId)
    .single();

  if (!orden) {
    return { error: 'Orden no encontrada' };
  }

  if (orden.estado !== 'listo') {
    return { error: 'La orden debe estar en "Por recoger" para servir' };
  }

  // Mark items of this tipo (and ronda if specified) as served
  let markQuery = supabase
    .from('detalles_orden')
    .update({ servido: true })
    .eq('orden_id', ordenId)
    .eq('tipo', tipo)
    .eq('servido', false);

  if (ronda !== undefined) {
    markQuery = markQuery.eq('ronda', ronda);
  }

  const { error: markError } = await markQuery;

  if (markError) {
    return { error: markError.message };
  }

  // Check if all items in the order are served
  const { data: remaining, error: remainingError } = await supabase
    .from('detalles_orden')
    .select('id')
    .eq('orden_id', ordenId)
    .eq('servido', false);

  if (remainingError) {
    return { error: remainingError.message };
  }

  if (remaining.length === 0) {
    // All served — transition to entregado
    await supabase
      .from('ordenes')
      .update({ estado: 'entregado', alimentos_servidos: true, bebidas_servidos: true })
      .eq('id', ordenId);
  } else {
    // Update the order-level flag for this tipo
    await supabase
      .from('ordenes')
      .update(tipo === 'alimento' ? { alimentos_servidos: true } : { bebidas_servidos: true })
      .eq('id', ordenId);
  }

  revalidatePath('/mesero');
  revalidatePath('/barra');

  return { success: true };
}
