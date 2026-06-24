'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

async function getSuperAdmin() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.rol !== 'super_admin') return null;

  return supabase;
}

async function clonarMenu(
  supabase: SupabaseClient<Database>,
  origenId: string,
  destinoId: string,
): Promise<string | null> {
  const { data: categorias } = await (supabase as any)
    .from('categorias')
    .select('*')
    .eq('sucursal_id', origenId);

  if (!categorias || categorias.length === 0) return null;

  const categoriaMapping = new Map<number, number>();

  for (const cat of categorias) {
    const { data: nueva, error } = await (supabase as any)
      .from('categorias')
      .insert({
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        orden: cat.orden,
        activa: cat.activa,
        sucursal_id: destinoId,
      })
      .select()
      .single();

    if (error) return `Error al clonar categoría ${cat.nombre}: ${error.message}`;
    if (nueva) categoriaMapping.set(cat.id, nueva.id);
  }

  const { data: productos } = await supabase
    .from('productos_menu')
    .select('*')
    .eq('sucursal_id', origenId);

  if (!productos || productos.length === 0) return null;

  for (const prod of productos) {
    const newCategoriaId = categoriaMapping.get(prod.categoria_id);
    if (!newCategoriaId) continue;

    const { error } = await supabase
      .from('productos_menu')
      .insert({
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: prod.precio,
        tipo: prod.tipo,
        categoria_id: newCategoriaId,
        sucursal_id: destinoId,
        disponible: prod.disponible,
        imagen_url: prod.imagen_url,
      });

    if (error) return `Error al clonar producto ${prod.nombre}: ${error.message}`;
  }

  return null;
}

export async function crearSucursal(data: {
  slug: string;
  nombre: string;
  direccion?: string | null;
  clonarDesdeId?: string | null;
}) {
  const supabase = await getSuperAdmin();
  if (!supabase) return { error: 'No autorizado' };

  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    return { error: 'Slug inválido. Solo minúsculas, números y guiones' };
  }

  const { data: existente } = await supabase
    .from('sucursales')
    .select('id')
    .eq('slug', data.slug)
    .maybeSingle();

  if (existente) {
    return { error: 'Ya existe una sucursal con ese slug' };
  }

  const { data: nueva, error: insertError } = await supabase
    .from('sucursales')
    .insert({
      slug: data.slug,
      nombre: data.nombre,
      direccion: data.direccion ?? null,
      activa: true,
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  if (data.clonarDesdeId) {
    const errorClon = await clonarMenu(supabase, data.clonarDesdeId, nueva.id);
    if (errorClon) return { error: errorClon };
  }

  revalidatePath('/admin/sucursales');
  return { success: true, sucursal: nueva };
}

export async function actualizarSucursal(
  id: string,
  data: { slug?: string; nombre?: string; direccion?: string | null },
) {
  const supabase = await getSuperAdmin();
  if (!supabase) return { error: 'No autorizado' };

  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    return { error: 'Slug inválido' };
  }

  if (data.slug) {
    const { data: existente } = await supabase
      .from('sucursales')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .maybeSingle();

    if (existente) {
      return { error: 'Ya existe otra sucursal con ese slug' };
    }
  }

  const { error } = await supabase
    .from('sucursales')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/sucursales');
  return { success: true };
}

export async function toggleSucursalActiva(id: string, activa: boolean) {
  const supabase = await getSuperAdmin();
  if (!supabase) return { error: 'No autorizado' };

  const { error } = await supabase
    .from('sucursales')
    .update({ activa })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/sucursales');
  return { success: true };
}

export async function eliminarSucursal(id: string) {
  const supabase = await getSuperAdmin();
  if (!supabase) return { error: 'No autorizado' };

  const { count: mesas } = await supabase
    .from('mesas')
    .select('*', { count: 'exact', head: true })
    .eq('sucursal_id', id);

  if (mesas && mesas > 0) {
    return { error: 'No se puede eliminar: la sucursal tiene mesas registradas. Desactívala en su lugar.' };
  }

  const { count: ordenes } = await supabase
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('sucursal_id', id);

  if (ordenes && ordenes > 0) {
    return { error: 'No se puede eliminar: la sucursal tiene órdenes. Desactívala en su lugar.' };
  }

  await supabase.from('usuario_sucursales').delete().eq('sucursal_id', id);

  const { error } = await supabase
    .from('sucursales')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/sucursales');
  return { success: true };
}
