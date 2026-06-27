'use client';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@/components/providers/NavigationProvider';
import { LogOut, ChevronDown, Store, AlertCircle, Loader2 } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/components/providers/SessionProvider';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { RoleBadge } from './RoleBadge';

export function UserMenu() {
  const router = useNavigate();
  const { user, perfil, rol } = useSession();
  const sucursal = useSucursal();
  const supabase = createClientSupabaseClient();

  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  async function handleConfirmLogout() {
    setLoggingOut(true);
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
        className="flex items-center gap-2.5 py-1 pr-1 rounded-xl hover:bg-accent/5 transition-colors group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-amber-400 flex items-center justify-center text-white text-xs font-bold ring-2 ring-accent/20 shadow-sm shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-text-primary leading-tight">
            {perfil?.nombre}
          </p>
          {rol && <RoleBadge rol={rol} />}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-200 hidden sm:block ${open ? 'rotate-180' : ''
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
            </div>
          </div>

          <div className="border-t border-border/40 p-2">
            <button
              onClick={() => { setOpen(false); setShowLogoutModal(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-card rounded-2xl border border-border/60 shadow-elevated p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-danger" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Cerrar sesión</h2>
            <p className="text-sm text-muted mb-6">¿Realmente quieres cerrar sesión?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
              >
                No
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="flex-1 bg-danger text-white hover:bg-danger/90 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loggingOut ? 'Saliendo...' : 'Sí, salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
