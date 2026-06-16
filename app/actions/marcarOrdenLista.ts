'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function marcarOrdenLista(ordenId: number) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil) return { error: 'Perfil no encontrado' };

  const rolesPermitidos = ['cocina', 'barra', 'admin', 'super_admin'];
  if (!rolesPermitidos.includes(perfil.rol)) {
    return { error: 'No tienes permiso para marcar órdenes como listas' };
  }

  const { data: orden } = await supabase
    .from('ordenes')
    .select('id, estado')
    .eq('id', ordenId)
    .single();

  if (!orden) return { error: 'Orden no encontrada' };

  if (orden.estado !== 'en_preparacion') {
    return { error: 'Solo puedes marcar como lista una orden en preparación' };
  }

  // Marcar como listos los items de la estación correspondiente
  const tipoEstacion = perfil.rol === 'cocina' ? 'alimento'
    : perfil.rol === 'barra' ? 'bebida'
    : null;

  const updateFilters: Record<string, unknown> = { orden_id: ordenId };
  if (tipoEstacion) {
    updateFilters.tipo = tipoEstacion;
  }

  const { error: detallesError } = await supabase
    .from('detalles_orden')
    .update({ listo: true })
    .match(updateFilters);

  if (detallesError) return { error: detallesError.message };

  // Verificar si TODOS los items de la orden están listos
  const { data: pendientes } = await supabase
    .from('detalles_orden')
    .select('id')
    .eq('orden_id', ordenId)
    .eq('listo', false);

  // Solo marcar la orden como listo si no quedan items pendientes
  const hayPendientes = (pendientes ?? []).length > 0;
  if (!hayPendientes || !tipoEstacion) {
    const { error } = await supabase
      .from('ordenes')
      .update({ estado: 'listo' })
      .eq('id', ordenId);

    if (error) return { error: error.message };
  }

  revalidatePath('/cocina');
  revalidatePath('/barra');
  revalidatePath('/mesero');

  return { success: true };
}
