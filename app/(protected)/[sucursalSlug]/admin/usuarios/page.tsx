import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { SucursalUsuariosClient } from './SucursalUsuariosClient';

export const dynamic = 'force-dynamic';

export default async function AdminSucursalUsuariosPage({
  params,
}: {
  params: Promise<{ sucursalSlug: string }>;
}) {
  const { sucursalSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'super_admin')) {
    redirect(`/${sucursalSlug}/admin`);
  }

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect(`/${sucursalSlug}/admin`);

  // Usuarios asignados a esta sucursal
  const { data: asignaciones } = await supabase
    .from('usuario_sucursales')
    .select('usuario_id, perfiles!inner(id, nombre, rol, activo)')
    .eq('sucursal_id', sucursalId);

  const usuariosAsignados = (asignaciones ?? []).map(a => a.perfiles as unknown as {
    id: string; nombre: string; rol: string; activo: boolean;
  });

  // Usuarios NO asignados a esta sucursal (disponibles para agregar)
  const { data: todosPerfiles } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo')
    .order('nombre');

  const asignadosIds = new Set(usuariosAsignados.map(u => u.id));
  const usuariosDisponibles = (todosPerfiles ?? []).filter(
    p => !asignadosIds.has(p.id) && p.activo
  );

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/${sucursalSlug}/admin`}
          className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
        >
          ← Panel de Administración
        </a>
        <h1 className="text-xl font-bold text-text-primary">Usuarios de Sucursal</h1>
        <p className="text-sm text-muted mt-1">{usuariosAsignados.length} usuarios asignados</p>
      </div>

      <SucursalUsuariosClient
        usuariosAsignados={usuariosAsignados as any[]}
        usuariosDisponibles={usuariosDisponibles as any[]}
        sucursalId={sucursalId}
      />
    </div>
  );
}
