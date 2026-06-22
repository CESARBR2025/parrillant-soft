import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ActiveOrderView } from './ActiveOrderView';
import type { Database } from '@/types/database.types';

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

  const ESTADOS_ACTIVOS: Database['public']['Enums']['estado_orden'][] = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada'];

  const { data: ordenPadre } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      notas,
      created_at,
      alimentos_servidos,
      bebidas_servidos,
      comensales,
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
    .is('orden_padre_id', null)
    .in('estado', ESTADOS_ACTIVOS)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ordenPadre) {
    redirect(`/mesero/mesas/${mesaId}/nueva`);
  }

  const { data: subOrdenes } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      notas,
      created_at,
      alimentos_servidos,
      bebidas_servidos,
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
    .eq('orden_padre_id', ordenPadre.id)
    .in('estado', ESTADOS_ACTIVOS)
    .order('created_at', { ascending: true });

  function normalize(orden: Record<string, unknown>) {
    return {
      ...orden,
      alimentos_servidos: (orden as { alimentos_servidos?: boolean }).alimentos_servidos ?? false,
      bebidas_servidos: (orden as { bebidas_servidos?: boolean }).bebidas_servidos ?? false,
      detalles_orden: ((orden as { detalles_orden?: Array<Record<string, unknown>> }).detalles_orden ?? []).map(d => ({
        ...d,
        ronda: (d as { ronda?: number }).ronda ?? 1,
        servido: (d as { servido?: boolean }).servido ?? false,
      })),
    };
  }

  return (
    <ActiveOrderView
      mesa={mesa}
      ordenPadre={normalize(ordenPadre) as Parameters<typeof ActiveOrderView>[0]['ordenPadre']}
      subOrdenes={(subOrdenes ?? []).map(normalize) as Parameters<typeof ActiveOrderView>[0]['subOrdenes']}
    />
  );
}
