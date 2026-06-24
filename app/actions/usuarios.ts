'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalSlug, getServerSucursalId } from '@/lib/sucursal';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function authorizeSuperAdmin() {
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

async function authorizeAdmin() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) return null;
  return supabase;
}

export async function crearUsuario(data: {
  email: string;
  password: string;
  nombre: string;
  rol: string;
  sucursales?: string[];
}) {
  const auth = await authorizeSuperAdmin();
  if (!auth) return { error: 'No autorizado' };

  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { nombre: data.nombre },
  });

  if (error) return { error: error.message };

  const { error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .upsert({
      id: user.user.id,
      nombre: data.nombre,
      rol: data.rol,
      activo: true,
    }, { onConflict: 'id' });

  if (perfilError) return { error: perfilError.message };

  if (data.sucursales && data.sucursales.length > 0) {
    const asignaciones = data.sucursales.map(sid => ({
      usuario_id: user.user.id,
      sucursal_id: sid,
    }));

    const { error: asigError } = await supabaseAdmin
      .from('usuario_sucursales')
      .insert(asignaciones);

    if (asigError) return { error: asigError.message };
  }

  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function actualizarUsuario(id: string, data: { nombre?: string; rol?: string }) {
  const auth = await authorizeSuperAdmin();
  if (!auth) return { error: 'No autorizado' };

  const { error } = await supabaseAdmin
    .from('perfiles')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function toggleActivoUsuario(id: string) {
  const auth = await authorizeSuperAdmin();
  if (!auth) return { error: 'No autorizado' };

  const { data: perfil } = await supabaseAdmin
    .from('perfiles')
    .select('activo')
    .eq('id', id)
    .single();

  if (!perfil) return { error: 'Usuario no encontrado' };

  const { error } = await supabaseAdmin
    .from('perfiles')
    .update({ activo: !perfil.activo })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  return { success: true, activo: !perfil.activo };
}

export async function eliminarUsuario(id: string) {
  const auth = await authorizeSuperAdmin();
  if (!auth) return { error: 'No autorizado' };

  const { data: perfil } = await auth
    .from('perfiles')
    .select('activo')
    .eq('id', id)
    .single();

  if (!perfil) return { error: 'Usuario no encontrado' };
  if (perfil.activo) return { error: 'Solo puedes eliminar usuarios inactivos' };

  await supabaseAdmin
    .from('usuario_sucursales')
    .delete()
    .eq('usuario_id', id);

  const { error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .delete()
    .eq('id', id);

  if (perfilError) return { error: perfilError.message };

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) return { error: authError.message };

  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function asignarSucursal(usuarioId: string, sucursalId: string) {
  const auth = await authorizeAdmin();
  if (!auth) return { error: 'No autorizado' };

  const { error } = await supabaseAdmin
    .from('usuario_sucursales')
    .insert({ usuario_id: usuarioId, sucursal_id: sucursalId });

  if (error) return { error: error.message };

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/admin/usuarios`);
  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function removerSucursal(usuarioId: string, sucursalId: string) {
  const auth = await authorizeAdmin();
  if (!auth) return { error: 'No autorizado' };

  const { error } = await supabaseAdmin
    .from('usuario_sucursales')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('sucursal_id', sucursalId);

  if (error) return { error: error.message };

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/admin/usuarios`);
  revalidatePath('/admin/usuarios');
  return { success: true };
}
