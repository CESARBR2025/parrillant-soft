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
        producto_id,
        precio_unitario,
        productos_menu (nombre, precio)
      )
    `)
    .eq('mesa_id', Number(mesaId))
    .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!orden) {
    redirect(`/mesero/mesas/${mesaId}/nueva`);
  }

  return <ActiveOrderView mesa={mesa} orden={orden} />;
}
