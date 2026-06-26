import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { TurnosBranchClient } from './TurnosBranchClient';

export const dynamic = 'force-dynamic';

export default async function SucursalTurnosPage({
  params,
}: {
  params: Promise<{ sucursalSlug: string }>;
}) {
  const { sucursalSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) {
    redirect(`/${sucursalSlug}/admin`);
  }

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect(`/${sucursalSlug}/admin`);

  const sucursalRaw = await supabase
    .from('sucursales')
    .select('id, slug, nombre')
    .eq('id', sucursalId)
    .single();
  const sucursal = sucursalRaw.data as { id: string; slug: string; nombre: string } | null;

  if (!sucursal) redirect(`/${sucursalSlug}/admin`);

  const aperturasRaw = await supabase
    .from('aperturas_turno')
    .select('id, sucursal_id, fecha, hora_inicio, hora_fin, activa, recurrencia, recurrencia_fin')
    .eq('sucursal_id', sucursalId)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: true });
  const aperturas: { id: string; sucursal_id: string; fecha: string; hora_inicio: string; hora_fin: string; activa: boolean; recurrencia: string | null; recurrencia_fin: string | null }[] = aperturasRaw.data ?? [];

  const turnosRaw = await (supabase as any)
    .from('registro_turnos_personal')
    .select('id, usuario_id, inicio')
    .eq('sucursal_id', sucursalId)
    .eq('activo', true)
    .is('fin', null);
  const turnos: { id: string; usuario_id: string; inicio: string }[] = turnosRaw.data ?? [];

  // Obtener nombres de los meseros
  const userIds = turnos.map(t => t.usuario_id);
  let nombresMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const perfilesRaw = await (supabase as any)
      .from('perfiles')
      .select('id, nombre')
      .in('id', userIds);
    const perfiles: { id: string; nombre: string }[] = perfilesRaw.data ?? [];
    for (const p of perfiles) {
      nombresMap[p.id] = p.nombre;
    }
  }

  const turnosActivos = turnos.map(t => ({
    id: t.id,
    usuario_id: t.usuario_id,
    inicio: t.inicio,
    usuario_nombre: nombresMap[t.usuario_id] ?? '—',
  }));

  const todasSucursalesRaw = await supabase
    .from('sucursales')
    .select('id, slug, nombre')
    .eq('activa', true)
    .order('nombre');
  const todasSucursales: { id: string; slug: string; nombre: string }[] = todasSucursalesRaw.data ?? [];

  return (
    <div className="space-y-6">
      <a
        href={`/${sucursalSlug}/admin`}
        className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
      >
        ← Panel de Administración
      </a>
      <TurnosBranchClient
        aperturas={aperturas}
        turnosActivos={turnosActivos}
        sucursal={sucursal}
        todasSucursales={todasSucursales}
      />
    </div>
  );
}
