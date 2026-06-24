'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, ChevronDown, Store, Check } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/components/providers/SessionProvider';
import { useSucursal } from '@/components/providers/SucursalProvider';
import { RoleBadge } from './RoleBadge';
import type { Sucursal, Rol } from '@/types/roles';

async function fetchUserSucursales(userId: string, rol: Rol): Promise<Sucursal[]> {
  const supabase = createClientSupabaseClient();

  if (rol === 'super_admin' || rol === 'admin') {
    const { data } = await supabase
      .from('sucursales')
      .select('id, slug, nombre')
      .order('nombre');
    return (data as Sucursal[]) ?? [];
  }

  const { data } = await supabase
    .from('usuario_sucursales')
    .select('sucursales!inner(id, slug, nombre)')
    .eq('usuario_id', userId);

  if (!data) return [];
  return data.map((row: { sucursales: Sucursal }) => row.sucursales as Sucursal);
}

export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, perfil, rol } = useSession();
  const sucursal = useSucursal();
  const supabase = createClientSupabaseClient();

  const [open, setOpen] = useState(false);
  const [userSucursales, setUserSucursales] = useState<Sucursal[]>([]);
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

  useEffect(() => {
    if (!user || !rol) return;
    fetchUserSucursales(user.id, rol).then(setUserSucursales);
  }, [user, rol]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function switchSucursal(slug: string) {
    if (!rol) return;
    const segments = pathname.split('/').filter(Boolean);
    const rolePath = segments.slice(1).join('/') || rol;
    router.push(`/${slug}/${rolePath}`);
    setOpen(false);
  }

  if (!user) return null;

  const initials = perfil?.nombre?.charAt(0).toUpperCase() ?? '?';
  const puedeCambiarSucursal = rol && !['super_admin', 'admin'].includes(rol);
  const showSucursales = puedeCambiarSucursal && userSucursales.length > 1;

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

          {showSucursales && (
            <div className="pt-3 pb-2">
              <p className="px-4 pb-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                Cambiar de sucursal
              </p>
              <div className="px-2 space-y-0.5">
                {userSucursales.map((s) => {
                  const isActive = s.id === sucursal?.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => switchSucursal(s.slug)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-accent/10 text-accent font-medium'
                          : 'text-text-primary hover:bg-bg-base'
                      }`}
                    >
                      <Store className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{s.nombre}</span>
                      {isActive && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
