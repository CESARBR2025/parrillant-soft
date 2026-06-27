'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug } from '@/lib/sucursal';

export async function marcarItemListo(detalleId: number, listo: boolean = true) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: puedeCocina } = await (supabase as any).rpc('tiene_permiso', { permiso_codigo: 'ordenes.cocina' });
  const { data: puedeBarra } = await (supabase as any).rpc('tiene_permiso', { permiso_codigo: 'ordenes.barra' });
  if (!puedeCocina && !puedeBarra) {
    return { error: 'No tienes permiso para marcar ítems como listos' };
  }

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil) return { error: 'Perfil no encontrado' };

  const { data: detalle } = await (supabase as any)
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

  const { error } = await (supabase as any)
    .from('detalles_orden')
    .update({ listo })
    .eq('id', detalleId);

  if (error) return { error: error.message };

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/cocina`);
  revalidatePath(`/${slug}/barra`);
  revalidatePath(`/${slug}/mesero`);

  return { success: true };
}
