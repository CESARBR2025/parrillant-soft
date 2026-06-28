import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId } from '@/lib/sucursal';
import { AdminMesasClient } from './AdminMesasClient';
import type { Tables } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function AdminMesasPage({
  params,
}: {
  params: Promise<{ sucursalSlug: string }>;
}) {
  const { sucursalSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'gerente_sucursal' && perfil.rol !== 'super_admin' && perfil.rol !== 'administrador')) {
    redirect(`/${sucursalSlug}/admin`);
  }

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect(`/${sucursalSlug}/admin`);

  const { data: mesas } = await supabase
    .from('mesas')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .order('numero');

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/${sucursalSlug}/admin`}
          className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
        >
          ← Panel de Administración
        </a>
        <h1 className="text-xl font-bold text-text-primary">Gestión de Mesas</h1>
        <p className="text-sm text-muted mt-1">{mesas?.length ?? 0} mesas registradas</p>
      </div>

      <AdminMesasClient
        initialMesas={(mesas ?? []) as Tables<'mesas'>[]}
      />
    </div>
  );
}
