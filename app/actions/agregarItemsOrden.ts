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

  // Verificar que la orden existe y está pendiente
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

  if (orden.estado !== 'pendiente' && orden.estado !== 'en_preparacion') {
    return { error: 'Solo puedes agregar ítems a órdenes pendientes o en preparación' };
  }

  const detalles = items.map(item => ({
    orden_id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    notas: item.notas ?? null,
    tipo: item.tipo,
    precio_unitario: item.precio_unitario,
  }));

  const { error } = await supabase
    .from('detalles_orden')
    .insert(detalles);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/mesero');

  return { success: true };
}
