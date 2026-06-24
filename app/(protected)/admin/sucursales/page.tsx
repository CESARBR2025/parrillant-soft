import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SucursalesClient } from './SucursalesClient';
import type { Tables } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function AdminSucursalesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.rol !== 'super_admin') {
    redirect('/admin');
  }

  const { data: sucursales } = await supabase
    .from('sucursales')
    .select('*')
    .order('nombre');

  const { data: categoriasRaw } = await supabase
    .from('categorias')
    .select('sucursal_id');
  const categorias = categoriasRaw as unknown as { sucursal_id: string }[];

  const { data: mesas } = await supabase
    .from('mesas')
    .select('sucursal_id');

  const mesasPorSucursal: Record<string, number> = {};
  for (const m of mesas ?? []) {
    mesasPorSucursal[m.sucursal_id] = (mesasPorSucursal[m.sucursal_id] ?? 0) + 1;
  }

  const categoriasPorSucursal: Record<string, number> = {};
  for (const c of categorias ?? []) {
    categoriasPorSucursal[c.sucursal_id] = (categoriasPorSucursal[c.sucursal_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/admin"
          className="text-xs md:text-sm text-muted hover:text-body transition-colors mb-1 inline-block"
        >
          ← Panel Global
        </a>
        <h1 className="text-xl font-bold text-text-primary">Sucursales</h1>
        <p className="text-sm text-muted mt-1">{sucursales?.length ?? 0} sucursales registradas</p>
      </div>

      <SucursalesClient
        initialSucursales={sucursales as unknown as Tables<'sucursales'>[]}
        mesasCount={mesasPorSucursal}
        categoriasCount={categoriasPorSucursal}
      />
    </div>
  );
}
