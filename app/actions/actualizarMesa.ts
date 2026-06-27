'use server';

import { revalidatePath } from 'next/cache';
import { getServerSucursalSlug } from '@/lib/sucursal';
import { authorize } from '@/lib/auth';

export async function actualizarMesa(
  id: number,
  data: { numero?: number; capacidad?: number; zona?: string | null },
) {
  const auth = await authorize('sucursal.mesas.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const { error } = await (auth.supabase.from('mesas') as any)
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/mesas`);
  return { success: true };
}

type EstadoMesa = 'disponible' | 'ocupada' | 'reservada' | 'fuera_de_servicio';

export async function cambiarEstadoMesa(id: number, estado: EstadoMesa) {
  const auth = await authorize('sucursal.mesas.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const { error } = await (auth.supabase.from('mesas') as any)
    .update({ estado })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/mesas`);
  return { success: true };
}

export async function eliminarMesa(id: number) {
  const auth = await authorize('sucursal.mesas.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const { error } = await (auth.supabase.from('mesas') as any)
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/mesas`);
  return { success: true };
}
