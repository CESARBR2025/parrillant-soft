'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug } from '@/lib/sucursal';

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

  // Check all sub-orders are also entregado
  const { data: subs } = await supabase
    .from('ordenes')
    .select('id, estado')
    .eq('orden_padre_id', orden_id);

  const subsPendientes = (subs ?? []).filter(s => s.estado !== 'entregado');
  if (subsPendientes.length > 0) {
    return { error: 'Hay pedidos adicionales pendientes por servir' };
  }

  // Mark parent as cuenta_solicitada
  const { error: parentError } = await supabase
    .from('ordenes')
    .update({ estado: 'cuenta_solicitada' })
    .eq('id', orden_id);

  if (parentError) {
    return { error: parentError.message };
  }

  // Mark all sub-orders as cuenta_solicitada
  if ((subs ?? []).length > 0) {
    await supabase
      .from('ordenes')
      .update({ estado: 'cuenta_solicitada' })
      .eq('orden_padre_id', orden_id);
  }

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/mesero`);
  revalidatePath(`/${slug}/caja`);

  return { success: true };
}
