import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OrderHistoryView } from './OrderHistoryView';

export default async function OrdenesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      notas,
      total,
      created_at,
      mesas (numero, zona),
      detalles_orden (
        id,
        cantidad,
        notas,
        listo,
        tipo,
        productos_menu (nombre, precio)
      )
    `)
    .gte('created_at', hoy.toISOString())
    .order('created_at', { ascending: false });

  return <OrderHistoryView ordenes={ordenes ?? []} />;
}
