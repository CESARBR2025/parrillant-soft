import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerSucursalId } from "@/lib/sucursal";
import { Database } from "@/types/database.types";

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  mesero: ["en_preparacion", "entregado", "cuenta_solicitada", "cancelado"],
  cocina: ["en_preparacion", "listo"],
  barra: ["en_preparacion", "listo"],
  caja: ["cerrado", "cancelado"],
  administrador: [
    "pendiente",
    "en_preparacion",
    "listo",
    "entregado",
    "cuenta_solicitada",
    "cerrado",
    "cancelado",
  ],
  gerente_sucursal: [
    "pendiente",
    "en_preparacion",
    "listo",
    "entregado",
    "cuenta_solicitada",
    "cerrado",
    "cancelado",
  ],
  super_admin: [
    "pendiente",
    "en_preparacion",
    "listo",
    "entregado",
    "cuenta_solicitada",
    "cerrado",
    "cancelado",
  ],
};

type OrdenUpdate = Database["public"]["Tables"]["ordenes"]["Update"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { estado, metodo_pago, pagado_con, descuento } = await request.json();
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sucursalId = await getServerSucursalId();
    if (!sucursalId) {
      return NextResponse.json({ error: "Sucursal no identificada" }, { status: 400 });
    }

    const perfilRaw = await (supabase as any)
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    const perfil = perfilRaw.data as { rol: string } | null;

    if (!perfil) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const transicionesPermitidas = TRANSICIONES_VALIDAS[perfil.rol] ?? [];
    if (!transicionesPermitidas.includes(estado)) {
      return NextResponse.json(
        { error: `El rol '${perfil.rol}' no puede cambiar a estado '${estado}'` },
        { status: 403 },
      );
    }

    const ordenId = Number(id);

    const ordenRaw = await (supabase as any)
      .from("ordenes")
      .select("id, mesa_id, orden_padre_id")
      .eq("id", ordenId)
      .eq("sucursal_id", sucursalId)
      .single();
    const orden = ordenRaw.data as { id: number; mesa_id: number; orden_padre_id: number | null } | null;

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const esPadre = orden.orden_padre_id === null;

    let subIds: number[] = [];
    if (esPadre) {
      const subsRaw = await (supabase as any)
        .from("ordenes")
        .select("id")
        .eq("orden_padre_id", ordenId);
      const subs = subsRaw.data as { id: number }[] | null;
      subIds = (subs ?? []).map(s => s.id);
    }

    const updateData: OrdenUpdate = {};
    updateData.estado = estado;

    if (estado === "cerrado") {
      const todosIds = [ordenId, ...subIds];
      const { data: detalles } = await (supabase as any)
        .from("detalles_orden")
        .select("cantidad, precio_unitario")
        .in("orden_id", todosIds);
      const total = detalles?.reduce(
        (acc: number, d: { cantidad: number; precio_unitario: number }) =>
          acc + d.cantidad * Number(d.precio_unitario),
        0,
      ) ?? 0;

      updateData.total = total;
      updateData.cerrado_por_id = user.id;
      if (metodo_pago) updateData.metodo_pago = metodo_pago;
      if (pagado_con != null) updateData.pagado_con = pagado_con;
      if (descuento != null) updateData.descuento = descuento;
    }

    const ordenActualizadaRaw = await (supabase as any)
      .from("ordenes")
      .update(updateData)
      .eq("id", ordenId)
      .eq("sucursal_id", sucursalId)
      .select()
      .single();
    const ordenActualizada = ordenActualizadaRaw.data as { mesa_id: number } | null;
    const error = ordenActualizadaRaw.error;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const actualizaciones: Promise<any>[] = [];
    if (esPadre && estado === "cerrado" && subIds.length > 0) {
      const subUpdate: OrdenUpdate = {
        estado: "cerrado",
        cerrado_por_id: user.id,
        metodo_pago: updateData.metodo_pago,
      };
      actualizaciones.push(
        (supabase as any).from("ordenes").update(subUpdate).in("id", subIds),
      );
    }
    if (estado === "cerrado" && esPadre && ordenActualizada?.mesa_id) {
      actualizaciones.push(
        (supabase as any)
          .from("mesas")
          .update({ estado: "disponible" })
          .eq("id", ordenActualizada.mesa_id),
      );
    }
    await Promise.all(actualizaciones);

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (err) {
    console.error("[PATCH /api/ordenes/:id/estado]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
