import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TableMap } from '@/components/mesas/TableMap';
import { MapaHeader } from '@/components/mesas/MapaHeader';

export default async function MapaPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mesas } = await supabase
    .from('mesas')
    .select('id, numero, zona, capacidad, estado')
    .order('numero');

  const { data: ordenesActivas } = await supabase
    .from('ordenes')
    .select('id, mesa_id, created_at, estado, comensales')
    .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada']);

  const ordenesPorMesa = new Map(
    ordenesActivas?.map(o => [o.mesa_id, {
      id: o.id,
      created_at: o.created_at,
      orden_estado: o.estado,
      comensales: o.comensales,
    }]) ?? []
  );

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
