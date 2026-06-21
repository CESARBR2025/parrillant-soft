'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ItemAgregar {
  producto_id: number;
  cantidad: number;
  notas?: string;
  tipo: 'alimento' | 'bebida' | 'combo';
  precio_unitario: number;
}

export async function agregarItemsOrden(
  orden_id: number,
  items: ItemAgregar[],
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  if (items.length === 0) {
    return { error: 'Debes agregar al menos un ítem' };
  }

  const { data: orden } = await supabase
    .from('ordenes')
    .select('id, estado, mesero_id')
    .eq('id', orden_id)
    .single();

  if (!orden) {
    return { error: 'Orden no encontrada' };
  }

  if (orden.estado === 'listo' || orden.estado === 'entregado') {
    const { error: updateError } = await supabase
      .from('ordenes')
      .update({ estado: 'en_preparacion', updated_at: new Date().toISOString() })
      .eq('id', orden_id);

    if (updateError) {
      return { error: 'No se pudo reactivar la orden. Intenta de nuevo.' };
    }
  } else if (orden.estado !== 'pendiente' && orden.estado !== 'en_preparacion') {
    return { error: 'Solo puedes agregar ítems a órdenes pendientes o en preparación' };
  }

  // Get the next ronda number
  const { data: maxRonda } = await supabase
    .from('detalles_orden')
    .select('ronda')
    .eq('orden_id', orden_id)
    .order('ronda', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextRonda = (maxRonda?.ronda ?? 0) + 1;

  const detalles = items.map(item => ({
    orden_id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    notas: item.notas ?? null,
    tipo: item.tipo,
    precio_unitario: item.precio_unitario,
    ronda: nextRonda,
    servido: false,
  }));

  const { error } = await supabase
    .from('detalles_orden')
    .insert(detalles);

  if (error) {
    return { error: error.message };
  }

  // Reset serve flags for tipos being added
  const tipos = new Set(items.map(i => i.tipo));
  if (tipos.has('alimento')) {
    await supabase.from('ordenes').update({ alimentos_servidos: false }).eq('id', orden_id);
  }
  if (tipos.has('bebida')) {
    await supabase.from('ordenes').update({ bebidas_servidos: false }).eq('id', orden_id);
  }

  // Si la orden estaba en pendiente (ABIERTA), transicionar a en_preparacion
  if (orden.estado === 'pendiente') {
    await supabase
      .from('ordenes')
      .update({ estado: 'en_preparacion' })
      .eq('id', orden_id);
  }

  revalidatePath('/mesero');

  return { success: true };
}
