'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug } from '@/lib/sucursal';

export async function marcarEntregado(orden_id: number) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  const ordenRaw = await (supabase as any)
    .from('ordenes')
    .select('id, estado, mesero_id')
    .eq('id', orden_id)
    .single();
  const orden = ordenRaw.data as { id: number; estado: string; mesero_id: string } | null;

  if (!orden) {
    return { error: 'Orden no encontrada' };
  }

  if (orden.mesero_id !== user.id) {
    return { error: 'No autorizado para modificar esta orden' };
  }

  if (orden.estado !== 'listo') {
    return { error: 'Solo puedes marcar como entregado cuando todos los ítems están listos' };
  }

  const { error } = await (supabase as any)
    .from('ordenes')
    .update({ estado: 'entregado' })
    .eq('id', orden_id);

  if (error) {
    return { error: error.message };
  }

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/mesero`);

  return { success: true };
}
