'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeft, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useSession } from '@/components/providers/SessionProvider';
import { NAV_ITEMS } from '@/lib/navigation';
import type { Rol } from '@/types/roles';
import { RoleBadge } from './RoleBadge';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { perfil, rol } = useSession();
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  if (!rol) return null;

  const navItems = NAV_ITEMS[rol as Rol] ?? [];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className={`hidden lg:flex flex-col bg-bg-sidebar border-r-2 border-[#F6F6F6] transition-all duration-200 relative ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button overlapping right edge */}
      <button
        onClick={onToggle}
        className={`absolute top-5 -right-3 z-10 p-1.5 rounded-full bg-bg-sidebar border border-[#F6F6F6] text-muted hover:text-body hover:bg-bg-base transition-colors shadow-sm ${
          collapsed ? '' : 'hidden'
        }`}
        title="Expandir sidebar"
      >
        <PanelLeft className="w-4 h-4" />
      </button>
      {/* Logo + toggle */}
      <div className={`flex items-center h-20 px-3 border-b-2 border-[#F6F6F6] ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <Image
          src="/parrillalogo.png"
          alt="Logo"
          width={collapsed ? 44 : 40}
          height={collapsed ? 44 : 40}
          className="shrink-0"
          unoptimized
        />
        {!collapsed && (
          <>
            <span className="text-sm font-bold text-text-primary truncate">
              Parrilla <span className="text-accent">Norteña</span>
            </span>
            <button
              onClick={onToggle}
              className="ml-auto p-1.5 rounded-lg text-muted hover:text-body hover:bg-bg-base transition-colors"
              title="Colapsar sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:text-body hover:bg-bg-base'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-6 h-6 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {!collapsed && (
        <div className="p-4 border-t-2 border-[#F6F6F6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
              {perfil?.nombre?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{perfil?.nombre}</p>
              {rol && <RoleBadge rol={rol} />}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Cerrar sesión"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
