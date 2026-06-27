import { createServerSupabaseClient } from './supabase/server';
import type { Turno } from '@/types/database.types';

export async function verificarTurnoActivo(
  sucursalId: string
): Promise<{ turno: Turno | null; error: string | null }> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { turno: null, error: 'No autorizado' };

  const { data: puedeRegistrarTurno } = await (supabase as any).rpc('tiene_permiso', { permiso_codigo: 'turnos.registrar' });
  if (!puedeRegistrarTurno) return { turno: null, error: null };

  const turnoRaw = await (supabase as any)
    .from('registro_turnos_personal')
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
