import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId } from '@/lib/sucursal';
import { Grid3x3, ScrollText, ClipboardList, TrendingUp, Clock, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

export default async function MeseroDashboard({
  params,
}: {
  params: Promise<{ sucursalSlug: string }>;
}) {
  const { sucursalSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect(`/${sucursalSlug}/mesero`);

  const { data: mesasOcupadas } = await supabase
    .from('ordenes')
    .select('mesa_id')
    .eq('sucursal_id', sucursalId)
    .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado']);

  const mesasActivas = new Set(mesasOcupadas?.map(o => o.mesa_id) ?? []);

  const { count: ordenesHoy } = await supabase
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('sucursal_id', sucursalId)
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Resumen rápido del servicio</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border-2 border-border/60 p-4 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{mesasActivas.size}</p>
          <p className="text-xs text-muted">Mesas ocupadas</p>
        </div>
        <div className="bg-card rounded-2xl border-2 border-border/60 p-4 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{ordenesHoy ?? 0}</p>
          <p className="text-xs text-muted">Órdenes hoy</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href={`/${sucursalSlug}/mesero/mapa`}
            className="bg-card rounded-2xl border-2 border-border/60 p-4 flex items-center gap-4 hover:border-accent/30 hover:bg-accent/5 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Grid3x3 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Mapa de Mesas</p>
              <p className="text-xs text-muted mt-0.5">Ver mesas y tomar órdenes</p>
            </div>
          </Link>

          <Link
            href={`/${sucursalSlug}/mesero/ordenes`}
            className="bg-card rounded-2xl border-2 border-border/60 p-4 flex items-center gap-4 hover:border-accent/30 hover:bg-accent/5 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <ScrollText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Historial</p>
              <p className="text-xs text-muted mt-0.5">Órdenes del día</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
