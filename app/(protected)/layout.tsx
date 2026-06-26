import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { HeaderActionsProvider } from '@/components/providers/HeaderActionsProvider';
import { AppShell } from '@/components/layout/AppShell';
import { WaiterNotification } from '@/components/WaiterNotification';
import type { Perfil } from '@/types/roles';

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

  return (
      <SessionProvider initialUser={user} initialPerfil={perfil as unknown as Perfil}>
        <HeaderActionsProvider>
          <WaiterNotification />
          <AppShell>{children}</AppShell>
        </HeaderActionsProvider>
      </SessionProvider>
  );
}
