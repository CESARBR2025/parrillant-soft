import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId } from '@/lib/sucursal';
import { CorteDiario } from '@/components/corte/CorteDiario';
import { obtenerCorte } from '@/app/actions/cortes';
import { redirect } from 'next/navigation';

export default async function CortePage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;
  const rol = perfil?.rol ?? '';
  const puedeGenerar = ['gerente_sucursal', 'administrador', 'super_admin', 'caja'].includes(rol);

  const resumen = await obtenerCorte();

  return (
    <div className="space-y-6">
      <CorteDiario
        cortes={resumen.cortes}
        periodoActual={resumen.periodoActual}
        puedeGenerar={puedeGenerar}
        aperturaHoy={resumen.aperturaHoy}
        cierreHoy={resumen.cierreHoy}
      />
    </div>
  );
}
