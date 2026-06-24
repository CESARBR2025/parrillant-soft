'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function crearSuperAdmin(email: string, password: string, nombre: string) {
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (error) return { error: error.message };

  const { error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .insert({
      id: user.user.id,
      nombre,
      rol: 'super_admin',
      activo: true,
    });

  if (perfilError) return { error: perfilError.message };

  return { success: true, email };
}
