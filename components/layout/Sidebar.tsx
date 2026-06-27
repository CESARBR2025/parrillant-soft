'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeft, LogOut, X } from 'lucide-react';
import Image from 'next/image';
import { useContext, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { navSectionsConSucursal, NAV_SECTIONS } from '@/lib/navigation';
import type { KnownRol } from '@/types/roles';
import { RoleBadge } from './RoleBadge';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useNavigate, NavigationContext } from '@/components/providers/NavigationProvider';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { perfil, rol } = useSession();
  const sucursal = useSucursal();
  const router = useNavigate();
  const { startNavigation } = useContext(NavigationContext);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  if (!rol) return null;

  const sections = navSectionsConSucursal(
    NAV_SECTIONS[rol as KnownRol] ?? [],
    sucursal?.slug
  );

  async function handleLogout() {
    onMobileClose?.();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function NavContent({ showLabels, isCollapsed }: { showLabels: boolean; isCollapsed: boolean }) {
    return (
      <>
        {sections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            {showLabels && section.label && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const allItems = sections.flatMap(s => s.items);
                const hasDeeperItems = allItems.some(
                  i => i.href !== item.href && i.href.startsWith(item.href + '/')
                );
                const isActive = hasDeeperItems
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      startNavigation();
                      onMobileClose?.();
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted hover:text-body hover:bg-bg-base'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    {showLabels && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-bg-sidebar border-r-2 border-[#F6F6F6] transition-all duration-200 relative ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <button
          onClick={onToggle}
          className={`absolute top-5 -right-3 z-10 p-1.5 rounded-full bg-bg-sidebar border border-[#F6F6F6] text-muted hover:text-body hover:bg-bg-base transition-colors shadow-sm ${
            collapsed ? '' : 'hidden'
          }`}
          title="Expandir sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
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
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-text-primary truncate">
                  Parrilla <span className="text-accent">Norteña</span>
                </span>
                {sucursal && (
                  <span className="text-xs text-muted truncate">{sucursal.nombre}</span>
                )}
              </div>
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

        <nav className="flex-1 py-5 px-2 overflow-y-auto">
          <NavContent showLabels={!collapsed} isCollapsed={collapsed} />
        </nav>

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
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && onMobileClose && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 left-0 h-full w-64 bg-bg-sidebar flex flex-col z-10 shadow-2xl">
            <div className="flex items-center h-20 px-3 gap-3 border-b-2 border-[#F6F6F6]">
              <Image
                src="/parrillalogo.png"
                alt="Logo"
                width={40}
                height={40}
                className="shrink-0"
                unoptimized
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold text-text-primary truncate">
                  Parrilla <span className="text-accent">Norteña</span>
                </span>
                {sucursal && (
                  <span className="text-xs text-muted truncate">{sucursal.nombre}</span>
                )}
              </div>
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-bg-base transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-5 px-2 overflow-y-auto">
              <NavContent showLabels={true} isCollapsed={false} />
            </nav>

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
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
