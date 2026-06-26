'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId, getServerSucursalSlug } from '@/lib/sucursal';
import { createClient } from '@supabase/supabase-js';

async function verifyAdmin(supabase: any): Promise<{ user: any } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'super_admin' && perfil.rol !== 'admin')) {
    return { error: 'No tienes permisos' };
  }

  return { user };
}

export async function programarApertura(
  sucursalId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  recurrencia?: string | null,
  recurrenciaFin?: string | null
) {
  const supabase = await createServerSupabaseClient();
  const auth = await verifyAdmin(supabase as any);
  if ('error' in auth) return auth;

  if (horaInicio >= horaFin) {
    return { error: 'La hora de inicio debe ser anterior a la hora de fin' };
  }

  if (recurrencia && !recurrenciaFin) {
    return { error: 'Debes especificar una fecha fin para la recurrencia' };
  }

  const { error } = await (supabase as any)
    .from('aperturas_turno')
    .insert({
      sucursal_id: sucursalId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      recurrencia: recurrencia ?? null,
      recurrencia_fin: recurrenciaFin ?? null,
      creada_por: auth.user.id,
    });

  if (error) return { error: error.message };

  revalidatePath('/admin/turnos');
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
  }
) {
  const supabase = await createServerSupabaseClient();
  const auth = await verifyAdmin(supabase as any);
  if ('error' in auth) return auth;

  if (data.hora_inicio && data.hora_fin && data.hora_inicio >= data.hora_fin) {
    return { error: 'La hora de inicio debe ser anterior a la hora de fin' };
  }

  const { error } = await (supabase as any)
    .from('aperturas_turno')
    .update(data)
    .eq('id', aperturaId);

  if (error) return { error: error.message };

  revalidatePath('/admin/turnos');
  return { success: true };
}

export async function toggleApertura(aperturaId: string, activa: boolean) {
  return modificarApertura(aperturaId, { activa });
}

export async function eliminarApertura(aperturaId: string) {
  const supabase = await createServerSupabaseClient();
  const auth = await verifyAdmin(supabase as any);
  if ('error' in auth) return auth;

  const { error } = await (supabase as any)
    .from('aperturas_turno')
    .delete()
    .eq('id', aperturaId);

  if (error) return { error: error.message };

  revalidatePath('/admin/turnos');
  return { success: true };
}

export async function crearExcepcion(
  aperturaId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string
) {
  const supabase = await createServerSupabaseClient();
  const auth = await verifyAdmin(supabase as any);
  if ('error' in auth) return auth;

  if (horaInicio >= horaFin) {
    return { error: 'La hora de inicio debe ser anterior a la hora de fin' };
  }

  // Upsert: si ya existe excepción para esta apertura+fecha, actualiza
  const existenteRaw = await (supabase as any)
    .from('aperturas_excepciones')
    .select('id')
    .eq('apertura_id', aperturaId)
    .eq('fecha', fecha)
    .maybeSingle();
  const existente = existenteRaw.data as { id: string } | null;

  if (existente) {
    const { error } = await (supabase as any)
      .from('aperturas_excepciones')
      .update({ hora_inicio: horaInicio, hora_fin: horaFin })
      .eq('id', existente.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await (supabase as any)
      .from('aperturas_excepciones')
      .insert({ apertura_id: aperturaId, fecha, hora_inicio: horaInicio, hora_fin: horaFin });
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/turnos');
  return { success: true };
}

export async function eliminarExcepcion(excepcionId: string) {
  const supabase = await createServerSupabaseClient();
  const auth = await verifyAdmin(supabase as any);
  if ('error' in auth) return auth;

  const { error } = await (supabase as any)
    .from('aperturas_excepciones')
    .delete()
    .eq('id', excepcionId);

  if (error) return { error: error.message };

  revalidatePath('/admin/turnos');
  return { success: true };
}

export async function obtenerCalendarioMensual(sucursalId: string, anio: number, mes: number) {
  const supabase = await createServerSupabaseClient();

  const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anio, mes, 0).toISOString().split('T')[0];

  // Todas las aperturas de la sucursal que cubren este mes
  const aperturasRaw = await (supabase as any)
    .from('aperturas_turno')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .lte('fecha', ultimoDia)
    .eq('activa', true)
    .order('fecha');
  const aperturas: any[] = aperturasRaw.data ?? [];

  // Filtrar: incluir solo las que están activas y cubren este mes
  const aperturasDelMes = aperturas.filter((a: any) => {
    if (!a.recurrencia) {
      return a.fecha >= primerDia && a.fecha <= ultimoDia;
    }
    // Recurrente: fecha_inicio <= ultimoDia AND (recurrencia_fin >= primerDia OR recurrencia_fin IS NULL)
    return a.fecha <= ultimoDia && (!a.recurrencia_fin || a.recurrencia_fin >= primerDia);
  });

  // Excepciones del mes
  const excepcionesRaw = await (supabase as any)
    .from('aperturas_excepciones')
    .select('*')
    .in('apertura_id', aperturasDelMes.map((a: any) => a.id))
    .gte('fecha', primerDia)
    .lte('fecha', ultimoDia);
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
    const fechaStr = diaActual.toISOString().split('T')[0];
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
        if (a.fecha <= fechaStr && (!a.recurrencia_fin || a.recurrencia_fin >= fechaStr)) {
          if (a.recurrencia === 'semanal') {
            // Todos los días de la semana
            aperturaAsignada = a;
            break;
          } else if (a.recurrencia === 'mensual') {
            // Todos los días del mes
            aperturaAsignada = a;
            break;
          }
        }
      }
    }

    if (aperturaAsignada) {
      excepcionAsignada = excepciones.find(
        (e: any) => e.apertura_id === aperturaAsignada.id && e.fecha === fechaStr
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

export async function registrarTurno(
  sucursalId?: string,
  redirectSlug?: string
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || perfil.rol !== 'mesero') {
    return { error: 'Solo los meseros pueden registrar turno' };
  }

  if (!sucursalId) {
    const cookieId = await getServerSucursalId();
    if (!cookieId) return { error: 'Sucursal no encontrada' };
    sucursalId = cookieId;
  }

  if (!redirectSlug) {
    redirectSlug = await getServerSucursalSlug() ?? undefined;
  }

  const turnoExistenteRaw = await (supabase as any)
    .from('turnos')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('activo', true)
    .is('fin', null)
    .maybeSingle();
  const turnoExistente = turnoExistenteRaw.data as { id: string } | null;

  if (turnoExistente) {
    return { error: 'Ya tienes un turno activo. Ciérralo antes de registrar otro.' };
  }

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  const horaActual = hoy.toTimeString().slice(0, 5);

  // Traer TODAS las aperturas activas de la sucursal (sin filtro de fecha en SQL)
  const aperturaRaw = await (supabase as any)
    .from('aperturas_turno')
    .select('id, fecha, recurrencia, recurrencia_fin, hora_inicio, hora_fin')
    .eq('sucursal_id', sucursalId)
    .eq('activa', true);
  const aperturas = aperturaRaw.data ?? [];

  // Encontrar apertura que cubra ahora
  let aperturaId: string | null = null;
  for (const a of aperturas) {
    if (!a.recurrencia) {
      // Día único: fecha debe ser hoy
      if (a.fecha !== hoyStr) continue;
    } else {
      // Recurrente: fecha_incio <= hoy <= recurrencia_fin
      if (a.fecha > hoyStr) continue;
      if (a.recurrencia_fin && a.recurrencia_fin < hoyStr) continue;
    }

    // Verificar excepción para hoy
    const excRaw = await (supabase as any)
      .from('aperturas_excepciones')
      .select('hora_inicio, hora_fin')
      .eq('apertura_id', a.id)
      .eq('fecha', hoyStr)
      .maybeSingle();
    const exc = excRaw.data as { hora_inicio: string; hora_fin: string } | null;
    const hi = exc?.hora_inicio ?? a.hora_inicio;
    const hf = exc?.hora_fin ?? a.hora_fin;

    if (hi <= horaActual && hf >= horaActual) {
      aperturaId = a.id;
      break;
    }
  }

  if (!aperturaId) {
    return { error: 'No hay un turno abierto en esta sucursal en este momento' };
  }

  const turnoRaw = await (supabase as any)
    .from('turnos')
    .insert({
      apertura_id: aperturaId,
      usuario_id: user.id,
      sucursal_id: sucursalId,
    })
    .select()
    .single();
  const turno = turnoRaw.data as { id: string } | null;
  const error = turnoRaw.error;

  if (error) return { error: error.message };

  if (redirectSlug) {
    revalidatePath(`/${redirectSlug}/mesero`);
  }

  return { success: true, turno, redirectSlug };
}

export async function cerrarTurno(turnoId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const turnoRaw = await (supabase as any)
    .from('turnos')
    .select('usuario_id, sucursal_id')
    .eq('id', turnoId)
    .single();
  const turno = turnoRaw.data as { usuario_id: string; sucursal_id: string } | null;

  if (!turno) return { error: 'Turno no encontrado' };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  const esAdmin = perfil?.rol === 'super_admin' || perfil?.rol === 'admin';
  const esPropio = turno.usuario_id === user.id;

  if (!esAdmin && !esPropio) {
    return { error: 'No puedes cerrar el turno de otro usuario' };
  }

  const { error } = await (supabase as any)
    .from('turnos')
    .update({
      fin: new Date().toISOString(),
      activo: false,
      cerrado_por: esAdmin ? user.id : null,
    })
    .eq('id', turnoId);

  if (error) return { error: error.message };

  const slug = await getServerSucursalSlug();
  revalidatePath(`/${slug}/mesero`);
  revalidatePath('/admin/turnos');

  return { success: true };
}

export async function reasignarTurno(turnoId: string, nuevaSucursalId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'super_admin' && perfil.rol !== 'admin')) {
    return { error: 'No tienes permisos para reasignar turnos' };
  }

  const turnoRaw = await (supabase as any)
    .from('turnos')
    .select('*')
    .eq('id', turnoId)
    .single();
  const turno = turnoRaw.data as { usuario_id: string; sucursal_id: string; activo: boolean } | null;

  if (!turno) return { error: 'Turno no encontrado' };
  if (!turno.activo) return { error: 'El turno ya está cerrado' };

  const { error: cerrarError } = await (supabase as any)
    .from('turnos')
    .update({
      fin: new Date().toISOString(),
      activo: false,
      cerrado_por: user.id,
    })
    .eq('id', turnoId);

  if (cerrarError) return { error: cerrarError.message };

  const nuevoTurnoRaw = await (supabase as any)
    .from('turnos')
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

  if (abrirError) return { error: abrirError.message };

  revalidatePath('/admin/turnos');
  return { success: true, turno: nuevoTurno };
}

export async function obtenerSucursalesConApertura() {
  const supabase = await createServerSupabaseClient();

  const hoy = new Date().toISOString().split('T')[0];
  const horaActual = new Date().toTimeString().slice(0, 5);

  // Aperturas de día único
  const unicasRaw = await (supabase as any)
    .from('aperturas_turno')
    .select('id, sucursal_id, hora_inicio, hora_fin, sucursales!inner(id, slug, nombre)')
    .eq('fecha', hoy)
    .lte('hora_inicio', horaActual)
    .gte('hora_fin', horaActual)
    .eq('activa', true);
  const unicas = unicasRaw.data ?? [];

  // Aperturas recurrentes activas hoy
  const recurrentesRaw = await (supabase as any)
    .from('aperturas_turno')
    .select('id, sucursal_id, recurrencia, recurrencia_fin, hora_inicio, hora_fin, sucursales!inner(id, slug, nombre)')
    .lte('fecha', hoy)
    .eq('activa', true)
    .not('recurrencia', 'is', null);
  const recurrentes = recurrentesRaw.data ?? [];

  // Filtrar recurrentes que cubren hoy
  const activas = new Map<string, { id: string; slug: string; nombre: string }>();

  for (const row of unicas) {
    const s = row.sucursales as unknown as { id: string; slug: string; nombre: string };
    activas.set(s.id, s);
  }

  for (const row of recurrentes) {
    if (activas.has(row.sucursal_id)) continue;
    if (row.recurrencia_fin && row.recurrencia_fin < hoy) continue;
    if (row.recurrencia !== 'semanal' && row.recurrencia !== 'mensual' && row.recurrencia !== 'anual') continue;

    // Verificar excepción para hoy
    const excRaw = await (supabase as any)
      .from('aperturas_excepciones')
      .select('hora_inicio, hora_fin')
      .eq('apertura_id', row.id)
      .eq('fecha', hoy)
      .maybeSingle();
    const exc = excRaw.data as { hora_inicio: string; hora_fin: string } | null;
    const hi = exc?.hora_inicio ?? row.hora_inicio;
    const hf = exc?.hora_fin ?? row.hora_fin;

    if (hi <= horaActual && hf >= horaActual) {
      const s = row.sucursales as unknown as { id: string; slug: string; nombre: string };
      activas.set(s.id, s);
    }
  }

  return Array.from(activas.values());
}

export async function obtenerTurnoActivo(accessToken?: string) {
  const supabase = accessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      )
    : await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { slug: null };

  const perfilRaw = await (supabase as any)
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;
  if (!perfil || perfil.rol !== 'mesero') return { slug: null };

  const turnoRaw = await (supabase as any)
    .from('turnos')
    .select('sucursal_id')
    .eq('usuario_id', user.id)
    .eq('activo', true)
    .is('fin', null)
    .maybeSingle();
  const turno = turnoRaw.data as { sucursal_id: string } | null;
  if (!turno) return { slug: null };

  const sucRaw = await (supabase as any)
    .from('sucursales')
    .select('slug')
    .eq('id', turno.sucursal_id)
    .single();
  if (!sucRaw.data) return { slug: null };

  return { slug: sucRaw.data.slug };
}
