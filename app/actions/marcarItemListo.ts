'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function marcarItemListo(detalleId: number, listo: boolean = true) {
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
    return { error: 'No tienes permiso para marcar ítems como listos' };
  }

  const { data: detalle } = await supabase
    .from('detalles_orden')
    .select('id, tipo, orden_id')
    .eq('id', detalleId)
    .single();

  if (!detalle) return { error: 'Ítem no encontrado' };

  if (perfil.rol === 'cocina' && detalle.tipo !== 'alimento') {
    return { error: 'Solo puedes marcar alimentos como listos' };
  }
  if (perfil.rol === 'barra' && detalle.tipo !== 'bebida') {
    return { error: 'Solo puedes marcar bebidas como listas' };
  }

  const { error } = await supabase
    .from('detalles_orden')
    .update({ listo })
    .eq('id', detalleId);

  if (error) return { error: error.message };

  revalidatePath('/cocina');
  revalidatePath('/barra');
  revalidatePath('/mesero');

  return { success: true };
}
