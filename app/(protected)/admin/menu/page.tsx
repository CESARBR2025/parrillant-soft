import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Store, UtensilsCrossed } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GlobalMenuPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const perfilRaw = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();
  const perfil = perfilRaw.data as { rol: string } | null;

  if (!perfil || (perfil.rol !== 'super_admin' && perfil.rol !== 'admin')) {
    redirect('/admin');
  }

  const sucursalesRaw = await supabase
    .from('sucursales')
    .select('id, slug, nombre, activa')
    .order('nombre');
  const sucursales: { id: string; slug: string; nombre: string; activa: boolean }[] = sucursalesRaw.data ?? [];

  if (sucursales.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Menú</h1>
        <p className="text-muted">No hay sucursales registradas.</p>
      </div>
    );
  }

  if (sucursales.length === 1) {
    redirect(`/${sucursales[0].slug}/admin/menu`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Menú</h1>
        <p className="text-sm text-muted mt-1">
          Administra el menú por sucursal
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sucursales.map(s => (
          <Link
            key={s.id}
            href={`/${s.slug}/admin/menu`}
            className="bg-card rounded-2xl border-2 border-border-default p-6 hover:border-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary truncate">{s.nombre}</p>
                <p className="text-xs text-muted">
                  <UtensilsCrossed className="w-3 h-3 inline mr-1" />
                  Editar menú
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
