'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Power, PowerOff, Store, Check, X } from 'lucide-react';
import { crearSucursal, actualizarSucursal, toggleSucursalActiva, eliminarSucursal } from '@/app/actions/sucursales';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Tables } from '@/types/database.types';

type Sucursal = Tables<'sucursales'>;

export function SucursalesClient({
  initialSucursales,
  mesasCount,
  categoriasCount,
}: {
  initialSucursales: Sucursal[];
  mesasCount: Record<string, number>;
  categoriasCount: Record<string, number>;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState<'crear' | 'editar' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
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

  const handleEdit = async () => {
    if (!nombre.trim() || !editingId) return;
    setIsSubmitting(true);
    const result = await actualizarSucursal(editingId, {
      slug: slug || undefined,
      nombre: nombre.trim(),
      direccion: direccion || null,
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

  const handleDelete = async (s: Sucursal) => {
    if (!confirm(`¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    const result = await eliminarSucursal(s.id);
    if (result.error) {
      toast.error(result.error);
    } else {
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

  return (
    <div className="space-y-6">
      <Button onClick={() => { resetForm(); setShowModal('crear'); }}>
        <Plus className="w-4 h-4" />
        Nueva Sucursal
      </Button>

      {initialSucursales.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Sin sucursales"
          description="Crea la primera sucursal para comenzar"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border/60">
                <th className="pb-3 font-semibold">Nombre</th>
                <th className="pb-3 font-semibold">Slug</th>
                <th className="pb-3 font-semibold hidden sm:table-cell">Dirección</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 font-semibold hidden md:table-cell">Mesas</th>
                <th className="pb-3 font-semibold hidden md:table-cell">Menú</th>
                <th className="pb-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialSucursales.map(s => (
                <tr key={s.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                  <td className="py-3 font-medium text-text-primary">{s.nombre}</td>
                  <td className="py-3 text-muted font-mono text-xs">{s.slug}</td>
                  <td className="py-3 text-muted hidden sm:table-cell max-w-[200px] truncate">
                    {s.direccion ?? '—'}
                  </td>
                  <td className="py-3">
                    <Badge variant={s.activa ? 'success' : 'danger'}>
                      {s.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted hidden md:table-cell">{mesasCount[s.id] ?? 0}</td>
                  <td className="py-3 text-muted hidden md:table-cell">{categoriasCount[s.id] ?? 0} cat.</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/${s.slug}/admin`}
                        className="text-xs text-accent hover:underline mr-2"
                      >
                        Ir
                      </a>
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(s)}
                        className="p-1.5 rounded-lg text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title={s.activa ? 'Desactivar' : 'Activar'}
                      >
                        {s.activa ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Store className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {showModal === 'crear' ? 'Nueva Sucursal' : 'Editar Sucursal'}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(null); resetForm(); }}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => handleNombreChange(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  placeholder="Ej: Parrilla Norteña Centro"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body font-mono"
                  placeholder="ej: parrilla-centro"
                  readOnly={showModal === 'crear' && !editingId}
                />
                <p className="text-xs text-muted mt-1">Solo minúsculas, números y guiones</p>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  placeholder="Opcional"
                />
              </div>

              {showModal === 'crear' && (
                <div>
                  <label className="block text-xs text-muted mb-1">Clonar menú de</label>
                  <select
                    value={clonarDesdeId}
                    onChange={e => setClonarDesdeId(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  >
                    <option value="">No clonar (menú vacío)</option>
                    {initialSucursales.filter(s => s.activa).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({categoriasCount[s.id] ?? 0} categorías)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowModal(null); resetForm(); }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={isSubmitting}
                  onClick={showModal === 'crear' ? handleCreate : handleEdit}
                >
                  {isSubmitting ? 'Guardando...' : showModal === 'crear' ? 'Crear' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
