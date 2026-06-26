'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug } from '@/lib/sucursal';

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

  const ordenRaw = await (supabase as any)
    .from('ordenes')
    .select('id, estado')
    .eq('id', ordenId)
    .single();
  const orden = ordenRaw.data as { id: number; estado: string } | null;

  if (!orden) {
    return { error: 'Orden no encontrada' };
  }

  if (orden.estado !== 'listo') {
    return { error: 'La orden debe estar en "Por recoger" para servir' };
  }

  // Mark items of this tipo (and ronda if specified) as served
  let markQuery = (supabase as any)
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
  const { data: remaining, error: remainingError } = await (supabase as any)
    .from('detalles_orden')
    .select('id')
    .eq('orden_id', ordenId)
    .eq('servido', false);

  if (remainingError) {
    return { error: remainingError.message };
  }

  if (remaining.length === 0) {
    // All served — transition to entregado
    await (supabase as any)
      .from('ordenes')
      .update({ estado: 'entregado', alimentos_servidos: true, bebidas_servidos: true })
      .eq('id', ordenId);
  } else {
    // Update the order-level flag for this tipo
    await (supabase as any)
      .from('ordenes')
      .update(tipo === 'alimento' ? { alimentos_servidos: true } : { bebidas_servidos: true })
      .eq('id', ordenId);
  }

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/mesero`);
  revalidatePath(`/${slug}/barra`);

  return { success: true };
}
