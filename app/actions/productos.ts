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

export async function crearProducto(
  sucursalId: string,
  data: {
    categoria_id: number;
    nombre: string;
    precio: number;
    tipo: string;
    descripcion?: string | null;
  }
) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? 'Error' };

  if (data.precio < 0) return { error: 'El precio no puede ser negativo' };
  if (!data.nombre.trim()) return { error: 'El nombre es obligatorio' };

  const { data: nuevo, error } = await (auth.supabase as any)
    .from('productos_menu')
    .insert({
      sucursal_id: sucursalId,
      categoria_id: data.categoria_id,
      nombre: data.nombre.trim(),
      precio: data.precio,
      tipo: data.tipo,
      descripcion: data.descripcion ?? null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/menu`);
  return { success: true, productoId: nuevo?.id as number };
}

export async function editarProducto(
  id: number,
  data: {
    nombre?: string;
    precio?: number;
    tipo?: string;
    descripcion?: string | null;
    categoria_id?: number;
    disponible?: boolean;
  }
) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? 'Error' };

  if (data.precio !== undefined && data.precio < 0) {
    return { error: 'El precio no puede ser negativo' };
  }

  const { error } = await (auth.supabase as any)
    .from('productos_menu')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/menu`);
  return { success: true };
}

export async function eliminarProducto(id: number) {
  const auth = await authorizeAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? 'Error' };

  const { data: producto } = await (auth.supabase as any)
    .from('productos_menu')
    .select('imagen_url')
    .eq('id', id)
    .single();

  const url: string | null = producto?.imagen_url ?? null;

  if (url) {
    const segments = url.split('/');
    const path = segments.slice(-2).join('/');
    await (auth.supabase.storage as any)
      .from('menu-imagenes')
      .remove([path]);
  }

  const { error } = await (auth.supabase as any)
    .from('productos_menu')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/${auth.slug}/admin/menu`);
  return { success: true };
}
