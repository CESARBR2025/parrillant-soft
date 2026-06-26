'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug } from '@/lib/sucursal';

async function authorizeAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado', supabase: null as any, slug: null };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) {
    return { error: 'No tienes permiso', supabase: null, slug: null };
  }

  const slug = await getServerSucursalSlug();
  return { error: null, supabase, slug };
}

export async function crearCategoria(
  sucursalId: string,
  nombre: string,
  tipo: string,
  descripcion?: string | null
) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? 'Error' };

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

  revalidatePath(`/${auth.slug}/admin/menu`);
  return { success: true };
}

export async function editarCategoria(
  id: number,
  data: { nombre?: string; tipo?: string; descripcion?: string | null; orden?: number }
) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? 'Error' };

  const { error } = await (auth.supabase as any)
    .from('categorias')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/menu`);
  return { success: true };
}

export async function eliminarCategoria(id: number) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? 'Error' };

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

  revalidatePath(`/${auth.slug}/admin/menu`);
  return { success: true };
}
