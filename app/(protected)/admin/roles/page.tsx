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

  const { data: permisos } = await (supabase as any)
    .from('permisos')
    .select('codigo, descripcion')
    .order('codigo');

  const { data: rolesPermisos } = await (supabase as any)
    .from('roles_permisos')
    .select('rol_nombre, permiso_codigo');

  const permisosPorRol: Record<string, string[]> = {};
  if (rolesPermisos) {
    for (const rp of rolesPermisos as { rol_nombre: string; permiso_codigo: string }[]) {
      if (!permisosPorRol[rp.rol_nombre]) permisosPorRol[rp.rol_nombre] = [];
      permisosPorRol[rp.rol_nombre].push(rp.permiso_codigo);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Roles del Sistema</h1>
      </div>

      <RolesClient
        roles={(roles as any[]) ?? []}
        conteo={conteo}
        badgeStyles={ROLE_BADGE_STYLES}
        permisos={(permisos as { codigo: string; descripcion: string }[]) ?? []}
        permisosPorRol={permisosPorRol}
      />
    </div>
  );
}
