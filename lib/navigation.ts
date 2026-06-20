import type { LucideIcon } from 'lucide-react';
import {
  Grid3x3,
  ScrollText,
  LayoutDashboard,
  CookingPot,
  Wine,
  CreditCard,
  ClipboardList,
} from 'lucide-react';
import type { Rol } from '@/types/roles';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<Rol, NavItem[]> = {
  super_admin: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
    { label: 'Cocina', href: '/cocina', icon: CookingPot },
    { label: 'Barra', href: '/barra', icon: Wine },
    { label: 'Caja', href: '/caja', icon: CreditCard },
    { label: 'Órdenes', href: '/mesero', icon: ClipboardList },
  ],
  admin: [
    { label: 'Panel', href: '/admin', icon: LayoutDashboard },
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
