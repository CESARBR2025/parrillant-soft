export type Rol =
  | "super_admin"
  | "admin"
  | "caja"
  | "mesero"
  | "barra"
  | "cocina";

export interface Sucursal {
  id: string;
  slug: string;
  nombre: string;
}

export interface Perfil {
  id: string;
  rol: Rol;
  nombre: string;
  apellido: string | null;
  activo: boolean;
}

// Jerarquía de permisos (mayor número = más permisos)
export const ROL_NIVEL: Record<Rol, number> = {
  cocina: 1,
  barra: 1,
  mesero: 2,
  caja: 3,
  admin: 4,
  super_admin: 5,
};

export function tienePermiso(rolUsuario: Rol, rolRequerido: Rol): boolean {
  return ROL_NIVEL[rolUsuario] >= ROL_NIVEL[rolRequerido];
}

// Rutas permitidas por rol
export const RUTAS_POR_ROL: Record<Rol, string[]> = {
  super_admin: ["/admin", "/caja", "/mesero", "/cocina", "/barra"],
  admin: ["/admin", "/caja", "/mesero", "/cocina", "/barra"],
  caja: ["/caja"],
  mesero: ["/mesero"],
  barra: ["/barra"],
  cocina: ["/cocina"],
};

export const RUTA_INICIO_POR_ROL: Record<Rol, string> = {
  super_admin: "/admin",
  admin: "/admin",
  caja: "/caja",
  mesero: "/mesero",
  barra: "/barra",
  cocina: "/cocina",
};
