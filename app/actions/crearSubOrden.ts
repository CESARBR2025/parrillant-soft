'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';

interface ItemSub {
  producto_id: number;
  cantidad: number;
  notas?: string;
  tipo: 'alimento' | 'bebida' | 'combo';
  precio_unitario: number;
}

export async function crearSubOrden(
  orden_padre_id: number,
  items: ItemSub[],
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  if (items.length === 0) {
    return { error: 'La orden debe tener al menos un ítem' };
  }

  const sucursalId = await getServerSucursalId();
  const slug = await getServerSucursalSlug();
  if (!sucursalId || !slug) return { error: 'Sucursal no encontrada' };

  const { data: padre } = await supabase
    .from('ordenes')
    .select('id, mesa_id, estado')
    .eq('id', orden_padre_id)
    .single();

  if (!padre) {
    return { error: 'Orden principal no encontrada' };
  }

  if (padre.estado === 'cerrado' || padre.estado === 'cancelado') {
    return { error: 'La orden principal ya está cerrada' };
  }

  const { data: orden, error: ordenError } = await supabase
    .from('ordenes')
    .insert({
      mesa_id: padre.mesa_id,
      mesero_id: user.id,
      estado: 'en_preparacion',
      orden_padre_id,
      sucursal_id: sucursalId,
    })
    .select()
    .single();

  if (ordenError || !orden) {
    return { error: ordenError?.message ?? 'Error al crear la sub-orden' };
  }

  const detalles = items.map(item => ({
    orden_id: orden.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    notas: item.notas ?? null,
    tipo: item.tipo,
    precio_unitario: item.precio_unitario,
  }));

  const { error: detallesError } = await (supabase as any)
    .from('detalles_orden')
    .insert(detalles);

  if (detallesError) {
    await supabase.from('ordenes').delete().eq('id', orden.id);
    return { error: detallesError.message };
  }

  revalidatePath(`/${slug}/mesero`);

  return { success: true, ordenId: orden.id };
}
