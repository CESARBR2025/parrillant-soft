import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ActiveOrderView } from './ActiveOrderView';

export default async function MesaOrdenPage({
  params,
}: {
  params: Promise<{ mesaId: string }>;
}) {
  const { mesaId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mesa } = await supabase
    .from('mesas')
    .select('id, numero, zona')
    .eq('id', Number(mesaId))
    .single();

  if (!mesa) redirect('/mesero');

  const { data: orden } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      notas,
      created_at,
      detalles_orden (
        id,
        cantidad,
        notas,
        listo,
        tipo,
        ronda,
        servido,
        producto_id,
        precio_unitario,
        productos_menu (nombre, precio)
      )
    `)
    .eq('mesa_id', Number(mesaId))
    .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!orden) {
    redirect(`/mesero/mesas/${mesaId}/nueva`);
  }

  const ordenConDefaults = {
    ...orden,
    alimentos_servidos: false,
    bebidas_servidos: false,
    detalles_orden: orden.detalles_orden.map(d => ({
      ...d,
      ronda: d.ronda ?? 1,
      servido: d.servido ?? false,
    })),
  };

  return <ActiveOrderView mesa={mesa} orden={ordenConDefaults} />;
}
