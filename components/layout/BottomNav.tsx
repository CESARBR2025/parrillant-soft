'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { navItemsConSucursal } from '@/lib/navigation';
import type { Rol } from '@/types/roles';

export function BottomNav() {
  const pathname = usePathname();
  const { rol } = useSession();
  const sucursal = useSucursal();

  if (!rol) return null;

  const itemsBase = navItemsConSucursal(rol as Rol, sucursal?.slug);
  const navItems = !sucursal && (rol === 'super_admin' || rol === 'admin')
    ? itemsBase.filter(i => i.href === '/admin' || i.href.startsWith('/admin/'))
    : itemsBase;
  if (navItems.length <= 1) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-[#F6F6F6] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors min-w-0 ${
                isActive
                  ? 'text-accent'
                  : 'text-muted hover:text-body'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
