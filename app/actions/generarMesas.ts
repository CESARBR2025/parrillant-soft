'use server';

import { revalidatePath } from 'next/cache';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { authorize } from '@/lib/auth';

export async function generarMesas(
  cantidad: number,
  desde: number,
  capacidad: number,
  zona: string | null,
) {
  const auth = await authorize('sucursal.mesas.administrar');
  if (!auth.authorized) return { error: auth.error };

  const sucursalId = await getServerSucursalId();
  const slug = await getServerSucursalSlug();
  if (!sucursalId || !slug) return { error: 'Sucursal no encontrada' };
  if (cantidad < 1) return { error: 'Cantidad debe ser al menos 1' };
  if (capacidad < 1) return { error: 'Capacidad debe ser al menos 1' };

  const mesas = Array.from({ length: cantidad }, (_, i) => ({
    numero: desde + i,
    capacidad,
    zona,
    sucursal_id: sucursalId,
  }));

  const { error } = await (auth.supabase as any).from('mesas').insert(mesas);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/mesas`);

  return { success: true, creadas: cantidad };
}
