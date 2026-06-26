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

const RUTAS_SIN_SUCURSAL = ['login', 'admin', 'auth', '_next', 'api'];

function extractSegments(pathname: string): { sucursalSlug?: string; internalPath: string } {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  const isSucursalSlug = first && !RUTAS_SIN_SUCURSAL.includes(first) && !first.startsWith('_') && !first.includes('.');
  if (isSucursalSlug) {
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
    const sucursalRaw = await (supabase as any)
      .from("sucursales")
      .select("id")
      .eq("slug", sucursalSlug)
      .single();
    const sucursal = sucursalRaw.data as { id: string } | null;

    if (!sucursal) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const perfilRaw = await (supabase as any)
      .from("perfiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();
    const perfil = perfilRaw.data as { rol: string; activo: boolean } | null;

    if (!perfil || !perfil.activo) {
      return NextResponse.redirect(new URL("/login?error=cuenta_inactiva", request.url));
    }

    const esAdmin = perfil.rol === 'super_admin' || perfil.rol === 'admin';
    if (!esAdmin) {
      const accesoRaw = await (supabase as any)
        .from("usuario_sucursales")
        .select("sucursal_id")
        .eq("usuario_id", user.id)
        .eq("sucursal_id", sucursal.id)
        .maybeSingle();
      const acceso = accesoRaw.data as { sucursal_id: string } | null;

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

    if (
      perfil.rol === 'mesero' &&
      rutaProtegida?.rolesPermitidos.includes('mesero') &&
      !internalPath.startsWith('/mesero/registrar-turno')
    ) {
      const turnoRaw = await (supabase as any)
        .from('registro_turnos_personal')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('sucursal_id', sucursal.id)
        .eq('activo', true)
        .is('fin', null)
        .maybeSingle();
      const turno = turnoRaw.data as { id: string } | null;

      if (turno) {
        response.cookies.set('turno_id', turno.id, { path: '/', httpOnly: true });
      } else {
        response.cookies.delete('turno_id');
        return NextResponse.redirect(new URL(`/${sucursalSlug}/mesero/registrar-turno`, request.url));
      }
    }

    return response;
  }

  if (pathname === "/") {
    const perfilRaw = await (supabase as any)
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    const perfil = perfilRaw.data as { rol: string } | null;

    if (perfil) {
      const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/mesero';
      return NextResponse.redirect(new URL(rutaInicio, request.url));
    }
  }

  const rutaProtegida = RUTAS_PROTEGIDAS.find(r => r.patron.test(pathname));
  if (rutaProtegida) {
    const perfilRaw = await (supabase as any)
      .from("perfiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();
    const perfil = perfilRaw.data as { rol: string; activo: boolean } | null;

    if (!perfil || !perfil.activo) {
      return NextResponse.redirect(new URL("/login?error=cuenta_inactiva", request.url));
    }

    if (!rutaProtegida.rolesPermitidos.includes(perfil.rol as Rol)) {
      const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/mesero';

      if (perfil.rol === 'super_admin' || perfil.rol === 'admin') {
        return NextResponse.redirect(new URL(rutaInicio, request.url));
      }

      const userSucRaw = await (supabase as any)
        .from("usuario_sucursales")
        .select("sucursales!inner(slug)")
        .eq("usuario_id", user.id)
        .limit(1)
        .single();
      const userSuc = userSucRaw.data as { sucursales: { slug: string } } | null;

      const slug = userSuc?.sucursales?.slug;
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
