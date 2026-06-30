import type { LucideIcon } from 'lucide-react';
import {
  Grid3x3,
  ScrollText,
  LayoutDashboard,
  CookingPot,
  Wine,
  CreditCard,
  ClipboardList,
  Users,
  Building2,
  CalendarClock,
  UtensilsCrossed,
  Table2,
  Shield,
} from 'lucide-react';
import type { KnownRol } from '@/types/roles';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export function navSectionsConSucursal(
  sections: NavSection[],
  sucursalSlug?: string
): NavSection[] {
  if (!sucursalSlug) return sections;
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      href: `/${sucursalSlug}${item.href}`,
    })),
  }));
}

export function navItemsConSucursal(rol: KnownRol, sucursalSlug?: string): NavItem[] {
  return navSectionsConSucursal(NAV_SECTIONS[rol] ?? [], sucursalSlug)
    .flatMap(s => s.items);
}

export const NAV_ITEMS: Record<KnownRol, NavItem[]> = {
  super_admin: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
    { label: 'Roles', href: '/admin/roles', icon: Shield },
    { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Turnos', href: '/admin/turnos', icon: CalendarClock },
    { label: 'Menú', href: '/admin/menu', icon: UtensilsCrossed },
  ],
  gerente_sucursal: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
    { label: 'Menú', href: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Mesas', href: '/admin/mesas', icon: Table2 },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Mapa', href: '/mesero/mapa', icon: Grid3x3 },
    { label: 'Cocina', href: '/cocina', icon: CookingPot },
    { label: 'Barra', href: '/barra', icon: Wine },
    { label: 'Caja', href: '/caja', icon: CreditCard },
    { label: 'Órdenes', href: '/mesero', icon: ClipboardList },
  ],
  administrador: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
    { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Turnos', href: '/admin/turnos', icon: CalendarClock },
  ],
  caja: [
    { label: 'Caja', href: '/caja', icon: CreditCard },
    { label: 'Historial', href: '/caja/historial', icon: ClipboardList },
    { label: 'Corte', href: '/caja/corte', icon: CalendarClock },
  ],
  mesero: [
    { label: 'Dashboard', href: '/mesero', icon: LayoutDashboard },
    { label: 'Mapa', href: '/mesero/mapa', icon: Grid3x3 },
    { label: 'Historial', href: '/mesero/ordenes', icon: ScrollText },
  ],
  barra: [
    { label: 'Barra', href: '/barra', icon: Wine },
  ],
  cocina: [
    { label: 'Cocina', href: '/cocina', icon: CookingPot },
  ],
};

export const NAV_SECTIONS: Record<KnownRol, NavSection[]> = {
  super_admin: [
    {
      label: '',
      items: [
        { label: 'Panel', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { label: 'Roles', href: '/admin/roles', icon: Shield },
        { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
        { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
        { label: 'Turnos', href: '/admin/turnos', icon: CalendarClock },
        { label: 'Menú', href: '/admin/menu', icon: UtensilsCrossed },
      ],
    },
  ],
  administrador: [
    {
      label: '',
      items: [
        { label: 'Panel', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
        { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
        { label: 'Turnos', href: '/admin/turnos', icon: CalendarClock },
      ],
    },
  ],
  gerente_sucursal: [
    {
      label: 'Gestión',
      items: [
        { label: 'Panel', href: '/admin', icon: LayoutDashboard },
        { label: 'Menú', href: '/admin/menu', icon: UtensilsCrossed },
        { label: 'Mesas', href: '/admin/mesas', icon: Table2 },
        { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
      ],
    },
    {
      label: 'Operación',
      items: [
        { label: 'Mapa', href: '/mesero/mapa', icon: Grid3x3 },
        { label: 'Cocina', href: '/cocina', icon: CookingPot },
        { label: 'Barra', href: '/barra', icon: Wine },
        { label: 'Caja', href: '/caja', icon: CreditCard },
        { label: 'Órdenes', href: '/mesero', icon: ClipboardList },
      ],
    },
  ],
  caja: [
    {
      label: 'Operación',
      items: [
        { label: 'Caja', href: '/caja', icon: CreditCard },
        { label: 'Historial', href: '/caja/historial', icon: ClipboardList },
        { label: 'Corte', href: '/caja/corte', icon: CalendarClock },
      ],
    },
  ],
  mesero: [
    {
      label: 'Operación',
      items: [
        { label: 'Dashboard', href: '/mesero', icon: LayoutDashboard },
        { label: 'Mapa', href: '/mesero/mapa', icon: Grid3x3 },
        { label: 'Historial', href: '/mesero/ordenes', icon: ScrollText },
      ],
    },
  ],
  barra: [
    {
      label: 'Operación',
      items: [
        { label: 'Barra', href: '/barra', icon: Wine },
      ],
    },
  ],
  cocina: [
    {
      label: 'Operación',
      items: [
        { label: 'Cocina', href: '/cocina', icon: CookingPot },
      ],
    },
  ],
};

export const ROLE_LABELS: Record<KnownRol, string> = {
  super_admin: 'Super Administrador',
  administrador: 'Administrador',
  gerente_sucursal: 'Gerente Sucursal',
  caja: 'Caja',
  mesero: 'Mesero',
  barra: 'Barra',
  cocina: 'Cocina',
};

export const ROLE_BADGE_STYLES: Record<KnownRol, string> = {
  super_admin: 'bg-red-500/15 text-red-500 ring-1 ring-red-500/30',
  administrador: 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30',
  gerente_sucursal: 'bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/30',
  caja: 'bg-green-500/15 text-green-500 ring-1 ring-green-500/30',
  mesero: 'bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/30',
  barra: 'bg-purple-500/15 text-purple-500 ring-1 ring-purple-500/30',
  cocina: 'bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/30',
};
