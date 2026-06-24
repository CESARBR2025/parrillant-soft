import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './supabase/server';
import type { Sucursal } from '@/types/roles';

const SUCURSAL_SLUG_COOKIE = 'sucursal_slug';
const SUCURSAL_ID_COOKIE = 'sucursal_id';

export async function getServerSucursal(): Promise<{ slug: string; id: string } | null> {
  const cookieStore = await cookies();
  const slug = cookieStore.get(SUCURSAL_SLUG_COOKIE)?.value;
  const id = cookieStore.get(SUCURSAL_ID_COOKIE)?.value;
  if (!slug || !id) return null;
  return { slug, id };
}

export async function getServerSucursalSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SUCURSAL_SLUG_COOKIE)?.value ?? null;
}

export async function getServerSucursalId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SUCURSAL_ID_COOKIE)?.value ?? null;
}

export async function fetchSucursalBySlug(slug: string): Promise<Sucursal | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('sucursales')
    .select('id, slug, nombre')
    .eq('slug', slug)
    .single();
  return data as Sucursal | null;
}

export async function fetchSucursalesByUserId(userId: string): Promise<Sucursal[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('usuario_sucursales')
    .select('sucursales!inner(id, slug, nombre)')
    .eq('usuario_id', userId);
  if (!data) return [];
  return data.map((row: { sucursales: Sucursal }) => row.sucursales as Sucursal);
}
