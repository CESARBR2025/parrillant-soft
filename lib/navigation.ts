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
} from 'lucide-react';
import type { Rol } from '@/types/roles';

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

export function navItemsConSucursal(rol: Rol, sucursalSlug?: string): NavItem[] {
  return navSectionsConSucursal(NAV_SECTIONS[rol] ?? [], sucursalSlug)
    .flatMap(s => s.items);
}

export const NAV_ITEMS: Record<Rol, NavItem[]> = {
  super_admin: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
    { label: 'Mapa', href: '/mesero/mapa', icon: Grid3x3 },
    { label: 'Cocina', href: '/cocina', icon: CookingPot },
    { label: 'Barra', href: '/barra', icon: Wine },
    { label: 'Caja', href: '/caja', icon: CreditCard },
    { label: 'Órdenes', href: '/mesero', icon: ClipboardList },
  ],
  admin: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
    { label: 'Mapa', href: '/mesero/mapa', icon: Grid3x3 },
    { label: 'Cocina', href: '/cocina', icon: CookingPot },
    { label: 'Barra', href: '/barra', icon: Wine },
    { label: 'Caja', href: '/caja', icon: CreditCard },
    { label: 'Órdenes', href: '/mesero', icon: ClipboardList },
  ],
  caja: [
    { label: 'Caja', href: '/caja', icon: CreditCard },
    { label: 'Historial', href: '/caja/historial', icon: ClipboardList },
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

export const NAV_SECTIONS: Record<Rol, NavSection[]> = {
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
        { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
        { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
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
  admin: [
    {
      label: 'Gestión',
      items: [
        { label: 'Panel', href: '/admin', icon: LayoutDashboard },
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

export const ROLE_LABELS: Record<Rol, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  caja: 'Caja',
  mesero: 'Mesero',
  barra: 'Barra',
  cocina: 'Cocina',
};

export const ROLE_BADGE_STYLES: Record<Rol, string> = {
  super_admin: 'bg-red-900/30 text-red-400 ring-1 ring-red-800/30',
  admin: 'bg-amber-900/30 text-amber-400 ring-1 ring-amber-800/30',
  caja: 'bg-green-900/30 text-green-400 ring-1 ring-green-800/30',
  mesero: 'bg-blue-900/30 text-blue-400 ring-1 ring-blue-800/30',
  barra: 'bg-purple-900/30 text-purple-400 ring-1 ring-purple-800/30',
  cocina: 'bg-yellow-900/30 text-yellow-400 ring-1 ring-yellow-800/30',
};
