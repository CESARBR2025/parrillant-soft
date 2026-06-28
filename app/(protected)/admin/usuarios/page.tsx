import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { AdminUsuariosClient } from './AdminUsuariosClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const dynamic = 'force-dynamic';

export default async function AdminUsuariosPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || perfil.rol !== 'super_admin') {
    redirect('/admin');
  }

  const { data: usuarios, error } = await supabaseAdmin.auth.admin.listUsers();

  const emails: Record<string, string> = {};
  for (const u of usuarios?.users ?? []) {
    emails[u.id] = u.email ?? '—';
  }

  const perfilesRaw = await supabase
    .from('perfiles')
    .select('*')
    .order('nombre');

  const asignacionesRaw = await supabase
    .from('usuario_sucursales')
    .select('usuario_id, sucursales!inner(id, slug, nombre)');
  const asignaciones: { usuario_id: string; sucursales: { id: string; slug: string; nombre: string } }[] = (asignacionesRaw.data ?? []) as any;

  const sucursalesPorUsuario: Record<string, { id: string; slug: string; nombre: string }[]> = {};
  for (const a of asignaciones) {
    const sid = a.usuario_id;
    if (!sucursalesPorUsuario[sid]) sucursalesPorUsuario[sid] = [];
    sucursalesPorUsuario[sid].push(a.sucursales);
  }

  const perfiles = (perfilesRaw.data ?? []) as any[];
  const usuariosPorSucursal: Record<string, typeof perfiles> = {};
  const usuariosSinSucursal: typeof perfiles = [];
  const usuariosGlobales: typeof perfiles = [];

  for (const p of perfiles) {
    if (p.rol === 'super_admin') {
      usuariosGlobales.push(p);
    } else {
      const sucs = sucursalesPorUsuario[p.id];
      if (!sucs || sucs.length === 0) {
        usuariosSinSucursal.push(p);
      } else {
        for (const s of sucs) {
          if (!usuariosPorSucursal[s.id]) usuariosPorSucursal[s.id] = [];
          usuariosPorSucursal[s.id].push(p);
        }
      }
    }
  }

  const sucursalesRaw = await supabase
    .from('sucursales')
    .select('*')
    .eq('activa', true)
    .order('nombre');

  const sucursalesList = (sucursalesRaw.data ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Usuarios</h1>
        <p className="text-sm text-muted mt-1">{perfiles.length} usuarios registrados</p>
      </div>

      <AdminUsuariosClient
        initialUsuarios={perfiles}
        emails={emails}
        sucursalesPorUsuario={sucursalesPorUsuario}
        sucursales={sucursalesList}
        usuariosPorSucursal={usuariosPorSucursal}
        usuariosSinSucursal={usuariosSinSucursal}
        usuariosGlobales={usuariosGlobales}
      />
    </div>
  );
}
