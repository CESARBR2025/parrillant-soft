// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import type { Rol } from "./types/roles";
import { RUTA_INICIO_POR_ROL, RUTAS_POR_ROL } from "./types/roles";

// Rutas que NO requieren autenticación
const RUTAS_PUBLICAS = ["/login", "/auth/callback"];

// Rutas protegidas y el rol mínimo requerido
const RUTAS_PROTEGIDAS: Array<{ patron: RegExp; rolesPermitidos: Rol[] }> = [
  { patron: /^\/admin/, rolesPermitidos: ["super_admin", "admin"] },
  { patron: /^\/caja/, rolesPermitidos: ["super_admin", "admin", "caja"] },
  { patron: /^\/mesero/, rolesPermitidos: ["super_admin", "admin", "mesero"] },
  { patron: /^\/cocina/, rolesPermitidos: ["super_admin", "admin", "cocina"] },
  { patron: /^\/barra/, rolesPermitidos: ["super_admin", "admin", "barra"] },
];

export async function middleware(request: NextRequest) {
  console.log("entro a middleware");
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Crear cliente Supabase para el middleware
  const supabase = createMiddlewareSupabaseClient(request, response);
  ("");

  // CRÍTICO: Siempre llamar getUser() para refrescar el token si es necesario
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("USUARIO => ", user);

  // Ruta pública: dejar pasar
  if (RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    // Si ya está autenticado y va al login, redirigir a su dashboard
    if (user && pathname === "/login") {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (perfil) {
        const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol];
        return NextResponse.redirect(new URL(rutaInicio, request.url));
      }
    }
    return response;
  }

  // Sin sesión: redirigir al login
  if (!user || error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar rol para rutas protegidas
  const rutaProtegida = RUTAS_PROTEGIDAS.find((r) => r.patron.test(pathname));

  if (rutaProtegida) {
    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();

    console.log(perfil);
    console.log("USER ID:", user.id);
    console.log("PERFIL:", perfil);
    console.log("ERROR PERFIL:", perfilError);
    // Usuario inactivo o sin perfil
    if (!perfil || !perfil.activo) {
      return NextResponse.redirect(
        new URL("/login?error=cuenta_inactiva", request.url),
      );
    }

    const rolUsuario = perfil.rol as Rol;

    // Verificar si el rol tiene acceso a esta ruta
    if (!rutaProtegida.rolesPermitidos.includes(rolUsuario)) {
      // Redirigir a su propia ruta de inicio (no mostrar 403 vacío)
      const rutaInicio = RUTA_INICIO_POR_ROL[rolUsuario];
      return NextResponse.redirect(new URL(rutaInicio, request.url));
    }
  }

  // Usuario autenticado en la raíz → redirigir a su dashboard según rol
  if (pathname === "/") {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (perfil) {
      const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol];
      return NextResponse.redirect(new URL(rutaInicio, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos y rutas de Next.js internos
     * Solo ejecutar en rutas de página
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|css|js)$|api/).*)",
  ],
};
