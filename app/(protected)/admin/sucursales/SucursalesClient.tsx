'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Power, PowerOff, Store, X, Search,
  MapPin, Table2, Users, LayoutGrid, ExternalLink,
} from 'lucide-react';
import { crearSucursal, actualizarSucursal, toggleSucursalActiva, eliminarSucursal } from '@/app/actions/sucursales';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Tables } from '@/types/database.types';

type Sucursal = Tables<'sucursales'>;

export function SucursalesClient({
  initialSucursales,
  mesasCount,
  categoriasCount,
  usuariosCount,
  totalActivas,
}: {
  initialSucursales: Sucursal[];
  mesasCount: Record<string, number>;
  categoriasCount: Record<string, number>;
  usuariosCount: Record<string, number>;
  totalActivas: number;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState<'crear' | 'editar' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tab, setTab] = useState<'todas' | 'activas' | 'inactivas'>('todas');

  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [direccion, setDireccion] = useState('');
  const [clonarDesdeId, setClonarDesdeId] = useState<string>('');

  const resetForm = () => {
    setNombre('');
    setSlug('');
    setDireccion('');
    setClonarDesdeId('');
    setEditingId(null);
    setStep(1);
  };

  const handleNombreChange = (val: string) => {
    setNombre(val);
    if (showModal === 'crear' && !editingId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  const handleCreate = async () => {
    if (!nombre.trim()) return;
    setIsSubmitting(true);
    const result = await crearSucursal({
      slug: slug || nombre.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      nombre: nombre.trim(),
      direccion: direccion || null,
      clonarDesdeId: clonarDesdeId || null,
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowModal(null);
      resetForm();
      toast.success('Sucursal creada correctamente');
      router.refresh();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !editingId) return;
    setIsSubmitting(true);
    const result = await actualizarSucursal(editingId, {
      slug,
      nombre: nombre.trim(),
      direccion,
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowModal(null);
      resetForm();
      toast.success('Sucursal actualizada');
      router.refresh();
    }
  };

  const handleToggle = async (s: Sucursal) => {
    const result = await toggleSucursalActiva(s.id, !s.activa);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(s.activa ? 'Sucursal desactivada' : 'Sucursal activada');
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsSubmitting(true);
    const result = await eliminarSucursal(confirmDelete);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setConfirmDelete(null);
      toast.success('Sucursal eliminada');
      router.refresh();
    }
  };

  const openEdit = (s: Sucursal) => {
    setEditingId(s.id);
    setNombre(s.nombre);
    setSlug(s.slug);
    setDireccion(s.direccion ?? '');
    setShowModal('editar');
  };

  const totalInactivas = initialSucursales.length - totalActivas;

  const filtradas = useMemo(() => {
    let list = initialSucursales;
    if (tab === 'activas') list = list.filter(s => s.activa);
    else if (tab === 'inactivas') list = list.filter(s => !s.activa);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      s => s.nombre.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || s.direccion?.toLowerCase().includes(q)
    );
  }, [initialSucursales, tab, search]);

  return (
    <div className="space-y-6">
      {/* Segments */}
      <div className="flex gap-1 bg-bg-base rounded-xl p-1 w-fit">
        {[
          { key: 'todas' as const, label: 'Todas', icon: Store, count: initialSucursales.length },
          { key: 'activas' as const, label: 'Activas', icon: Power, count: totalActivas },
          { key: 'inactivas' as const, label: 'Inactivas', icon: PowerOff, count: totalInactivas },
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar sucursal..."
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-3 py-2 text-sm text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowModal('crear'); }}>
          <Plus className="w-4 h-4" />
          Nueva Sucursal
        </Button>
      </div>

      {/* Cards */}
      {filtradas.length === 0 ? (
        <EmptyState
          icon={search ? Search : Store}
          title={search ? 'Sin resultados' : 'Sin sucursales'}
          description={search ? 'Intenta con otro término de búsqueda' : 'Crea la primera sucursal para comenzar'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map(s => (
            <div
              key={s.id}
              className={`group bg-white rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:border-accent/20 border-2 ${
                s.activa ? 'border-border/60' : 'border-border/40 opacity-75'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    s.activa ? 'bg-accent/15 text-accent' : 'bg-muted/20 text-muted'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{s.nombre}</h3>
                    <p className="text-xs text-muted font-mono truncate">{s.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${s.activa ? 'bg-green-500' : 'bg-red-400'}`} />
                  <Badge variant={s.activa ? 'success' : 'danger'} className="text-[10px] px-1.5 py-0.5">
                    {s.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>

              {/* Direction */}
              {s.direccion && (
                <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.direccion}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 py-3 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-xs text-muted" title="Mesas">
                  <Table2 className="w-3.5 h-3.5" />
                  <span>{mesasCount[s.id] ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted" title="Categorías del menú">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{categoriasCount[s.id] ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted" title="Usuarios asignados">
                  <Users className="w-3.5 h-3.5" />
                  <span>{usuariosCount[s.id] ?? 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <a
                  href={`/${s.slug}/admin`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ir al panel
                </a>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(s)}
                    className="p-1.5 rounded-lg text-muted hover:text-amber-600 hover:bg-amber-50/50 transition-colors"
                    title={s.activa ? 'Desactivar' : 'Activar'}
                  >
                    {s.activa ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(s.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50/50 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal (stepper) */}
      {showModal === 'crear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Store className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Nueva Sucursal</h2>
                    <p className="text-xs text-muted mt-0.5">Paso {step} de 2</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(null); resetForm(); }}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Step indicator */}
              <div className="flex gap-2 mt-4">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-border/60'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-border/60'}`} />
              </div>
            </div>

            {step === 1 && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                    placeholder="Ej: Parrilla Norteña Centro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body font-mono"
                    placeholder="ej: parrilla-centro"
                    readOnly
                    required
                  />
                  <p className="text-xs text-muted mt-1">Solo minúsculas, números y guiones</p>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Dirección *</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                    placeholder="Ej: Av. Principal 123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Clonar menú de</label>
                  <select
                    value={clonarDesdeId}
                    onChange={e => setClonarDesdeId(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  >
                    <option value="">No clonar (menú vacío)</option>
                    {initialSucursales.filter(s => s.activa && (categoriasCount[s.id] ?? 0) > 0).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({categoriasCount[s.id] ?? 0} categorías)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setShowModal(null); resetForm(); }}
                    type="button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    type="button"
                    onClick={() => {
                      if (!nombre.trim() || !slug.trim() || !direccion.trim()) {
                        toast.error('Completa todos los campos obligatorios');
                        return;
                      }
                      setStep(2);
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-6 space-y-4">
                <div className="bg-bg-base rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Resumen</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Nombre</span>
                      <span className="font-medium text-text-primary">{nombre}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Slug</span>
                      <span className="font-medium text-text-primary font-mono">{slug}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Dirección</span>
                      <span className="font-medium text-text-primary">{direccion}</span>
                    </div>
                    {clonarDesdeId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Clonar menú</span>
                        <span className="font-medium text-text-primary">
                          {initialSucursales.find(s => s.id === clonarDesdeId)?.nombre}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    Atrás
                  </Button>
                  <Button
                    className="flex-1"
                    loading={isSubmitting}
                    type="button"
                    onClick={handleCreate}
                  >
                    {isSubmitting ? 'Guardando...' : 'Registrar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Eliminar Sucursal</h2>
            <p className="text-sm text-muted mb-6">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" loading={isSubmitting} onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (single step) */}
      {showModal === 'editar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Store className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-lg font-bold text-text-primary">Editar Sucursal</h2>
                </div>
                <button
                  onClick={() => { setShowModal(null); resetForm(); }}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleEdit}>
              <div>
                <label className="block text-xs text-muted mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => handleNombreChange(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  placeholder="Ej: Parrilla Norteña Centro"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body font-mono"
                  placeholder="ej: parrilla-centro"
                  required
                />
                <p className="text-xs text-muted mt-1">Solo minúsculas, números y guiones</p>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Dirección *</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  placeholder="Ej: Av. Principal 123"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowModal(null); resetForm(); }}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
