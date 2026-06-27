import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AuthResult =
  | { authorized: true; supabase: any; userId: string }
  | { authorized: false; error: string };

export async function authorize(permisoCodigo: string): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, error: 'No autorizado' };

  const { data: tienePermiso } = await (supabase as any).rpc('tiene_permiso', { permiso_codigo: permisoCodigo });

  if (!tienePermiso) return { authorized: false, error: 'No tienes permiso' };

  return { authorized: true, supabase, userId: user.id };
}
