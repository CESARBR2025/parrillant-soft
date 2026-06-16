// src/app/api/ordenes/[id]/estado/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";

// Transiciones de estado permitidas por rol
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  mesero: ["en_preparacion", "entregado", "cancelado"],
  cocina: ["en_preparacion", "listo"],
  barra: ["en_preparacion", "listo"],
  caja: ["cerrado", "cancelado"],
  admin: [
    "pendiente",
    "en_preparacion",
    "listo",
    "entregado",
    "cerrado",
    "cancelado",
  ],
  super_admin: [
    "pendiente",
    "en_preparacion",
    "listo",
    "entregado",
    "cerrado",
    "cancelado",
  ],
};

type OrdenUpdate = Database["public"]["Tables"]["ordenes"]["Update"];
const updateData: OrdenUpdate = {};

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

    updateData.estado = estado;

    // Si se cierra, calcular total y registrar quién cerró
    if (estado === "cerrado") {
      const { data: detalles } = await supabase
        .from("detalles_orden")
        .select("cantidad, precio_unitario")
        .eq("orden_id", Number(id));

      const total =
        detalles?.reduce(
          (acc, d) => acc + d.cantidad * Number(d.precio_unitario),
          0,
        ) ?? 0;

      updateData.total = total;
      updateData.cerrado_por_id = user.id;
      if (metodo_pago) updateData.metodo_pago = metodo_pago;
      if (pagado_con != null) updateData.pagado_con = pagado_con;
    }

    const { data: ordenActualizada, error } = await supabase
      .from("ordenes")
      .update(updateData)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Si la orden se cierra, liberar la mesa
    if (estado === "cerrado" && ordenActualizada?.mesa_id) {
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
