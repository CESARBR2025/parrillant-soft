import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ROLE_BADGE_STYLES } from '@/lib/navigation';
import type { KnownRol } from '@/types/roles';
import { RolesClient } from './RolesClient';

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
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

  const { data: roles } = await (supabase as any)
    .from('roles')
    .select('*')
    .order('nivel');

  const { data: usuarios } = await (supabase as any)
    .from('perfiles')
    .select('rol');

  const conteo: Record<string, number> = {};
  if (usuarios) {
    for (const u of usuarios as { rol: string }[]) {
      conteo[u.rol] = (conteo[u.rol] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/admin"
          className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
        >
          ← Panel Global
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Roles del Sistema</h1>
            <p className="text-sm text-muted mt-1">
              Gestiona los roles del sistema
            </p>
          </div>
        </div>
      </div>

      <RolesClient
        roles={(roles as any[]) ?? []}
        conteo={conteo}
        badgeStyles={ROLE_BADGE_STYLES}
      />
    </div>
  );
}
