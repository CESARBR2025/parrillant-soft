import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SucursalProvider } from '@/components/providers/SucursalProvider';
import { fetchSucursalBySlug, fetchSucursalesByUserId } from '@/lib/sucursal';
import type { Sucursal } from '@/types/roles';

export default async function SucursalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sucursalSlug: string }>;
}) {
  const { sucursalSlug } = await params;

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sucursal = await fetchSucursalBySlug(sucursalSlug);
  if (!sucursal) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, activo')
    .eq('id', user.id)
    .single();

  if (!perfil || !perfil.activo) redirect('/login');

  const userSucursales = await fetchSucursalesByUserId(user.id);
  const tieneAcceso = perfil.rol === 'super_admin' || perfil.rol === 'admin' ||
    userSucursales.some(s => s.id === sucursal.id);

  if (!tieneAcceso) {
    const primeraSucursal = userSucursales[0];
    if (primeraSucursal) redirect(`/${primeraSucursal.slug}/${perfil.rol}`);
    redirect('/login');
  }

  return (
    <SucursalProvider sucursal={sucursal as unknown as Sucursal}>
      {children}
    </SucursalProvider>
  );
}
