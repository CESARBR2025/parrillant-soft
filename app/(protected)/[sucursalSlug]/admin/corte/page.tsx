import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { CorteDiario } from '@/components/corte/CorteDiario';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';

type CorteCaja = Database['public']['Tables']['cortes_caja']['Row'];

export default async function CortePage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect('/login');

  const hoy = new Date().toISOString().split('T')[0];

  const { data: { user: _ } } = await supabase.auth.getUser();

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;
  const rol = perfil?.rol ?? '';
  const puedeGenerar = ['gerente_sucursal', 'administrador', 'super_admin', 'caja'].includes(rol);

  const corteExistenteRaw = await supabase
    .from('cortes_caja')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .eq('fecha', hoy)
    .order('created_at', { ascending: false })
    .limit(1);

  const corteExistente = corteExistenteRaw.data?.[0] as CorteCaja | undefined;

  if (corteExistente) {
    return (
      <div className="space-y-6">
        <CorteDiario
          initialCorte={corteExistente}
          initialEnVivo={null}
          yaGenerado={true}
          puedeGenerar={false}
        />
      </div>
    );
  }

  const inicioDelDia = `${hoy}T00:00:00Z`;
  const finDelDia = `${hoy}T23:59:59Z`;

  const ordenesRaw = await supabase
    .from('ordenes')
    .select(`
      id, total, metodo_pago, descuento, updated_at, mesa_id,
      mesas!inner(numero, zona),
      perfiles!ordenes_mesero_id_fkey!inner(nombre, apellido)
    `)
    .eq('sucursal_id', sucursalId)
    .eq('estado', 'cerrado')
    .gte('updated_at', inicioDelDia)
    .lte('updated_at', finDelDia)
    .is('orden_padre_id', null)
    .order('updated_at', { ascending: true });

  const ordenes = ordenesRaw.data as Array<{
    id: number;
    total: number | null;
    metodo_pago: string | null;
    descuento: number;
    updated_at: string;
    mesa_id: number;
    mesas: { numero: number; zona: string | null };
    perfiles: { nombre: string; apellido: string | null };
  }> | null;

  let enVivo = null;

  if (ordenes && ordenes.length > 0) {
    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;
    let totalDescuentos = 0;
    let totalGeneral = 0;

    const ordenesDetalle = [];

    for (const o of ordenes) {
      const metodo = o.metodo_pago ?? 'efectivo';
      const total = Number(o.total ?? 0);
      const descuento = Number(o.descuento ?? 0);

      totalGeneral += total;
      totalDescuentos += descuento;

      if (metodo === 'efectivo') totalEfectivo += total;
      else if (metodo === 'tarjeta') totalTarjeta += total;
      else if (metodo === 'transferencia') totalTransferencia += total;

      const { count } = await supabase
        .from('detalles_orden')
        .select('*', { count: 'exact', head: true })
        .eq('orden_id', o.id);

      ordenesDetalle.push({
        id: o.id,
        mesa: o.mesas.numero,
        zona: o.mesas.zona,
        mesero: `${o.perfiles.nombre}${o.perfiles.apellido ? ` ${o.perfiles.apellido}` : ''}`,
        total,
        metodo_pago: metodo,
        descuento,
        items: count ?? 0,
        cerrado_a_las: o.updated_at,
      });
    }

    enVivo = {
      total_efectivo: totalEfectivo,
      total_tarjeta: totalTarjeta,
      total_transferencia: totalTransferencia,
      total_descuentos: totalDescuentos,
      total_general: totalGeneral,
      total_ordenes: ordenes.length,
      ordenes: ordenesDetalle,
    };
  }

  return (
    <div className="space-y-6">
      <CorteDiario
        initialCorte={null}
        initialEnVivo={enVivo}
        yaGenerado={false}
        puedeGenerar={puedeGenerar}
      />
    </div>
  );
}
