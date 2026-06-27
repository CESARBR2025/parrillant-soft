'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Check, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { crearRol, eliminarRol, actualizarRol } from '@/app/actions/roles';
import { toast } from 'sonner';

interface RolRow {
  nombre: string;
  etiqueta: string;
  descripcion: string | null;
  nivel: number;
}

interface RolesClientProps {
  roles: RolRow[];
  conteo: Record<string, number>;
  badgeStyles: Record<string, string>;
}

export function RolesClient({ roles, conteo, badgeStyles }: RolesClientProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState<'crear' | 'editar' | null>(null);
  const [editingRol, setEditingRol] = useState<RolRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    const result = await crearRol(form);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rol creado');
      setShowModal(null);
      router.refresh();
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRol) return;
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    const result = await actualizarRol(editingRol.nombre, form);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rol actualizado');
      setShowModal(null);
      setEditingRol(null);
      router.refresh();
    }
  };

  const handleDelete = async (nombre: string) => {
    setIsSubmitting(true);
    const result = await eliminarRol(nombre);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rol eliminado');
      setConfirmDelete(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal('crear')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((rol) => (
          <div
            key={rol.nombre}
            className="bg-card border-2 border-border-default rounded-2xl p-5 relative group"
          >
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingRol(rol);
                  setShowModal('editar');
                }}
                className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-bg-base transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(rol.nombre)}
                className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start justify-between mb-3 pr-14">
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[rol.nombre] ?? 'bg-gray-500/15 text-gray-500 ring-1 ring-gray-500/30'}`}
                >
                  {rol.etiqueta}
                </span>
                <p className="text-xs text-muted mt-1.5 font-mono">{rol.nombre}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-text-primary">
                  {conteo[rol.nombre] ?? 0}
                </p>
                <p className="text-[10px] text-muted">usuarios</p>
              </div>
            </div>
            <p className="text-sm text-muted">{rol.descripcion ?? 'Sin descripción'}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 rounded-full bg-accent/20 flex-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.min((rol.nivel / 6) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted font-medium">
                Nivel {rol.nivel}/6
              </span>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">No hay roles definidos</p>
        </div>
      )}

      {/* Modal crear */}
      {showModal === 'crear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(null)} />
          <div className="relative bg-card rounded-2xl border-2 border-border-default shadow-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">Nuevo Rol</h2>
              <button
                onClick={() => setShowModal(null)}
                className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-bg-base transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Identificador *
                </label>
                <input
                  name="nombre"
                  required
                  placeholder="ej: capturista"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-[10px] text-muted mt-1">Solo letras y guiones bajos</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nombre visible *
                </label>
                <input
                  name="etiqueta"
                  required
                  placeholder="ej: Capturista"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  rows={2}
                  placeholder="¿Qué permisos tiene este rol?"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nivel de jerarquía *
                </label>
                <input
                  name="nivel"
                  type="number"
                  required
                  min={1}
                  max={10}
                  defaultValue={1}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-[10px] text-muted mt-1">1 = menor acceso, 10 = mayor acceso</p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Crear Rol
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {showModal === 'editar' && editingRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowModal(null); setEditingRol(null); }} />
          <div className="relative bg-card rounded-2xl border-2 border-border-default shadow-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">Editar Rol</h2>
              <button
                onClick={() => { setShowModal(null); setEditingRol(null); }}
                className="p-1.5 rounded-lg text-muted hover:text-body hover:bg-bg-base transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Identificador
                </label>
                <input
                  value={editingRol.nombre}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base/50 text-sm text-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nombre visible
                </label>
                <input
                  name="etiqueta"
                  defaultValue={editingRol.etiqueta}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  rows={2}
                  defaultValue={editingRol.descripcion ?? ''}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nivel
                </label>
                <input
                  name="nivel"
                  type="number"
                  required
                  min={1}
                  max={10}
                  defaultValue={editingRol.nivel}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border-default bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-card rounded-2xl border-2 border-border-default shadow-card w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Eliminar Rol</h2>
            <p className="text-sm text-muted mb-6">
              ¿Estás seguro de eliminar <strong className="text-text-primary">{confirmDelete}</strong>?
              Los usuarios con este rol se quedarán sin rol asignado.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border-default text-sm font-medium text-muted hover:text-body hover:bg-bg-base transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
