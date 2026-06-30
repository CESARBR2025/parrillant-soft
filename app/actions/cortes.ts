'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { authorize } from '@/lib/auth';
import * as XLSX from 'xlsx';
import type { Database } from '@/types/database.types';

type OrdenRow = Database['public']['Tables']['ordenes']['Row'];
type CorteCaja = Database['public']['Tables']['cortes_caja']['Row'];

interface CorteSummary {
  corte: CorteCaja | null;
  enVivo: {
    total_efectivo: number;
    total_tarjeta: number;
    total_transferencia: number;
    total_descuentos: number;
    total_general: number;
    total_ordenes: number;
    ordenes: Array<{
      id: number;
      mesa: number;
      zona: string | null;
      mesero: string;
      total: number;
      metodo_pago: string;
      descuento: number;
      items: number;
      cerrado_a_las: string;
    }>;
  } | null;
  yaGenerado: boolean;
}

function normalizarMetodo(metodo: string | null): string {
  if (!metodo) return 'efectivo';
  return metodo;
}

export async function obtenerCorte(fecha?: string): Promise<CorteSummary> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) throw new Error('Sucursal no identificada');

  const dia = fecha ?? new Date().toISOString().split('T')[0];

  const corteExistenteRaw = await supabase
    .from('cortes_caja')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .eq('fecha', dia)
    .order('created_at', { ascending: false })
    .limit(1);

  const corteExistente = corteExistenteRaw.data?.[0] as CorteCaja | undefined;

  if (corteExistente) {
    return {
      corte: corteExistente,
      enVivo: null,
      yaGenerado: true,
    };
  }

  const inicioDelDia = `${dia}T00:00:00Z`;
  const finDelDia = `${dia}T23:59:59Z`;

  const ordenesRaw = await supabase
    .from('ordenes')
    .select(`
      id, total, metodo_pago, pagado_con, descuento, created_at, updated_at, mesa_id,
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
    pagado_con: number | null;
    descuento: number;
    created_at: string;
    updated_at: string;
    mesa_id: number;
    mesas: { numero: number; zona: string | null };
    perfiles: { nombre: string; apellido: string | null };
  }> | null;

  if (!ordenes || ordenes.length === 0) {
    return {
      corte: null,
      enVivo: {
        total_efectivo: 0,
        total_tarjeta: 0,
        total_transferencia: 0,
        total_descuentos: 0,
        total_general: 0,
        total_ordenes: 0,
        ordenes: [],
      },
      yaGenerado: false,
    };
  }

  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;
  let totalDescuentos = 0;
  let totalGeneral = 0;
  let totalOrdenes = 0;
  const ordenesDetalle = [];

  for (const o of ordenes) {
    const metodo = normalizarMetodo(o.metodo_pago);
    const total = Number(o.total ?? 0);
    const descuento = Number(o.descuento ?? 0);

    totalGeneral += total;
    totalDescuentos += descuento;

    if (metodo === 'efectivo') totalEfectivo += total;
    else if (metodo === 'tarjeta') totalTarjeta += total;
    else if (metodo === 'transferencia') totalTransferencia += total;

    totalOrdenes++;

    ordenesDetalle.push({
      id: o.id,
      mesa: o.mesas.numero,
      zona: o.mesas.zona,
      mesero: `${o.perfiles.nombre}${o.perfiles.apellido ? ` ${o.perfiles.apellido}` : ''}`,
      total,
      metodo_pago: metodo,
      descuento,
      items: 0,
      cerrado_a_las: o.updated_at,
    });
  }

  for (const det of ordenesDetalle) {
    const { count } = await supabase
      .from('detalles_orden')
      .select('*', { count: 'exact', head: true })
      .eq('orden_id', det.id);
    det.items = count ?? 0;
  }

  return {
    corte: null,
    enVivo: {
      total_efectivo: totalEfectivo,
      total_tarjeta: totalTarjeta,
      total_transferencia: totalTransferencia,
      total_descuentos: totalDescuentos,
      total_general: totalGeneral,
      total_ordenes: totalOrdenes,
      ordenes: ordenesDetalle,
    },
    yaGenerado: false,
  };
}

export async function generarCorte(): Promise<{ error?: string; corteId?: string }> {
  const auth = await authorize('sucursal.cortes.generar');
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) return { error: 'Sucursal no identificada' };

  const slug = await getServerSucursalSlug();
  if (!slug) return { error: 'Sucursal no identificada' };

  const hoy = new Date().toISOString().split('T')[0];

  const existenteRaw = await supabase
    .from('cortes_caja')
    .select('id')
    .eq('sucursal_id', sucursalId)
    .eq('fecha', hoy)
    .limit(1);

  if (existenteRaw.data && existenteRaw.data.length > 0) {
    return { error: 'Ya existe un corte generado para hoy' };
  }

  const resumen = await obtenerCorte(hoy);
  if (resumen.yaGenerado) {
    return { error: 'Ya existe un corte generado para hoy' };
  }

  const enVivo = resumen.enVivo;
  if (!enVivo) return { error: 'No hay datos para generar el corte' };

  const detalle = {
    generado_el: new Date().toISOString(),
    sucursal_id: sucursalId,
    ordenes: enVivo.ordenes,
  };

  const insertRaw = await supabase
    .from('cortes_caja')
    .insert({
      sucursal_id: sucursalId,
      fecha: hoy,
      total_efectivo: enVivo.total_efectivo,
      total_tarjeta: enVivo.total_tarjeta,
      total_transferencia: enVivo.total_transferencia,
      total_descuentos: enVivo.total_descuentos,
      total_general: enVivo.total_general,
      total_ordenes: enVivo.total_ordenes,
      generado_por: auth.userId,
      detalle: detalle as any,
    })
    .select('id')
    .single();

  const corte = insertRaw.data as { id: string } | null;
  const error = insertRaw.error;

  if (error || !corte) {
    return { error: error?.message ?? 'Error al generar el corte' };
  }

  revalidatePath(`/${slug}/admin/corte`);
  revalidatePath(`/${slug}/caja/corte`);

  return { corteId: corte.id };
}

export async function exportarCorteExcel(fecha?: string): Promise<{
  error?: string;
  fileName?: string;
  base64?: string;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) return { error: 'Sucursal no identificada' };

  const dia = fecha ?? new Date().toISOString().split('T')[0];

  const sucursalRaw = await supabase
    .from('sucursales')
    .select('nombre')
    .eq('id', sucursalId)
    .single();
  const sucursalNombre = (sucursalRaw.data as { nombre: string } | null)?.nombre ?? 'Sucursal';

  const resumen = await obtenerCorte(dia);

  const datos = resumen.yaGenerado && resumen.corte
    ? {
        total_efectivo: resumen.corte.total_efectivo,
        total_tarjeta: resumen.corte.total_tarjeta,
        total_transferencia: resumen.corte.total_transferencia,
        total_descuentos: resumen.corte.total_descuentos,
        total_general: resumen.corte.total_general,
        total_ordenes: resumen.corte.total_ordenes,
        ordenes: (resumen.corte.detalle as any)?.ordenes ?? [],
      }
    : resumen.enVivo
    ? {
        total_efectivo: resumen.enVivo.total_efectivo,
        total_tarjeta: resumen.enVivo.total_tarjeta,
        total_transferencia: resumen.enVivo.total_transferencia,
        total_descuentos: resumen.enVivo.total_descuentos,
        total_general: resumen.enVivo.total_general,
        total_ordenes: resumen.enVivo.total_ordenes,
        ordenes: resumen.enVivo.ordenes,
      }
    : null;

  if (!datos) return { error: 'No hay datos para exportar' };

  const wb = XLSX.utils.book_new();

  const resumenRows = [
    ['Sucursal', sucursalNombre],
    ['Fecha', dia],
    [],
    ['Concepto', 'Monto'],
    ['Efectivo', datos.total_efectivo],
    ['Tarjeta', datos.total_tarjeta],
    ['Transferencia', datos.total_transferencia],
    ['Descuentos', datos.total_descuentos],
    ['Total General', datos.total_general],
    ['Total Órdenes', datos.total_ordenes],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);

  wsResumen['!cols'] = [
    { wch: 25 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const detalleHeader = ['#', 'Mesa', 'Zona', 'Mesero', 'Total', 'Método', 'Descuento', 'Items', 'Hora'];
  const detalleRows = datos.ordenes.map((o: any, i: number) => [
    i + 1,
    o.mesa,
    o.zona ?? '',
    o.mesero,
    o.total,
    o.metodo_pago,
    o.descuento,
    o.items,
    new Date(o.cerrado_a_las).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  ]);

  const wsDetalle = XLSX.utils.aoa_to_sheet([detalleHeader, ...detalleRows]);

  wsDetalle['!cols'] = [
    { wch: 6 },
    { wch: 6 },
    { wch: 10 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

  const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const buffer = Buffer.from(wbArray);
  const base64 = buffer.toString('base64');

  const fileName = `corte_${sucursalNombre.replace(/\s+/g, '_')}_${dia}.xlsx`;

  return { fileName, base64 };
}
