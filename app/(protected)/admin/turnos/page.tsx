import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Store, Clock, UserCheck, CalendarClock } from 'lucide-react';
import type { Rol } from '@/types/roles';

export const dynamic = 'force-dynamic';

export default async function GlobalTurnosPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'super_admin' && perfil.rol !== 'admin')) {
    redirect('/admin');
  }

  const sucursalesRaw = await supabase
    .from('sucursales')
    .select('id, slug, nombre, activa')
    .order('nombre');
  const sucursales: { id: string; slug: string; nombre: string; activa: boolean }[] = sucursalesRaw.data ?? [];

  if (sucursales.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Turnos</h1>
        <p className="text-muted">No hay sucursales registradas.</p>
      </div>
    );
  }

  if (sucursales.length === 1) {
    redirect(`/${sucursales[0].slug}/admin/turnos`);
  }

  const hoy = new Date().toISOString().split('T')[0];
  const horaActual = new Date().toTimeString().slice(0, 5);

  const stats = await Promise.all(
    sucursales.map(async (s) => {
      const aperturasHoy = await Promise.all([
        supabase
          .from('aperturas_turno')
          .select('id, hora_inicio, hora_fin, activa, recurrencia')
          .eq('sucursal_id', s.id)
          .eq('fecha', hoy)
          .order('hora_inicio')
          .then(r => (r.data ?? []) as { id: string; hora_inicio: string; hora_fin: string; activa: boolean; recurrencia: string | null }[]),
        supabase
          .from('aperturas_turno')
          .select('id, hora_inicio, hora_fin, activa, recurrencia')
          .eq('sucursal_id', s.id)
          .lte('fecha', hoy)
          .gte('recurrencia_fin', hoy)
          .eq('activa', true)
          .not('recurrencia', 'is', null)
          .order('hora_inicio')
          .then(r => (r.data ?? []) as { id: string; hora_inicio: string; hora_fin: string; activa: boolean; recurrencia: string | null }[]),
      ]).then(([unicas, recurrentes]) => [...unicas, ...recurrentes]);

      const aperturaActiva = aperturasHoy.some(
        a => a.activa && a.hora_inicio <= horaActual && a.hora_fin >= horaActual
      );

      const { count: meserosActivos } = await supabase
        .from('turnos')
        .select('*', { count: 'exact', head: true })
        .eq('sucursal_id', s.id)
        .eq('activo', true)
        .is('fin', null);

      const { count: proxAperturasUnicas } = await supabase
        .from('aperturas_turno')
        .select('*', { count: 'exact', head: true })
        .eq('sucursal_id', s.id)
        .gte('fecha', hoy)
        .eq('activa', true)
        .is('recurrencia', null);

      const { count: proxAperturasRecurrentes } = await supabase
        .from('aperturas_turno')
        .select('*', { count: 'exact', head: true })
        .eq('sucursal_id', s.id)
        .lte('fecha', hoy)
        .gte('recurrencia_fin', hoy)
        .eq('activa', true)
        .not('recurrencia', 'is', null);

      const proxAperturas = (proxAperturasUnicas ?? 0) + (proxAperturasRecurrentes ?? 0);

      return {
        ...s,
        aperturaActiva,
        meserosActivos: meserosActivos ?? 0,
        proxAperturas: proxAperturas ?? 0,
        aperturasHoy: aperturasHoy ?? [],
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Turnos</h1>
        <p className="text-sm text-muted mt-1">
          Administra los turnos por sucursal
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(s => (
          <Link
            key={s.id}
            href={`/${s.slug}/admin/turnos`}
            className="bg-card rounded-2xl border-2 border-border-default p-6 hover:border-accent/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                s.aperturaActiva ? 'bg-green-500/15' : 'bg-accent/10'
              }`}>
                <Store className={`w-5 h-5 ${s.aperturaActiva ? 'text-green-500' : 'text-accent'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary truncate">{s.nombre}</p>
                {s.aperturaActiva && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Turno abierto ahora
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-base">
                <UserCheck className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <p className="text-lg font-bold text-text-primary leading-tight">{s.meserosActivos}</p>
                  <p className="text-[10px] text-muted leading-tight">Activos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-base">
                <CalendarClock className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-text-primary leading-tight">{s.proxAperturas}</p>
                  <p className="text-[10px] text-muted leading-tight">Programados</p>
                </div>
              </div>
            </div>

            {s.aperturasHoy.length > 0 && (
              <div className="mt-3 space-y-1">
                {s.aperturasHoy.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{a.hora_inicio.slice(0, 5)} - {a.hora_fin.slice(0, 5)}</span>
                    <span className={a.activa ? 'text-green-500' : 'text-muted'}>
                      {a.activa ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
