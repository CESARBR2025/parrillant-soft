'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Store } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/components/providers/SessionProvider';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { RoleBadge } from './RoleBadge';

export function UserMenu() {
  const router = useRouter();
  const { user, perfil, rol } = useSession();
  const sucursal = useSucursal();
  const supabase = createClientSupabaseClient();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (!user) return null;

  const initials = perfil?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl hover:bg-accent/5 transition-colors group"
      >
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-text-primary leading-tight">
            {perfil?.nombre}
          </p>
          <div className="flex items-center gap-1.5 justify-end">
            {rol && <RoleBadge rol={rol} className="text-[10px]" />}
            {sucursal && (
              <span className="text-[11px] text-muted truncate max-w-28">
                {sucursal.nombre}
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-amber-400 flex items-center justify-center text-white text-sm font-bold ring-2 ring-accent/20 shadow-sm shrink-0">
          {initials}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-200 hidden sm:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-card rounded-xl border border-border/60 shadow-elevated z-50 overflow-hidden origin-top-right">
          <div className="p-4 flex items-center gap-3 border-b border-border/40">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-amber-400 flex items-center justify-center text-white text-lg font-bold ring-2 ring-accent/20 shadow-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {perfil?.nombre}
              </p>
              {rol && <RoleBadge rol={rol} />}
              {sucursal && (
                <p className="text-xs text-muted mt-0.5 truncate flex items-center gap-1">
                  <Store className="w-3 h-3 shrink-0" />
                  {sucursal.nombre}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border/40 p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
