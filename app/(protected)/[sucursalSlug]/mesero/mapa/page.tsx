import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId } from '@/lib/sucursal';
import { TableMap } from '@/components/mesas/TableMap';
import { MapaHeader } from '@/components/mesas/MapaHeader';

export default async function MapaPage({
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

  const { data: mesas } = await supabase
    .from('mesas')
    .select('id, numero, zona, capacidad, estado')
    .eq('sucursal_id', sucursalId)
    .order('numero');

  const { data: ordenesActivas } = await supabase
    .from('ordenes')
    .select('id, mesa_id, created_at, estado, comensales, orden_padre_id')
    .eq('sucursal_id', sucursalId)
    .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada']);

  const ordenesPorMesa = new Map<number, { id: number; created_at: string; orden_estado: string; comensales: number | null }>();
  for (const o of ordenesActivas ?? []) {
    if (!o.orden_padre_id) {
      ordenesPorMesa.set(o.mesa_id, {
        id: o.id,
        created_at: o.created_at,
        orden_estado: o.estado,
        comensales: o.comensales,
      });
    } else if (!ordenesPorMesa.has(o.mesa_id)) {
      ordenesPorMesa.set(o.mesa_id, {
        id: o.id,
        created_at: o.created_at,
        orden_estado: o.estado,
        comensales: null,
      });
    }
  }

  const mesasConOrdenes = (mesas ?? []).map(m => {
    const orden = ordenesPorMesa.get(m.id);
    return {
      ...m,
      estado: orden ? 'ocupada' as const : m.estado,
      orden_activa_id: orden?.id ?? null,
      orden_created_at: orden?.created_at ?? null,
      orden_estado: orden?.orden_estado ?? null,
      comensales: orden?.comensales ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <MapaHeader />

      <TableMap initialMesas={mesasConOrdenes} />
    </div>
  );
}
