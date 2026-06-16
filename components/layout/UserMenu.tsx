'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/components/providers/SessionProvider';
import { RoleBadge } from './RoleBadge';

export function UserMenu() {
  const router = useRouter();
  const { user, perfil, rol } = useSession();
  const supabase = createClientSupabaseClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (!user) return null;

  const initials = perfil?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-right">
        <div className="text-sm">
          <p className="font-medium text-white leading-tight">{perfil?.nombre}</p>
          {rol && <RoleBadge rol={rol} />}
        </div>
      </div>
      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold ring-2 ring-accent/30">
        {initials}
      </div>
      <button
        onClick={handleLogout}
        className="p-2 rounded-xl text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors"
        title="Cerrar sesión"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
