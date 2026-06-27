export type KnownRol =
  | "super_admin"
  | "admin"
  | "caja"
  | "mesero"
  | "barra"
  | "cocina"
  | "gerente_sucursal"
  | "administrador";

export type Rol = KnownRol | (string & {});

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
export const ROL_NIVEL: Record<KnownRol, number> = {
  cocina: 1,
  barra: 1,
  mesero: 2,
  caja: 3,
  gerente_sucursal: 4,
  admin: 4,
  administrador: 5,
  super_admin: 6,
};

export function tienePermiso(rolUsuario: Rol, rolRequerido: KnownRol): boolean {
  return (ROL_NIVEL[rolUsuario as KnownRol] ?? 0) >= ROL_NIVEL[rolRequerido];
}

// Rutas permitidas por rol
export const RUTAS_POR_ROL: Record<KnownRol, string[]> = {
  super_admin: ["/admin", "/caja", "/mesero", "/cocina", "/barra"],
  administrador: ["/admin", "/caja", "/mesero", "/cocina", "/barra"],
  admin: ["/admin", "/caja", "/mesero", "/cocina", "/barra"],
  gerente_sucursal: ["/admin", "/caja", "/mesero", "/cocina", "/barra"],
  caja: ["/caja"],
  mesero: ["/mesero"],
  barra: ["/barra"],
  cocina: ["/cocina"],
};

export const RUTA_INICIO_POR_ROL: Record<KnownRol, string> = {
  super_admin: "/admin",
  administrador: "/admin",
  admin: "/admin",
  gerente_sucursal: "/admin",
  caja: "/caja",
  mesero: "/mesero",
  barra: "/barra",
  cocina: "/cocina",
};

export function obtenerLabelRol(rol: Rol): string {
  const labels: Record<KnownRol, string> = {
    cocina: 'Cocina',
    barra: 'Barra',
    mesero: 'Mesero',
    caja: 'Caja',
    gerente_sucursal: 'Gerente Sucursal',
    admin: 'Admin (legacy)',
    administrador: 'Administrador',
    super_admin: 'Super Administrador',
  };
  return labels[rol as KnownRol] ?? rol;
}

export function obtenerNivelRol(rol: Rol): number {
  return ROL_NIVEL[rol as KnownRol] ?? 0;
}
