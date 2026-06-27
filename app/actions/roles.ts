'use server';

import { authorize } from '@/lib/auth';

export async function crearRol(formData: FormData) {
  const auth = await authorize('roles.administrar');
  if (!auth.authorized) return { error: auth.error };

  const nombre = (formData.get('nombre') as string)?.trim().toLowerCase().replace(/\s+/g, '_');
  const etiqueta = (formData.get('etiqueta') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim();
  const nivel = parseInt(formData.get('nivel') as string, 10);

  if (!nombre || !etiqueta || isNaN(nivel)) {
    return { error: 'Nombre, etiqueta y nivel son requeridos' };
  }

  const { error } = await (auth.supabase.from('roles') as any)
    .insert({ nombre, etiqueta, descripcion, nivel });

  if (error) return { error: error.message };
  return { success: true };
}

export async function eliminarRol(nombre: string) {
  const auth = await authorize('roles.administrar');
  if (!auth.authorized) return { error: auth.error };

  const { count } = await auth.supabase
    .from('perfiles')
    .select('*', { count: 'exact', head: true })
    .eq('rol', nombre);

  if (count && count > 0) {
    return { error: `No se puede eliminar: ${count} usuario(s) tienen este rol.` };
  }

  const { error } = await (auth.supabase.from('roles') as any)
    .delete()
    .eq('nombre', nombre);

  if (error) return { error: error.message };
  return { success: true };
}

export async function actualizarRol(nombre: string, formData: FormData) {
  const auth = await authorize('roles.administrar');
  if (!auth.authorized) return { error: auth.error };

  const updates: Record<string, string | number> = {};
  const etiqueta = (formData.get('etiqueta') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim();
  const nivel = formData.get('nivel') as string;

  if (etiqueta) updates.etiqueta = etiqueta;
  if (descripcion !== null) updates.descripcion = descripcion;
  if (nivel) updates.nivel = parseInt(nivel, 10);

  const { error } = await (auth.supabase.from('roles') as any)
    .update(updates)
    .eq('nombre', nombre);

  if (error) return { error: error.message };
  return { success: true };
}
