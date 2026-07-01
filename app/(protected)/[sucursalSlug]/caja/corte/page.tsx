import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerSucursalId } from '@/lib/sucursal';
import { CorteDiario } from '@/components/corte/CorteDiario';
import { obtenerCorte } from '@/app/actions/cortes';
import { redirect } from 'next/navigation';

export default async function CajaCortePage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sucursalId = await getServerSucursalId();
  if (!sucursalId) redirect('/login');

  const resumen = await obtenerCorte();

  return (
    <CorteDiario
      cortes={resumen.cortes}
      periodoActual={resumen.periodoActual}
      puedeGenerar={true}
      aperturaHoy={resumen.aperturaHoy}
      cierreHoy={resumen.cierreHoy}
    />
  );
}
