import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchSucursalBySlug, fetchSucursalesByUserId } from '@/lib/sucursal';

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

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol, activo')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string; activo: boolean } | null;

  if (!perfil || !perfil.activo) redirect('/login');

  const userSucursales = await fetchSucursalesByUserId(user.id);
  const tieneAcceso = perfil.rol === 'super_admin' || perfil.rol === 'admin' ||
    userSucursales.some(s => s.id === sucursal.id);

  if (!tieneAcceso) {
    const primeraSucursal = userSucursales[0];
    if (primeraSucursal) redirect(`/${primeraSucursal.slug}/${perfil.rol}`);
    redirect('/login');
  }

  return <>{children}</>;
}
