'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ItemCrear {
  producto_id: number;
  cantidad: number;
  notas?: string;
  tipo: 'alimento' | 'bebida' | 'combo';
  precio_unitario: number;
}

export async function crearOrden(
  mesa_id: number,
  notas: string | null,
  items: ItemCrear[],
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  if (items.length === 0) {
    return { error: 'La orden debe tener al menos un ítem' };
  }

  // Crear la orden
  const { data: orden, error: ordenError } = await supabase
    .from('ordenes')
    .insert({
      mesa_id,
      mesero_id: user.id,
      notas,
      estado: 'en_preparacion',
    })
    .select()
    .single();

  if (ordenError || !orden) {
    return { error: ordenError?.message ?? 'Error al crear la orden' };
  }

  // Crear los detalles
  const detalles = items.map(item => ({
    orden_id: orden.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    notas: item.notas ?? null,
    tipo: item.tipo,
    precio_unitario: item.precio_unitario,
  }));

  const { error: detallesError } = await supabase
    .from('detalles_orden')
    .insert(detalles);

  if (detallesError) {
    // Limpiar orden si fallan los detalles
    await supabase.from('ordenes').delete().eq('id', orden.id);
    return { error: detallesError.message };
  }

  // Ocupar la mesa
  await supabase
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', mesa_id);

  revalidatePath('/mesero');

  return { success: true, ordenId: orden.id };
}
