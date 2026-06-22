// src/app/api/ordenes/[id]/estado/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";

// Transiciones de estado permitidas por rol
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  mesero: ["en_preparacion", "entregado", "cuenta_solicitada", "cancelado"],
  cocina: ["en_preparacion", "listo"],
  barra: ["en_preparacion", "listo"],
  caja: ["cerrado", "cancelado"],
  admin: [
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
    const { estado, metodo_pago, pagado_con } = await request.json();
    const supabase = await createServerSupabaseClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener rol del usuario
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!perfil) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 },
      );
    }

    // Validar que la transición esté permitida para este rol
    const transicionesPermitidas = TRANSICIONES_VALIDAS[perfil.rol] ?? [];
    if (!transicionesPermitidas.includes(estado)) {
      return NextResponse.json(
        {
          error: `El rol '${perfil.rol}' no puede cambiar a estado '${estado}'`,
        },
        { status: 403 },
      );
    }

    const ordenId = Number(id);

    // Check if this is a parent order (has sub-orders)
    const { data: orden } = await supabase
      .from("ordenes")
      .select("id, mesa_id, orden_padre_id")
      .eq("id", ordenId)
      .single();

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const esPadre = orden.orden_padre_id === null;

    // Get sub-order IDs if this is a parent
    let subIds: number[] = [];
    if (esPadre) {
      const { data: subs } = await supabase
        .from("ordenes")
        .select("id")
        .eq("orden_padre_id", ordenId);
      subIds = (subs ?? []).map(s => s.id);
    }

    const updateData: OrdenUpdate = {};
    updateData.estado = estado;

    // Si se cierra, calcular total consolidado y registrar quién cerró
    if (estado === "cerrado") {
      const calcTotal = async (oid: number): Promise<number> => {
        const { data: detalles } = await supabase
          .from("detalles_orden")
          .select("cantidad, precio_unitario")
          .eq("orden_id", oid);
        return detalles?.reduce((acc: number, d: { cantidad: number; precio_unitario: number }) =>
          acc + d.cantidad * Number(d.precio_unitario), 0) ?? 0;
      };

      let total = await calcTotal(ordenId);

      // Include sub-order totals
      for (const subId of subIds) {
        total += await calcTotal(subId);
      }

      updateData.total = total;
      updateData.cerrado_por_id = user.id;
      if (metodo_pago) updateData.metodo_pago = metodo_pago;
      if (pagado_con != null) updateData.pagado_con = pagado_con;
    }

    const { data: ordenActualizada, error } = await supabase
      .from("ordenes")
      .update(updateData)
      .eq("id", ordenId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If parent is being closed, also close all sub-orders
    if (esPadre && estado === "cerrado" && subIds.length > 0) {
      const subUpdate: OrdenUpdate = {
        estado: "cerrado",
        cerrado_por_id: user.id,
        metodo_pago: updateData.metodo_pago,
      };
      await supabase.from("ordenes").update(subUpdate).in("id", subIds);
    }

    // If this is a sub-order being closed independently (shouldn't normally happen), close it
    // but DON'T free the mesa (parent order still active)

    // Only free the mesa if this is a parent order
    if (estado === "cerrado" && esPadre && ordenActualizada?.mesa_id) {
      await supabase
        .from("mesas")
        .update({ estado: "disponible" })
        .eq("id", ordenActualizada.mesa_id);
    }

    return NextResponse.json({ success: true, orden: ordenActualizada });
  } catch (err) {
    console.error("[PATCH /api/ordenes/:id/estado]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
