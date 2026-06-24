import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import type { Rol } from "./types/roles";
import { RUTA_INICIO_POR_ROL } from "./types/roles";

const RUTAS_PUBLICAS = ["/login", "/auth/callback"];

const RUTAS_PROTEGIDAS: Array<{ patron: RegExp; rolesPermitidos: Rol[] }> = [
  { patron: /^\/admin(?:\/|$)/, rolesPermitidos: ["super_admin", "admin"] },
  { patron: /^\/caja(?:\/|$)/, rolesPermitidos: ["super_admin", "admin", "caja"] },
  { patron: /^\/mesero(?:\/|$)/, rolesPermitidos: ["super_admin", "admin", "mesero"] },
  { patron: /^\/cocina(?:\/|$)/, rolesPermitidos: ["super_admin", "admin", "cocina"] },
  { patron: /^\/barra(?:\/|$)/, rolesPermitidos: ["super_admin", "admin", "barra"] },
];

const SUCURSALES_CONOCIDAS = ['sucursal-lomas', 'sucursal-nogales'];

function extractSegments(pathname: string): { sucursalSlug?: string; internalPath: string } {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  if (SUCURSALES_CONOCIDAS.includes(first)) {
    return { sucursalSlug: first, internalPath: '/' + parts.slice(1).join('/') };
  }
  return { internalPath: pathname };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (RUTAS_PUBLICAS.some(r => pathname.startsWith(r))) {
    return response;
  }

  const supabase = createMiddlewareSupabaseClient(request, response);

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { sucursalSlug, internalPath } = extractSegments(pathname);

  if (sucursalSlug) {
    const { data: sucursal } = await supabase
      .from("sucursales")
      .select("id")
      .eq("slug", sucursalSlug)
      .single();

    if (!sucursal) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();

    if (!perfil || !perfil.activo) {
      return NextResponse.redirect(new URL("/login?error=cuenta_inactiva", request.url));
    }

    const esAdmin = perfil.rol === 'super_admin' || perfil.rol === 'admin';
    if (!esAdmin) {
      const { data: acceso } = await supabase
        .from("usuario_sucursales")
        .select("sucursal_id")
        .eq("usuario_id", user.id)
        .eq("sucursal_id", sucursal.id)
        .maybeSingle();

      if (!acceso) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    response.cookies.set("sucursal_slug", sucursalSlug, { path: "/" });
    response.cookies.set("sucursal_id", sucursal.id, { path: "/", httpOnly: true });

    const rutaProtegida = RUTAS_PROTEGIDAS.find(r => r.patron.test(internalPath));
    if (rutaProtegida && !rutaProtegida.rolesPermitidos.includes(perfil.rol as Rol)) {
      const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/mesero';
      return NextResponse.redirect(new URL(`/${sucursalSlug}${rutaInicio}`, request.url));
    }

    return response;
  }

  if (pathname === "/") {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (perfil) {
      const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/mesero';
      return NextResponse.redirect(new URL(rutaInicio, request.url));
    }
  }

  const rutaProtegida = RUTAS_PROTEGIDAS.find(r => r.patron.test(pathname));
  if (rutaProtegida) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();

    if (!perfil || !perfil.activo) {
      return NextResponse.redirect(new URL("/login?error=cuenta_inactiva", request.url));
    }

    if (!rutaProtegida.rolesPermitidos.includes(perfil.rol as Rol)) {
      const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/mesero';

      if (perfil.rol === 'super_admin' || perfil.rol === 'admin') {
        return NextResponse.redirect(new URL(rutaInicio, request.url));
      }

      const { data: userSuc } = await supabase
        .from("usuario_sucursales")
        .select("sucursales!inner(slug)")
        .eq("usuario_id", user.id)
        .limit(1)
        .single();

      const slug = (userSuc as unknown as { sucursales: { slug: string } })?.sucursales?.slug;
      if (slug) {
        return NextResponse.redirect(new URL(`/${slug}${rutaInicio}`, request.url));
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|css|js)$|api/).*)",
  ],
};
