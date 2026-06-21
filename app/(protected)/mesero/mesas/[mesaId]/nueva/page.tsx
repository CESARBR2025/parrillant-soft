import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NewOrderView } from './NewOrderView';

export default async function NuevaOrdenPage({
  params,
  searchParams,
}: {
  params: Promise<{ mesaId: string }>;
  searchParams: Promise<{ ordenId?: string }>;
}) {
  const { mesaId } = await params;
  const { ordenId } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mesa } = await supabase
    .from('mesas')
    .select('id, numero, zona')
    .eq('id', Number(mesaId))
    .single();

  if (!mesa) redirect('/mesero');

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('activa', true)
    .order('orden');

  const { data: productos } = await supabase
    .from('productos_menu')
    .select('*')
    .eq('disponible', true)
    .order('nombre');

  const ordenExistente = ordenId
    ? await supabase
        .from('ordenes')
        .select('id, estado')
        .eq('id', Number(ordenId))
        .in('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado'])
        .single()
        .then(r => r.data)
    : null;

  return (
    <NewOrderView
      mesa={mesa}
      categorias={categorias ?? []}
      productos={productos ?? []}
      ordenExistente={ordenExistente}
    />
  );
}
