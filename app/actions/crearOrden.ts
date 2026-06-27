'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { verificarTurnoActivo } from '@/lib/turno';

interface ItemCrear {
  producto_id: number;
  cantidad: number;
  notas?: string;
  tipo: 'alimento' | 'bebida' | 'combo' | 'postre';
  precio_unitario: number;
}

export async function crearOrden(
  mesa_id: number,
  notas: string | null,
  items: ItemCrear[],
  comensales?: number,
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

  const { error: turnoError } = await verificarTurnoActivo(sucursalId);
  if (turnoError) return { error: turnoError };

  // Crear la orden
  const { data: orden, error: ordenError } = await (supabase as any)
    .from('ordenes')
    .insert({
      mesa_id,
      mesero_id: user.id,
      notas,
      estado: 'en_preparacion',
      comensales: comensales ?? null,
      sucursal_id: sucursalId,
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

  const { error: detallesError } = await (supabase as any)
    .from('detalles_orden')
    .insert(detalles);

  if (detallesError) {
    // Limpiar orden si fallan los detalles
    await (supabase as any).from('ordenes').delete().eq('id', orden.id);
    return { error: detallesError.message };
  }

  // Ocupar la mesa
  await (supabase as any)
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', mesa_id);

  revalidatePath(`/${slug}/mesero`);

  return { success: true, ordenId: orden.id };
}
