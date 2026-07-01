import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMexicoDateString, getMexicoTimeString } from '@/lib/mexico-time';
import {
  Store, Clock, UserCheck, CalendarClock, ExternalLink, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

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

  if (!perfil || perfil.rol !== 'super_admin') {
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
        <h1 className="text-xl font-bold text-text-primary">Turnos</h1>
        <p className="text-muted">No hay sucursales registradas.</p>
      </div>
    );
  }

  if (sucursales.length === 1) {
    redirect(`/${sucursales[0].slug}/admin/turnos`);
  }

  const hoy = getMexicoDateString();
  const horaActual = getMexicoTimeString();

  const stats = await Promise.all(
    sucursales.map(async (s) => {
      const aperturasHoy = await Promise.all([
        supabase
          .from('aperturas_turno')
          .select('id, hora_inicio, hora_fin, activa, recurrencia')
          .eq('sucursal_id', s.id)
          .eq('fecha', hoy)
          .is('recurrencia', null)
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

      const activosRaw = await supabase
        .from('registro_turnos_personal')
        .select('id')
        .eq('sucursal_id', s.id)
        .eq('activo', true)
        .is('fin', null);

      const activasRaw = await supabase
        .from('aperturas_turno')
        .select('id')
        .eq('sucursal_id', s.id)
        .eq('activa', true);

      return {
        ...s,
        aperturaActiva,
        meserosActivos: (activosRaw.data ?? []).length,
        totalActivas: (activasRaw.data ?? []).length,
        aperturasHoy: aperturasHoy ?? [],
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Turnos</h1>
      </div>

      {/* Branch grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(s => (
          <a
            key={s.id}
            href={`/${s.slug}/admin/turnos`}
            className={`group bg-card border-2 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:border-accent/20 ${s.activa ? 'border-border/60' : 'border-border/40 opacity-75'
              }`}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.aperturaActiva ? 'bg-green-500/15' : 'bg-accent/10'
                }`}>
                <Store className={`w-5 h-5 ${s.aperturaActiva ? 'text-green-500' : 'text-accent'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary truncate group-hover:text-accent transition-colors">
                  {s.nombre}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={s.activa ? 'success' : 'danger'} className="text-[10px] px-1.5 py-0.5">
                    {s.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                  {s.aperturaActiva && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Abierto
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors shrink-0" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-base">
                <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-text-primary leading-tight">{s.meserosActivos}</p>
                  <p className="text-[10px] text-muted leading-tight">Activos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-base">
                <CalendarClock className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-text-primary leading-tight">{s.totalActivas}</p>
                  <p className="text-[10px] text-muted leading-tight">Activas</p>
                </div>
              </div>
            </div>

            {/* Today's schedule */}
            {s.aperturasHoy.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/40">
                <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">Hoy</p>
                {s.aperturasHoy.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {a.hora_inicio.slice(0, 5)} – {a.hora_fin.slice(0, 5)}
                    </span>
                    <span className={a.activa ? 'text-green-500' : 'text-muted'}>
                      {a.activa ? 'Activo' : 'Inactivo'}
                      {a.recurrencia && (
                        <span className="ml-1 text-muted">
                          ({a.recurrencia === 'semanal' ? 'Semanal' : a.recurrencia === 'mensual' ? 'Mensual' : 'Anual'})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
