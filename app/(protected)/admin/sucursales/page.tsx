import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SucursalesClient } from './SucursalesClient';
import type { Tables } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function AdminSucursalesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || perfil.rol !== 'super_admin') {
    redirect('/admin');
  }

  const sucursalesRaw = await supabase
    .from('sucursales')
    .select('*')
    .order('nombre');
  const sucursales = sucursalesRaw.data as unknown as Tables<'sucursales'>[] | null;

  const categoriasRaw = await supabase
    .from('categorias')
    .select('sucursal_id');
  const categorias: { sucursal_id: string }[] = categoriasRaw.data as unknown as { sucursal_id: string }[] ?? [];

  const mesasRaw = await supabase
    .from('mesas')
    .select('sucursal_id');
  const mesas: { sucursal_id: string }[] = mesasRaw.data as unknown as { sucursal_id: string }[] ?? [];

  const usuariosRaw = await supabase
    .from('usuario_sucursales')
    .select('sucursal_id');
  const usuarios: { sucursal_id: string }[] = usuariosRaw.data as unknown as { sucursal_id: string }[] ?? [];

  const mesasPorSucursal: Record<string, number> = {};
  for (const m of mesas) {
    mesasPorSucursal[m.sucursal_id] = (mesasPorSucursal[m.sucursal_id] ?? 0) + 1;
  }

  const categoriasPorSucursal: Record<string, number> = {};
  for (const c of categorias) {
    categoriasPorSucursal[c.sucursal_id] = (categoriasPorSucursal[c.sucursal_id] ?? 0) + 1;
  }

  const usuariosPorSucursal: Record<string, number> = {};
  for (const u of usuarios) {
    usuariosPorSucursal[u.sucursal_id] = (usuariosPorSucursal[u.sucursal_id] ?? 0) + 1;
  }

  const activas = sucursales?.filter(s => s.activa).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Sucursales</h1>
      </div>

      <SucursalesClient
        initialSucursales={sucursales as unknown as Tables<'sucursales'>[]}
        mesasCount={mesasPorSucursal}
        categoriasCount={categoriasPorSucursal}
        usuariosCount={usuariosPorSucursal}
        totalActivas={activas}
      />
    </div>
  );
}
