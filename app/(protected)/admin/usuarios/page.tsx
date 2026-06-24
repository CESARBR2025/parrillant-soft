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

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.rol !== 'super_admin') {
    redirect('/admin');
  }

  const { data: usuarios, error } = await supabaseAdmin.auth.admin.listUsers();

  const emails: Record<string, string> = {};
  for (const u of usuarios?.users ?? []) {
    emails[u.id] = u.email ?? '—';
  }

  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('*')
    .order('nombre');

  const { data: asignaciones } = await supabase
    .from('usuario_sucursales')
    .select('usuario_id, sucursales!inner(id, slug, nombre)');

  const sucursalesPorUsuario: Record<string, { id: string; slug: string; nombre: string }[]> = {};
  for (const a of asignaciones ?? []) {
    const sid = a.usuario_id;
    if (!sucursalesPorUsuario[sid]) sucursalesPorUsuario[sid] = [];
    sucursalesPorUsuario[sid].push(a.sucursales as unknown as { id: string; slug: string; nombre: string });
  }

  const { data: sucursales } = await supabase
    .from('sucursales')
    .select('*')
    .eq('activa', true)
    .order('nombre');

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/admin"
          className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
        >
          ← Panel Global
        </a>
        <h1 className="text-xl font-bold text-text-primary">Usuarios</h1>
        <p className="text-sm text-muted mt-1">{perfiles?.length ?? 0} usuarios registrados</p>
      </div>

      <AdminUsuariosClient
        initialUsuarios={(perfiles ?? []) as any[]}
        emails={emails}
        sucursalesPorUsuario={sucursalesPorUsuario}
        sucursales={(sucursales ?? []) as any[]}
      />
    </div>
  );
}
