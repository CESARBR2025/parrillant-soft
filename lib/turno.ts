import { createServerSupabaseClient } from './supabase/server';
import type { Turno } from '@/types/database.types';

export async function verificarTurnoActivo(
  sucursalId: string
): Promise<{ turno: Turno | null; error: string | null }> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { turno: null, error: 'No autorizado' };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil) return { turno: null, error: 'Perfil no encontrado' };

  if (perfil.rol === 'super_admin' || perfil.rol === 'admin') {
    return { turno: null, error: null };
  }

  if (perfil.rol !== 'mesero') {
    return { turno: null, error: null };
  }

  const turnoRaw = await (supabase as any)
    .from('turnos')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('sucursal_id', sucursalId)
    .eq('activo', true)
    .is('fin', null)
    .maybeSingle();
  const turno = turnoRaw.data as Turno | null;

  if (!turno) {
    return { turno: null, error: 'No tienes un turno activo en esta sucursal' };
  }

  return { turno: turno as unknown as Turno, error: null };
}
