import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Store, Users, ClipboardList, DollarSign } from 'lucide-react';

export default async function GlobalAdminPage() {
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
    redirect('/login');
  }

  const sucursalesRaw = await supabase
    .from('sucursales')
    .select('id, slug, nombre, activa');
  const sucursales: { id: string; slug: string; nombre: string; activa: boolean }[] = sucursalesRaw.data ?? [];

  const todayStart = new Date(new Date().setHours(0,0,0,0)).toISOString();

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

      const { data: ingresos } = await supabase
        .from('ordenes')
        .select('total')
        .eq('sucursal_id', s.id)
        .eq('estado', 'cerrado')
        .gte('updated_at', todayStart);

      const ingresosHoy = (ingresos as { total: number | null }[] | null)?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;

      return { ...s, mesasActivas: mesas ?? 0, ordenesActivas: ordenes ?? 0, ingresosHoy };
    })
  );

  const { data: ingresosHoy } = await supabase
    .from('ordenes')
    .select('total')
    .eq('estado', 'cerrado')
    .gte('updated_at', todayStart);

  const totalHoy = (ingresosHoy as { total: number | null }[] | null)?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Panel Global</h1>
        <p className="text-sm text-muted mt-1">Resumen general del sistema</p>
      </div>

      <div className="bg-card border-2 border-border-default rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Resumen General</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-base">
            <Store className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm text-muted">Sucursales</p>
              <p className="text-xl font-bold text-text-primary">{stats.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-base">
            <DollarSign className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm text-muted">$ Recaudado Hoy</p>
              <p className="text-xl font-bold text-text-primary">
                ${totalHoy.toLocaleString('es-MX')}
              </p>
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

      {stats.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-text-primary">Sucursales</h2>
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
                  <span className="flex items-center gap-1.5 text-accent font-medium">
                    <DollarSign className="w-4 h-4" />
                    ${s.ingresosHoy.toLocaleString('es-MX')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {stats.length === 0 && (
        <p className="text-muted">No hay sucursales registradas.</p>
      )}
    </div>
  );
}
