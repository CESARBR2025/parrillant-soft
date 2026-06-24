import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Store, Users, ClipboardList } from 'lucide-react';
import type { Rol } from '@/types/roles';

export default async function GlobalAdminPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil) redirect('/login');
  const rol = perfil.rol as Rol;

  if (rol !== 'super_admin' && rol !== 'admin') {
    redirect('/login');
  }

  const { data: sucursales } = await supabase
    .from('sucursales')
    .select('id, slug, nombre, activa');

  if (!sucursales || sucursales.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Panel Global</h1>
        <p className="text-muted">No hay sucursales registradas.</p>
      </div>
    );
  }

  if (sucursales.length === 1) {
    redirect(`/${sucursales[0].slug}/admin`);
  }

  const stats = await Promise.all(
    sucursales.map(async (s) => {
      const { count: mesas } = await supabase
        .from('mesas')
        .select('*', { count: 'exact', head: true })
        .eq('sucursal_id', s.id)
        .eq('estado', 'ocupada');

      const { count: ordenes } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .eq('sucursal_id', s.id)
        .in('estado', ['pendiente', 'en_preparacion']);

      return { ...s, mesasActivas: mesas ?? 0, ordenesActivas: ordenes ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Panel Global</h1>
        <p className="text-sm text-muted mt-1">Selecciona una sucursal para administrar</p>
      </div>

      {rol === 'super_admin' && (
        <div className="bg-card border-2 border-border-default rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Resumen General</h2>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/usuarios"
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Usuarios
              </Link>
              <Link
                href="/admin/sucursales"
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <Store className="w-4 h-4" />
                Sucursales
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-base">
              <Store className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted">Sucursales</p>
                <p className="text-xl font-bold text-text-primary">{stats.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-base">
              <Users className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted">Mesas Ocupadas</p>
                <p className="text-xl font-bold text-text-primary">
                  {stats.reduce((a, s) => a + s.mesasActivas, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(s => (
          <Link
            key={s.id}
            href={`/${s.slug}/admin`}
            className="bg-card rounded-2xl border-2 border-border-default p-6 hover:border-accent/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-text-primary">{s.nombre}</p>
                <p className="text-xs text-muted">{s.slug}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <Users className="w-4 h-4" />
                {s.mesasActivas} mesas
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <ClipboardList className="w-4 h-4" />
                {s.ordenesActivas} órdenes
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
