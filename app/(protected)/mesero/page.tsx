import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TableMap } from '@/components/mesas/TableMap';

export default async function MeseroPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mesas } = await supabase
    .from('mesas')
    .select('id, numero, zona, capacidad, estado')
    .order('numero');

  const { data: ordenesActivas } = await supabase
    .from('ordenes')
    .select('id, mesa_id, created_at')
    .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado']);

  const ordenesPorMesa = new Map(
    ordenesActivas?.map(o => [o.mesa_id, { id: o.id, created_at: o.created_at }]) ?? []
  );

  const mesasConOrdenes = (mesas ?? []).map(m => {
    const orden = ordenesPorMesa.get(m.id);
    return {
      ...m,
      estado: orden ? 'ocupada' as const : m.estado,
      orden_activa_id: orden?.id ?? null,
      orden_created_at: orden?.created_at ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Mapa de Mesas</h1>
      </div>

      <TableMap initialMesas={mesasConOrdenes} />
    </div>
  );
}
