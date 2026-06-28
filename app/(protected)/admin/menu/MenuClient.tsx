'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Store, UtensilsCrossed, Search, LayoutGrid, PowerOff, Power,
} from 'lucide-react';
import { useNavigate } from '@/components/providers/NavigationProvider';

interface Sucursal {
  id: string;
  slug: string;
  nombre: string;
  activa: boolean;
}

export function MenuClient({
  initialSucursales,
  categoriasCount,
}: {
  initialSucursales: Sucursal[];
  categoriasCount: Record<string, number>;
}) {
  const { push } = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'todas' | 'con-menu' | 'sin-menu'>('todas');

  const handleClick = useCallback((slug: string) => {
    push(`/${slug}/admin/menu`);
  }, [push]);

  const totalConMenu = initialSucursales.filter(s => (categoriasCount[s.id] ?? 0) > 0).length;
  const totalSinMenu = initialSucursales.length - totalConMenu;

  const filtradas = useMemo(() => {
    let list = initialSucursales;
    if (tab === 'con-menu') list = list.filter(s => (categoriasCount[s.id] ?? 0) > 0);
    else if (tab === 'sin-menu') list = list.filter(s => (categoriasCount[s.id] ?? 0) === 0);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(s => s.nombre.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
  }, [initialSucursales, tab, search, categoriasCount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Menú</h1>
        <p className="text-sm text-muted mt-1">Administra el menú por sucursal</p>
      </div>

      <div className="flex gap-1 bg-bg-base rounded-xl p-1 w-fit">
        {[
          { key: 'todas' as const, label: 'Todas', icon: Store, count: initialSucursales.length },
          { key: 'con-menu' as const, label: 'Con Menú', icon: LayoutGrid, count: totalConMenu },
          { key: 'sin-menu' as const, label: 'Sin Menú', icon: PowerOff, count: totalSinMenu },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-muted hover:text-body'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-accent/10 text-accent' : 'bg-bg-card text-muted'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar sucursal..."
          className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-3 py-2 text-sm text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
      </div>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
            {search ? <Search className="w-7 h-7 text-muted" /> : <UtensilsCrossed className="w-7 h-7 text-muted" />}
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">
            {search ? 'Sin resultados' : 'Sin sucursales'}
          </p>
          <p className="text-xs text-muted">
            {search ? 'Intenta con otro término de búsqueda' : 'No hay sucursales registradas'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtradas.map(s => {
            const tieneMenu = (categoriasCount[s.id] ?? 0) > 0;
            return (
              <button
                key={s.id}
                onClick={() => handleClick(s.slug)}
                className="bg-card rounded-2xl border-2 border-border-default p-6 hover:border-accent/50 transition-all text-left w-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tieneMenu ? 'bg-accent/10 text-accent' : 'bg-muted/20 text-muted'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary truncate">{s.nombre}</p>
                    <p className="text-xs text-muted">{s.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <UtensilsCrossed className="w-4 h-4" />
                    {categoriasCount[s.id] ?? 0} categorías
                  </span>
                  <span className={`flex items-center gap-1.5 ${tieneMenu ? 'text-accent' : 'text-muted'}`}>
                    {tieneMenu ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    {tieneMenu ? 'Editar menú' : 'Crear menú'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
