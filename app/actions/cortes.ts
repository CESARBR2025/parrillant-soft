"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerSucursalId } from "@/lib/sucursal";
import { authorize } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import type { Database } from "@/types/database.types";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type CorteCaja = Database["public"]["Tables"]["cortes_caja"]["Row"];

interface OrdenRow {
  id: number;
  mesa: number;
  zona: string | null;
  mesero: string;
  total: number;
  metodo_pago: string;
  descuento: number;
  items: number;
  cerrado_a_las: string;
}

interface PeriodoActual {
  inicio: string;
  saldo_inicial: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_descuentos: number;
  total_general: number;
  total_ordenes: number;
  ordenes: OrdenRow[];
}

interface CorteSummary {
  cortes: CorteCaja[];
  ultimoCorte: CorteCaja | null;
  periodoActual: PeriodoActual | null;
  aperturaHoy: string | null;
  cierreHoy: string | null;
}

function normalizarMetodo(metodo: string | null): string {
  if (!metodo) return "efectivo";
  return metodo;
}

async function obtenerInicioPeriodo(
  supabase: any,
  sucursalId: string,
  dia: string,
  ultimoCorte: CorteCaja | null,
): Promise<string> {
  if (ultimoCorte) {
    console.log(
      "[DEBUG obtenerInicioPeriodo] usando ultimoCorte.periodo_fin:",
      ultimoCorte.periodo_fin,
    );
    return ultimoCorte.periodo_fin;
  }

  const admin = getAdminClient();
  const perfilesRaw = await admin
    .from("perfiles")
    .select("id")
    .eq("rol", "caja");
  const idsCaja = (perfilesRaw.data ?? []).map((p: { id: string }) => p.id);
  if (idsCaja.length === 0) {
    console.log("[DEBUG obtenerInicioPeriodo] sin cajeros");
    const fb = `${dia}T00:00:00Z`;
    return fb;
  }

  const turnoRaw = await supabase
    .from("registro_turnos_personal")
    .select("inicio")
    .eq("sucursal_id", sucursalId)
    .in("usuario_id", idsCaja)
    .eq("activo", true)
    .is("fin", null)
    .order("inicio", { ascending: true })
    .limit(1);

  const turno = turnoRaw.data?.[0] as { inicio: string } | undefined;
  console.log("[DEBUG obtenerInicioPeriodo] turno encontrado:", turno);
  if (turno) return turno.inicio;

  const fallback = `${dia}T00:00:00Z`;
  console.log("[DEBUG obtenerInicioPeriodo] sin turno, fallback:", fallback);
  return fallback;
}

async function obtenerSaldoInicialParaPeriodo(
  supabase: any,
  sucursalId: string,
  ultimoCorte: CorteCaja | null,
): Promise<number> {
  const admin = getAdminClient();
  const perfilesRaw = await admin
    .from("perfiles")
    .select("id")
    .eq("rol", "caja");
  const idsCaja = (perfilesRaw.data ?? []).map((p: { id: string }) => p.id);
  if (idsCaja.length === 0) return 0;

  const turnoRaw = await supabase
    .from("registro_turnos_personal")
    .select("saldo_inicial_caja")
    .eq("sucursal_id", sucursalId)
    .in("usuario_id", idsCaja)
    .eq("activo", true)
    .is("fin", null)
    .order("inicio", { ascending: true })
    .limit(1);

  const turno = turnoRaw.data?.[0] as
    | { saldo_inicial_caja: number | null }
    | undefined;

  if (turno?.saldo_inicial_caja != null) {
    return turno.saldo_inicial_caja;
  }

  if (ultimoCorte?.dinero_dejado != null) {
    return ultimoCorte.dinero_dejado;
  }

  return 0;
}

async function fetchOrdenes(
  supabase: ReturnType<typeof createServerSupabaseClient> extends Promise<
    infer T
  >
    ? T
    : never,
  sucursalId: string,
  desde: string,
  hasta: string,
): Promise<PeriodoActual | null> {
  console.log("[DEBUG fetchOrdenes] params:", { sucursalId, desde, hasta });

  const ordenesRaw = await supabase
    .from("ordenes")
    .select(
      `
      id, total, metodo_pago, pagado_con, descuento, created_at, updated_at, mesa_id,
      mesas!inner(numero, zona),
      perfiles!ordenes_mesero_id_fkey!inner(nombre, apellido)
    `,
    )
    .eq("sucursal_id", sucursalId)
    .eq("estado", "cerrado")
    .gte("updated_at", desde)
    .lte("updated_at", hasta)
    .is("orden_padre_id", null)
    .order("updated_at", { ascending: true });

  console.log(
    "[DEBUG fetchOrdenes] raw count:",
    ordenesRaw.data?.length ?? 0,
    "error:",
    ordenesRaw.error?.message,
  );

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

  if (!ordenes || ordenes.length === 0) return null;

  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;
  let totalDescuentos = 0;
  let totalGeneral = 0;
  const ordenesDetalle: OrdenRow[] = [];

  for (const o of ordenes) {
    const metodo = normalizarMetodo(o.metodo_pago);
    const total = Number(o.total ?? 0);
    const descuento = Number(o.descuento ?? 0);

    totalGeneral += total;
    totalDescuentos += descuento;

    if (metodo === "efectivo") totalEfectivo += total;
    else if (metodo === "tarjeta") totalTarjeta += total;
    else if (metodo === "transferencia") totalTransferencia += total;

    ordenesDetalle.push({
      id: o.id,
      mesa: o.mesas.numero,
      zona: o.mesas.zona,
      mesero: `${o.perfiles.nombre}${o.perfiles.apellido ? ` ${o.perfiles.apellido}` : ""}`,
      total,
      metodo_pago: metodo,
      descuento,
      items: 0,
      cerrado_a_las: o.updated_at,
    });
  }

  for (const det of ordenesDetalle) {
    const { count } = await supabase
      .from("detalles_orden")
      .select("*", { count: "exact", head: true })
      .eq("orden_id", det.id);
    det.items = count ?? 0;
  }

  return {
    inicio: desde,
    saldo_inicial: 0,
    total_efectivo: totalEfectivo,
    total_tarjeta: totalTarjeta,
    total_transferencia: totalTransferencia,
    total_descuentos: totalDescuentos,
    total_general: totalGeneral,
    total_ordenes: ordenes.length,
    ordenes: ordenesDetalle,
  };
}

export async function obtenerCorte(fecha?: string): Promise<CorteSummary> {
  try {
    return await _obtenerCorteImpl(fecha);
  } catch (e) {
    console.error("[obtenerCorte] Error:", e);
    return { cortes: [], ultimoCorte: null, periodoActual: null, aperturaHoy: null, cierreHoy: null };
  }
}

async function _obtenerCorteImpl(fecha?: string): Promise<CorteSummary> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) throw new Error("Sucursal no identificada");

  const dia = fecha ?? new Date().toISOString().split("T")[0];
  console.log("[DEBUG obtenerCorte] fecha param:", fecha, "| dia usado:", dia);

  // 1. Get ALL cortes for the day (sorted newest first)
  const cortesRaw = await supabase
    .from("cortes_caja")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .eq("fecha", dia)
    .order("periodo_fin", { ascending: false });

  const cortes = (cortesRaw.data ?? []) as CorteCaja[];
  const ultimoCorte = cortes.length > 0 ? cortes[0] : null;
  console.log(
    "[DEBUG obtenerCorte] cortes encontrados:",
    cortes.length,
    "| ultimoCorte:",
    ultimoCorte?.id,
  );

  // 1.5 Get branch's schedule for today (handles recurrencia)
  const aperturasRaw = await supabase
    .from("aperturas_turno")
    .select("fecha, hora_inicio, hora_fin, recurrencia, recurrencia_fin")
    .eq("sucursal_id", sucursalId)
    .eq("activa", true);
  const aperturas = (aperturasRaw.data ?? []) as Array<{
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    recurrencia: string | null;
    recurrencia_fin: string | null;
  }>;
  let aperturaHoy: string | null = null;
  let cierreHoy: string | null = null;
  for (const a of aperturas) {
    if (a.recurrencia) {
      if (a.fecha <= dia && (!a.recurrencia_fin || a.recurrencia_fin >= dia)) {
        aperturaHoy = a.hora_inicio;
        cierreHoy = a.hora_fin;
        break;
      }
    } else if (a.fecha === dia) {
      aperturaHoy = a.hora_inicio;
      cierreHoy = a.hora_fin;
      break;
    }
  }

  // 2. Calculate the current "en vivo" period
  //    From: last corte's periodo_fin, or turno's inicio, or beginning of day
  //    To: now
  const ahora = new Date().toISOString();
  console.log("[DEBUG obtenerCorte] ahora (server):", ahora);
  const periodoDesde = await obtenerInicioPeriodo(
    supabase as any,
    sucursalId,
    dia,
    ultimoCorte,
  );
  console.log("[DEBUG obtenerCorte] periodoDesde:", periodoDesde);

  // If the last corte was generated after now (shouldn't happen), no active period
  if (ultimoCorte && ultimoCorte.periodo_fin >= ahora) {
    return { cortes, ultimoCorte, periodoActual: null, aperturaHoy, cierreHoy };
  }

  const periodoActual = await fetchOrdenes(
    supabase,
    sucursalId,
    periodoDesde,
    ahora,
  );

  // Set saldo_inicial for this period
  if (periodoActual) {
    periodoActual.saldo_inicial = await obtenerSaldoInicialParaPeriodo(
      supabase,
      sucursalId,
      ultimoCorte,
    );
    periodoActual.inicio = periodoDesde;
    console.log(
      "[DEBUG obtenerCorte] periodoActual ENCONTRADO, ordenes:",
      periodoActual.total_ordenes,
      "saldo_inicial:",
      periodoActual.saldo_inicial,
    );
  } else {
    console.log(
      "[DEBUG obtenerCorte] periodoActual es NULL (sin órdenes en el período)",
    );
  }

  return { cortes, ultimoCorte, periodoActual, aperturaHoy, cierreHoy };
}

export async function generarCorte(
  dineroDejado: number,
  fecha?: string,
): Promise<{ error?: string; corteId?: string }> {
  const auth = await authorize("sucursal.cortes.generar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) return { error: "Sucursal no identificada" };


  const hoy = fecha ?? new Date().toISOString().split("T")[0];
  const ahora = new Date().toISOString();

  // Get the last corte to determine periodo_inicio and saldo_inicial
  const ultimoCorteRaw = await supabase
    .from("cortes_caja")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .eq("fecha", hoy)
    .order("periodo_fin", { ascending: false })
    .limit(1);

  const ultimoCorte = ultimoCorteRaw.data?.[0] as CorteCaja | undefined;
  const periodoInicio = await obtenerInicioPeriodo(
    supabase as any,
    sucursalId,
    hoy,
    ultimoCorte ?? null,
  );
  const saldoInicial = await obtenerSaldoInicialParaPeriodo(
    supabase as any,
    sucursalId,
    ultimoCorte ?? null,
  );

  // Fetch orders closed in this period
  const enVivo = await fetchOrdenes(supabase, sucursalId, periodoInicio, ahora);

  if (!enVivo) {
    return {
      error: "No hay órdenes cerradas en este período para generar el corte",
    };
  }

  const detalle = {
    generado_el: ahora,
    sucursal_id: sucursalId,
    ordenes: enVivo.ordenes,
  };

  const insertRaw = await supabase
    .from("cortes_caja")
    .insert({
      sucursal_id: sucursalId,
      fecha: hoy,
      periodo_inicio: periodoInicio,
      periodo_fin: ahora,
      saldo_inicial: saldoInicial,
      total_efectivo: enVivo.total_efectivo,
      total_tarjeta: enVivo.total_tarjeta,
      total_transferencia: enVivo.total_transferencia,
      total_descuentos: enVivo.total_descuentos,
      total_general: enVivo.total_general,
      total_ordenes: enVivo.total_ordenes,
      dinero_dejado: dineroDejado,
      generado_por: auth.userId,
      detalle: detalle as any,
    })
    .select("id")
    .single();

  const corte = insertRaw.data as { id: string } | null;
  const error = insertRaw.error;

  if (error || !corte) {
    return { error: error?.message ?? "Error al generar el corte" };
  }

  // Auto-cerrar turno del cajero
  try {
    const perfilRaw = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", auth.userId)
      .single();
    const perfil = perfilRaw.data as { rol: string } | null;

    if (perfil?.rol === "caja") {
      await supabase
        .from("registro_turnos_personal")
        .update({ fin: ahora, activo: false })
        .eq("usuario_id", auth.userId)
        .eq("sucursal_id", sucursalId)
        .eq("activo", true)
        .is("fin", null);
    }
  } catch (e) {
    console.error("[generarCorte] Error al cerrar turno:", e);
  }

  return { corteId: corte.id };
}

export async function obtenerSaldoInicialSugerido(): Promise<{
  monto: number;
}> {
  const supabase = await createServerSupabaseClient();

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) return { monto: 0 };

  const ultimoCorteRaw = await supabase
    .from("cortes_caja")
    .select("dinero_dejado")
    .eq("sucursal_id", sucursalId)
    .not("dinero_dejado", "is", null)
    .order("periodo_fin", { ascending: false })
    .limit(1);

  const ultimoCorte = ultimoCorteRaw.data?.[0] as
    | { dinero_dejado: number }
    | undefined;

  return { monto: ultimoCorte?.dinero_dejado ?? 0 };
}

export async function exportarCorteExcel(fecha?: string): Promise<{
  error?: string;
  fileName?: string;
  base64?: string;
}> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) return { error: "Sucursal no identificada" };

  const dia = fecha ?? new Date().toISOString().split("T")[0];

  const sucursalRaw = await supabase
    .from("sucursales")
    .select("nombre")
    .eq("id", sucursalId)
    .single();
  const sucursalNombre =
    (sucursalRaw.data as { nombre: string } | null)?.nombre ?? "Sucursal";

  const resumen = await obtenerCorte(dia);

  // Combine all cortes + periodos actuales for export
  const allOrdenes: OrdenRow[] = [];

  // Add orders from stored cortes
  for (const c of resumen.cortes) {
    const detalle = c.detalle as { ordenes: OrdenRow[] } | null;
    if (detalle?.ordenes) {
      allOrdenes.push(...detalle.ordenes);
    }
  }

  // Add current period orders
  if (resumen.periodoActual) {
    allOrdenes.push(...resumen.periodoActual.ordenes);
  }

  // Calculate combined totals
  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;
  let totalDescuentos = 0;
  let totalGeneral = 0;

  for (const o of allOrdenes) {
    totalGeneral += o.total;
    totalDescuentos += o.descuento;
    if (o.metodo_pago === "efectivo") totalEfectivo += o.total;
    else if (o.metodo_pago === "tarjeta") totalTarjeta += o.total;
    else if (o.metodo_pago === "transferencia") totalTransferencia += o.total;
  }

  const wb = XLSX.utils.book_new();

  const resumenRows = [
    ["Sucursal", sucursalNombre],
    ["Fecha", dia],
    [],
    ["Concepto", "Monto"],
    ["Efectivo", totalEfectivo],
    ["Tarjeta", totalTarjeta],
    ["Transferencia", totalTransferencia],
    ["Descuentos", totalDescuentos],
    ["Total General", totalGeneral],
    ["Total Órdenes", allOrdenes.length],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);

  wsResumen["!cols"] = [{ wch: 25 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  const detalleHeader = [
    "#",
    "Mesa",
    "Zona",
    "Mesero",
    "Total",
    "Método",
    "Descuento",
    "Items",
    "Hora",
  ];
  const detalleRows = allOrdenes.map((o, i) => [
    i + 1,
    o.mesa,
    o.zona ?? "",
    o.mesero,
    o.total,
    o.metodo_pago,
    o.descuento,
    o.items,
    new Date(o.cerrado_a_las).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  ]);

  const wsDetalle = XLSX.utils.aoa_to_sheet([detalleHeader, ...detalleRows]);

  wsDetalle["!cols"] = [
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

  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

  const wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const buffer = Buffer.from(wbArray);
  const base64 = buffer.toString("base64");

  const fileName = `corte_${sucursalNombre.replace(/\s+/g, "_")}_${dia}.xlsx`;

  return { fileName, base64 };
}
