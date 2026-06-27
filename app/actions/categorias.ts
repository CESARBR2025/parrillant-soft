'use server';

import { revalidatePath } from 'next/cache';
import { getServerSucursalSlug } from '@/lib/sucursal';
import { authorize } from '@/lib/auth';

export async function crearCategoria(
  sucursalId: string,
  nombre: string,
  tipo: string,
  descripcion?: string | null
) {
  const auth = await authorize('sucursal.menu.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const maxOrden = await (auth.supabase as any)
    .from('categorias')
    .select('orden')
    .eq('sucursal_id', sucursalId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordenActual = (maxOrden.data as { orden: number } | null)?.orden ?? -1;

  const { error } = await (auth.supabase as any)
    .from('categorias')
    .insert({
      sucursal_id: sucursalId,
      nombre,
      tipo,
      descripcion: descripcion ?? null,
      orden: ordenActual + 1,
    });

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/menu`);
  return { success: true };
}

export async function editarCategoria(
  id: number,
  data: { nombre?: string; tipo?: string; descripcion?: string | null; orden?: number }
) {
  const auth = await authorize('sucursal.menu.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const { error } = await (auth.supabase as any)
    .from('categorias')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/menu`);
  return { success: true };
}

export async function eliminarCategoria(id: number) {
  const auth = await authorize('sucursal.menu.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const productosRaw = await (auth.supabase as any)
    .from('productos_menu')
    .select('id')
    .eq('categoria_id', id)
    .limit(1);
  const productos = productosRaw.data ?? [];

  if (productos.length > 0) {
    return { error: 'No se puede eliminar: la categoría tiene productos asociados' };
  }

  const { error } = await (auth.supabase as any)
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${slug}/admin/menu`);
  return { success: true };
}
