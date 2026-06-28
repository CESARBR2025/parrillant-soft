import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { PermisoProvider } from '@/components/providers/PermisoProvider';
import { SucursalProvider } from '@/components/providers/SucursalProvider';
import { HeaderActionsProvider } from '@/components/providers/HeaderActionsProvider';
import { NavigationProvider } from '@/components/providers/NavigationProvider';
import { AppShell } from '@/components/layout/AppShell';
import { WaiterNotification } from '@/components/WaiterNotification';
import { fetchSucursalBySlug } from '@/lib/sucursal';
import type { Perfil, Sucursal } from '@/types/roles';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const perfilRaw = await supabase
    .from('perfiles')
    .select('id, rol, nombre, apellido, activo')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { id: string; rol: string; nombre: string | null; apellido: string | null; activo: boolean } | null;

  if (!perfil || !perfil.activo) {
    redirect('/login?error=cuenta_inactiva');
  }

  let sucursal: Sucursal | null = null;
  if (perfil.rol !== 'super_admin') {
    const cookieStore = await cookies();
    const sucursalSlug = cookieStore.get('sucursal_slug')?.value;
    sucursal = sucursalSlug ? await fetchSucursalBySlug(sucursalSlug) : null;
  }

  return (
      <SessionProvider initialUser={user} initialPerfil={perfil as unknown as Perfil}>
        <PermisoProvider>
        <NavigationProvider>
        <HeaderActionsProvider>
          <SucursalProvider sucursal={sucursal as unknown as Sucursal}>
          <WaiterNotification />
          <AppShell>{children}</AppShell>
          </SucursalProvider>
        </HeaderActionsProvider>
        </NavigationProvider>
        </PermisoProvider>
      </SessionProvider>
  );
}
