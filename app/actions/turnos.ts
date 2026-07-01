"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerSucursalId, getServerSucursalSlug } from "@/lib/sucursal";
import { createClient } from "@supabase/supabase-js";
import { authorize } from "@/lib/auth";

export async function programarApertura(
  sucursalId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  recurrencia?: string | null,
  recurrenciaFin?: string | null,
) {
  const auth = await authorize("sucursal.turnos.administrar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  if (horaInicio >= horaFin) {
    return { error: "La hora de inicio debe ser anterior a la hora de fin" };
  }

  if (recurrencia && !recurrenciaFin) {
    return { error: "Debes especificar una fecha fin para la recurrencia" };
  }

  const { error } = await (supabase as any).from("aperturas_turno").insert({
    sucursal_id: sucursalId,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    recurrencia: recurrencia ?? null,
    recurrencia_fin: recurrenciaFin ?? null,
    creada_por: auth.userId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/turnos");
  const slug = await getServerSucursalSlug();
  if (slug) {
    revalidatePath(`/${slug}/admin/turnos`);
  }

  return { success: true };
}

export async function modificarApertura(
  aperturaId: string,
  data: {
    hora_inicio?: string;
    hora_fin?: string;
    activa?: boolean;
    recurrencia?: string | null;
    recurrencia_fin?: string | null;
  },
) {
  const auth = await authorize("sucursal.turnos.administrar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  if (data.hora_inicio && data.hora_fin && data.hora_inicio >= data.hora_fin) {
    return { error: "La hora de inicio debe ser anterior a la hora de fin" };
  }

  const { error } = await (supabase as any)
    .from("aperturas_turno")
    .update(data)
    .eq("id", aperturaId);

  if (error) return { error: error.message };

  revalidatePath("/admin/turnos");
  return { success: true };
}

export async function toggleApertura(aperturaId: string, activa: boolean) {
  return modificarApertura(aperturaId, { activa });
}

export async function eliminarApertura(aperturaId: string) {
  const auth = await authorize("sucursal.turnos.administrar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  const { error } = await (supabase as any)
    .from("aperturas_turno")
    .delete()
    .eq("id", aperturaId);

  if (error) {
    console.error("[eliminarApertura] Supabase error:", error);
    return { error: error.message };
  }

  console.log("[eliminarApertura] delete exitoso, revalidando...");

  revalidatePath("/admin/turnos");
  const slug = await getServerSucursalSlug();
  if (slug) {
    revalidatePath(`/${slug}/admin/turnos`);
  }

  return { success: true };
}

export async function crearExcepcion(
  aperturaId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
) {
  const auth = await authorize("sucursal.turnos.administrar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  if (horaInicio >= horaFin) {
    return { error: "La hora de inicio debe ser anterior a la hora de fin" };
  }

  // Upsert: si ya existe excepción para esta apertura+fecha, actualiza
  const existenteRaw = await (supabase as any)
    .from("aperturas_excepciones")
    .select("id")
    .eq("apertura_id", aperturaId)
    .eq("fecha", fecha)
    .maybeSingle();
  const existente = existenteRaw.data as { id: string } | null;

  if (existente) {
    const { error } = await (supabase as any)
      .from("aperturas_excepciones")
      .update({ hora_inicio: horaInicio, hora_fin: horaFin })
      .eq("id", existente.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await (supabase as any)
      .from("aperturas_excepciones")
      .insert({
        apertura_id: aperturaId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/turnos");
  return { success: true };
}

export async function eliminarExcepcion(excepcionId: string) {
  const auth = await authorize("sucursal.turnos.administrar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;

  const { error } = await (supabase as any)
    .from("aperturas_excepciones")
    .delete()
    .eq("id", excepcionId);

  if (error) return { error: error.message };

  revalidatePath("/admin/turnos");
  return { success: true };
}

export async function obtenerCalendarioMensual(
  sucursalId: string,
  anio: number,
  mes: number,
) {
  const supabase = await createServerSupabaseClient();

  const primerDia = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(anio, mes, 0).toISOString().split("T")[0];

  const aperturasRaw = await (supabase as any)
    .from("aperturas_turno")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .eq("activa", true)
    .lte("fecha", ultimoDia)
    .order("fecha");

  if (aperturasRaw.error) {
    console.error(
      "[obtenerCalendarioMensual] error fetching aperturas:",
      aperturasRaw.error,
    );
    return { dias: [], aperturas: [], excepciones: [] };
  }

  const aperturas: any[] = aperturasRaw.data ?? [];

  // Filtrar: incluir solo las que cubren este mes
  const aperturasDelMes = aperturas.filter((a: any) => {
    if (!a.recurrencia) {
      return a.fecha >= primerDia && a.fecha <= ultimoDia;
    }
    return (
      a.fecha <= ultimoDia &&
      (!a.recurrencia_fin || a.recurrencia_fin >= primerDia)
    );
  });

  // Excepciones del mes
  const excepcionesRaw = await (supabase as any)
    .from("aperturas_excepciones")
    .select("*")
    .in(
      "apertura_id",
      aperturasDelMes.map((a: any) => a.id),
    )
    .gte("fecha", primerDia)
    .lte("fecha", ultimoDia);
  const excepciones: any[] = excepcionesRaw.data ?? [];

  // Construir días del mes
  const diasDelMes: {
    fecha: string;
    apertura: any | null;
    excepcion: any | null;
  }[] = [];

  const diaActual = new Date(primerDia);
  const ultimo = new Date(ultimoDia);
  while (diaActual <= ultimo) {
    const fechaStr = diaActual.toISOString().split("T")[0];
    const diaSemana = diaActual.getDay();

    let aperturaAsignada: any | null = null;
    let excepcionAsignada: any | null = null;

    for (const a of aperturasDelMes) {
      if (!a.recurrencia) {
        if (a.fecha === fechaStr) {
          aperturaAsignada = a;
          break;
        }
      } else {
        // Recurrente: cumple con el rango y con la regla
        if (
          a.fecha <= fechaStr &&
          (!a.recurrencia_fin || a.recurrencia_fin >= fechaStr)
        ) {
          if (a.recurrencia === "semanal" || a.recurrencia === "mensual" || a.recurrencia === "anual") {
            aperturaAsignada = a;
            break;
          }
        }
      }
    }

    if (aperturaAsignada) {
      excepcionAsignada =
        excepciones.find(
          (e: any) =>
            e.apertura_id === aperturaAsignada.id && e.fecha === fechaStr,
        ) ?? null;
    }

    diasDelMes.push({
      fecha: fechaStr,
      apertura: aperturaAsignada,
      excepcion: excepcionAsignada,
    });

    diaActual.setDate(diaActual.getDate() + 1);
  }

  return { dias: diasDelMes, aperturas: aperturasDelMes, excepciones };
}

function normalizarHora(h: string): string {
  return h.length > 5 ? h.slice(0, 5) : h;
}

export async function registrarTurno(
  sucursalId?: string,
  redirectSlug?: string,
) {
  const auth = await authorize("turnos.registrar");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;
  const userId = auth.userId;

  if (!sucursalId) {
    const cookieId = await getServerSucursalId();
    if (!cookieId) {
      console.error("[registrarTurno] Sucursal no encontrada en cookie");
      return { error: "Sucursal no encontrada" };
    }
    sucursalId = cookieId;
  }

  if (!redirectSlug) {
    redirectSlug = (await getServerSucursalSlug()) ?? undefined;
  }

  const turnoExistenteRaw = await (supabase as any)
    .from("registro_turnos_personal")
    .select("id")
    .eq("usuario_id", userId)
    .eq("activo", true)
    .is("fin", null)
    .maybeSingle();
  const turnoExistente = turnoExistenteRaw.data as { id: string } | null;

  if (turnoExistente) {
    return {
      error: "Ya tienes un turno activo. Ciérralo antes de registrar otro.",
    };
  }

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split("T")[0];
  const horaActual = hoy.toTimeString().slice(0, 5);

  console.log("[registrarTurno] Buscando apertura:", {
    sucursalId,
    hoyStr,
    horaActual,
  });

  const aperturaRaw = await (supabase as any)
    .from("aperturas_turno")
    .select("id, fecha, recurrencia, recurrencia_fin, hora_inicio, hora_fin")
    .eq("sucursal_id", sucursalId)
    .eq("activa", true);
  const aperturas = aperturaRaw.data ?? [];

  console.log(
    "[registrarTurno] Aperturas encontradas:",
    aperturas.length,
    JSON.stringify(aperturas),
  );

  let aperturaId: string | null = null;
  for (const a of aperturas) {
    console.log("[registrarTurno] Evaluando apertura:", {
      id: a.id,
      fecha: a.fecha,
      recurrencia: a.recurrencia,
      hi: a.hora_inicio,
      hf: a.hora_fin,
    });

    if (!a.recurrencia) {
      if (a.fecha !== hoyStr) {
        console.log("[registrarTurno] -> descartada: fecha no coincide");
        continue;
      }
    } else {
      if (a.fecha > hoyStr) {
        console.log("[registrarTurno] -> descartada: fecha futura");
        continue;
      }
      if (a.recurrencia_fin && a.recurrencia_fin < hoyStr) {
        console.log("[registrarTurno] -> descartada: recurrencia_fin pasó");
        continue;
      }
    }

    const excRaw = await (supabase as any)
      .from("aperturas_excepciones")
      .select("hora_inicio, hora_fin")
      .eq("apertura_id", a.id)
      .eq("fecha", hoyStr)
      .maybeSingle();
    const exc = excRaw.data as { hora_inicio: string; hora_fin: string } | null;
    const hi = normalizarHora(exc?.hora_inicio ?? a.hora_inicio);
    const hf = normalizarHora(exc?.hora_fin ?? a.hora_fin);

    console.log("[registrarTurno] Comparando horas:", {
      hi,
      hf,
      horaActual,
      condicion: `${hi} <= ${horaActual} && ${hf} >= ${horaActual}`,
    });

    if (hi <= horaActual && hf >= horaActual) {
      aperturaId = a.id;
      console.log("[registrarTurno] -> apertura MATCH:", aperturaId);
      break;
    } else {
      console.log("[registrarTurno] -> descartada: fuera del horario");
    }
  }

  if (!aperturaId) {
    console.error(
      "[registrarTurno] No se encontró apertura activa para hoy en este horario",
    );
    return {
      error: "No hay un turno abierto en esta sucursal en este momento",
    };
  }

  console.log("[registrarTurno] Insertando turno:", {
    apertura_id: aperturaId,
    usuario_id: userId,
    sucursal_id: sucursalId,
  });

  const turnoRaw = await (supabase as any)
    .from("registro_turnos_personal")
    .insert({
      apertura_id: aperturaId,
      usuario_id: userId,
      sucursal_id: sucursalId,
    })
    .select()
    .single();
  const turno = turnoRaw.data as { id: string } | null;
  const error = turnoRaw.error;

  if (error) {
    console.error("[registrarTurno] Error al insertar turno:", error);
    return { error: error.message };
  }

  console.log("[registrarTurno] Turno registrado exitosamente:", turno?.id);

  if (redirectSlug) {
    revalidatePath(`/${redirectSlug}/mesero`);
  }

  const slug = await getServerSucursalSlug();
  if (slug) {
    revalidatePath(`/${slug}/admin/turnos`);
  }

  return { success: true, turno, redirectSlug };
}

export async function cerrarTurno(turnoId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const turnoRaw = await (supabase as any)
    .from("registro_turnos_personal")
    .select("usuario_id, sucursal_id, inicio")
    .eq("id", turnoId)
    .single();
  const turno = turnoRaw.data as {
    usuario_id: string;
    sucursal_id: string;
    inicio: string;
  } | null;

  if (!turno) return { error: "Turno no encontrado" };

  const esAdmin = (await authorize("turnos.cerrar_cualquiera")).authorized;
  const esPropio = turno.usuario_id === user.id;

  if (!esAdmin && !esPropio) {
    return { error: "No puedes cerrar el turno de otro usuario" };
  }

  const ahora = new Date().toISOString();
  const hoy = ahora.split('T')[0];

  // Check if this user's role requires corte before closing
  const perfilRaw = await (supabase as any)
    .from("perfiles")
    .select("rol")
    .eq("id", turno.usuario_id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (perfil) {
    const puedeCorte = await (supabase as any)
      .from("roles_permisos")
      .select("*", { count: "exact", head: true })
      .eq("rol_nombre", perfil.rol)
      .eq("permiso_codigo", "sucursal.cortes.generar");

    if (puedeCorte.count && puedeCorte.count > 0) {
      const ultimoCorteRaw = await (supabase as any)
        .from("cortes_caja")
        .select("periodo_fin")
        .eq("sucursal_id", turno.sucursal_id)
        .eq("fecha", hoy)
        .order("periodo_fin", { ascending: false })
        .limit(1);

      const ultimoCorte = ultimoCorteRaw.data?.[0] as { periodo_fin: string } | null;

      const desde = ultimoCorte
        ? ultimoCorte.periodo_fin
        : `${hoy}T00:00:00Z`;

      if (desde < ahora) {
        const { count } = await (supabase as any)
          .from("ordenes")
          .select("*", { count: "exact", head: true })
          .eq("sucursal_id", turno.sucursal_id)
          .eq("estado", "cerrado")
          .gte("updated_at", desde)
          .lt("updated_at", ahora);

        if (count && count > 0) {
          return {
            error: "Debes generar un corte de caja antes de cerrar este turno. Hay órdenes cerradas pendientes de corte.",
            requiereCorte: true,
          };
        }
      }
    }
  }

  const { error } = await (supabase as any)
    .from("registro_turnos_personal")
    .update({
      fin: ahora,
      activo: false,
      cerrado_por: esAdmin ? user.id : null,
    })
    .eq("id", turnoId);

  if (error) {
    console.error("[cerrarTurno] Supabase error:", error);
    return { error: error.message };
  }

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/mesero`);
  revalidatePath("/admin/turnos");
  if (slug) {
    revalidatePath(`/${slug}/admin/turnos`);
  }

  return { success: true };
}

export async function reasignarTurno(turnoId: string, nuevaSucursalId: string) {
  const auth = await authorize("turnos.cerrar_cualquiera");
  if (!auth.authorized) return { error: auth.error };
  const supabase = auth.supabase;
  const userId = auth.userId;

  const turnoRaw = await (supabase as any)
    .from("registro_turnos_personal")
    .select("*")
    .eq("id", turnoId)
    .single();
  const turno = turnoRaw.data as {
    usuario_id: string;
    sucursal_id: string;
    activo: boolean;
  } | null;

  if (!turno) return { error: "Turno no encontrado" };
  if (!turno.activo) return { error: "El turno ya está cerrado" };

  const { error: cerrarError } = await (supabase as any)
    .from("registro_turnos_personal")
    .update({
      fin: new Date().toISOString(),
      activo: false,
      cerrado_por: userId,
    })
    .eq("id", turnoId);

  if (cerrarError) {
    console.error("[reasignarTurno] cerrar error:", cerrarError);
    return { error: cerrarError.message };
  }

  const nuevoTurnoRaw = await (supabase as any)
    .from("registro_turnos_personal")
    .insert({
      usuario_id: turno.usuario_id,
      sucursal_id: nuevaSucursalId,
      reasignado_de: turno.sucursal_id,
      notas: `Reasignado de sucursal ${turno.sucursal_id}`,
    })
    .select()
    .single();
  const nuevoTurno = nuevoTurnoRaw.data as { id: string } | null;
  const abrirError = nuevoTurnoRaw.error;

  if (abrirError) {
    console.error("[reasignarTurno] insert error:", abrirError);
    return { error: abrirError.message };
  }

  revalidatePath("/admin/turnos");
  const slug = await getServerSucursalSlug();
  if (slug) {
    revalidatePath(`/${slug}/admin/turnos`);
  }

  return { success: true, turno: nuevoTurno };
}

export async function obtenerSucursalesConApertura() {
  const supabase = await createServerSupabaseClient();

  const hoy = new Date().toISOString().split("T")[0];
  const horaActual = new Date().toTimeString().slice(0, 5);

  // Aperturas de día único
  const unicasRaw = await (supabase as any)
    .from("aperturas_turno")
    .select(
      "id, sucursal_id, hora_inicio, hora_fin, sucursales!inner(id, slug, nombre)",
    )
    .eq("fecha", hoy)
    .lte("hora_inicio", horaActual)
    .gte("hora_fin", horaActual)
    .eq("activa", true);
  const unicas = unicasRaw.data ?? [];

  // Aperturas recurrentes activas hoy
  const recurrentesRaw = await (supabase as any)
    .from("aperturas_turno")
    .select(
      "id, sucursal_id, recurrencia, recurrencia_fin, hora_inicio, hora_fin, sucursales!inner(id, slug, nombre)",
    )
    .lte("fecha", hoy)
    .eq("activa", true)
    .not("recurrencia", "is", null);
  const recurrentes = recurrentesRaw.data ?? [];

  // Filtrar recurrentes que cubren hoy
  const activas = new Map<
    string,
    { id: string; slug: string; nombre: string }
  >();

  for (const row of unicas) {
    const s = row.sucursales as unknown as {
      id: string;
      slug: string;
      nombre: string;
    };
    activas.set(s.id, s);
  }

  for (const row of recurrentes) {
    if (activas.has(row.sucursal_id)) continue;
    if (row.recurrencia_fin && row.recurrencia_fin < hoy) continue;
    if (
      row.recurrencia !== "semanal" &&
      row.recurrencia !== "mensual" &&
      row.recurrencia !== "anual"
    )
      continue;

    // Verificar excepción para hoy
    const excRaw = await (supabase as any)
      .from("aperturas_excepciones")
      .select("hora_inicio, hora_fin")
      .eq("apertura_id", row.id)
      .eq("fecha", hoy)
      .maybeSingle();
    const exc = excRaw.data as { hora_inicio: string; hora_fin: string } | null;
    const hi = exc?.hora_inicio ?? row.hora_inicio;
    const hf = exc?.hora_fin ?? row.hora_fin;

    if (hi <= horaActual && hf >= horaActual) {
      const s = row.sucursales as unknown as {
        id: string;
        slug: string;
        nombre: string;
      };
      activas.set(s.id, s);
    }
  }

  return Array.from(activas.values());
}

export async function obtenerSucursalesConTurnosActivos() {
  'use server';
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('[obtenerSucursalesConTurnosActivos] auth error:', userError, user);
    return [];
  }

  console.log('[obtenerSucursalesConTurnosActivos] user autenticado:', user.id);

  const raw = await (supabase as any)
    .from('registro_turnos_personal')
    .select('sucursal_id')
    .eq('activo', true)
    .is('fin', null);

  if (raw.error) {
    console.error('[obtenerSucursalesConTurnosActivos] query error:', raw.error);
    return [];
  }

  if (!raw.data || raw.data.length === 0) {
    console.log('[obtenerSucursalesConTurnosActivos] no se encontraron turnos activos');
    return [];
  }

  console.log('[obtenerSucursalesConTurnosActivos] datos crudos:', raw.data);

  const ids: string[] = [...new Set<string>(
    raw.data.map((r: any) => r.sucursal_id)
  )];

  console.log('[obtenerSucursalesConTurnosActivos] ids resultado:', ids);
  return ids;
}

export async function registrarSaldoInicialCaja(
  turnoId: string,
  monto: number,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  if (monto < 0) return { error: 'El saldo inicial no puede ser negativo' };

  const { error } = await (supabase as any)
    .from('registro_turnos_personal')
    .update({ saldo_inicial_caja: monto })
    .eq('id', turnoId)
    .eq('usuario_id', user.id)
    .eq('activo', true);

  if (error) {
    console.error('[registrarSaldoInicialCaja] Error:', error);
    return { error: error.message };
  }

  return { success: true };
}

export async function obtenerTurnoActivo(accessToken?: string) {
  const supabase = accessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
      )
    : await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { slug: null };

  const auth = await authorize("turnos.registrar");
  if (!auth.authorized) return { slug: null };

  const turnoRaw = await (supabase as any)
    .from("registro_turnos_personal")
    .select("sucursal_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .is("fin", null)
    .maybeSingle();
  const turno = turnoRaw.data as { sucursal_id: string } | null;
  if (!turno) return { slug: null };

  const sucRaw = await (supabase as any)
    .from("sucursales")
    .select("slug")
    .eq("id", turno.sucursal_id)
    .single();
  if (!sucRaw.data) return { slug: null };

  return { slug: sucRaw.data.slug };
}
