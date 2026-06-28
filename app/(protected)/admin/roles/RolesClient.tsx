'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Check, Loader2, Shield, AlertTriangle, KeyRound, Search } from 'lucide-react';
import { crearRol, eliminarRol, actualizarRol, asignarPermiso, removerPermiso } from '@/app/actions/roles';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface RolRow {
  nombre: string;
  etiqueta: string;
  descripcion: string | null;
}

interface PermisoRow {
  codigo: string;
  descripcion: string;
}

interface RolesClientProps {
  roles: RolRow[];
  conteo: Record<string, number>;
  badgeStyles: Record<string, string>;
  permisos: PermisoRow[];
  permisosPorRol: Record<string, string[]>;
}

const GRUPO_LABEL: Record<string, string> = {
  turnos: 'Turnos',
  sucursal: 'Sucursal',
  sucursales: 'Sucursales',
  ordenes: 'Órdenes',
  usuarios: 'Usuarios',
  usuario_sucursal: 'Sucursales',
  roles: 'Roles',
};

function grupoPermiso(codigo: string): string {
  return codigo.split('.')[0];
}

function permisosAgrupados(permisos: PermisoRow[]): [string, PermisoRow[]][] {
  const grupos: Record<string, PermisoRow[]> = {};
  for (const p of permisos) {
    const g = grupoPermiso(p.codigo);
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(p);
  }
  return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
}

export function RolesClient({ roles, conteo, badgeStyles, permisos, permisosPorRol }: RolesClientProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState<'crear' | 'editar' | 'permisos' | null>(null);
  const [editingRol, setEditingRol] = useState<RolRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permisosRolSeleccionado, setPermisosRolSeleccionado] = useState<string[]>([]);
  const [togglingPermiso, setTogglingPermiso] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState(1);
  const [rolNombre, setRolNombre] = useState('');
  const [rolEtiqueta, setRolEtiqueta] = useState('');
  const [rolDescripcion, setRolDescripcion] = useState('');

  const resetRolForm = () => {
    setRolNombre('');
    setRolEtiqueta('');
    setRolDescripcion('');
    setStep(1);
  };

  const handleCreate = async () => {
    if (!rolNombre.trim() || !rolEtiqueta.trim()) return;
    setIsSubmitting(true);
    const form = new FormData();
    form.set('nombre', rolNombre.trim().toLowerCase().replace(/\s+/g, '_'));
    form.set('etiqueta', rolEtiqueta.trim());
    form.set('descripcion', rolDescripcion.trim());
    const result = await crearRol(form);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rol creado');
      setShowModal(null);
      router.refresh();
      setEditingRol({ nombre: rolNombre.trim().toLowerCase().replace(/\s+/g, '_'), etiqueta: rolEtiqueta.trim(), descripcion: null });
      setPermisosRolSeleccionado([]);
      setShowModal('permisos');
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

  const handleTogglePermiso = async (permisoCodigo: string, tiene: boolean) => {
    if (!editingRol) return;
    setTogglingPermiso(permisoCodigo);
    const result = tiene
      ? await removerPermiso(editingRol.nombre, permisoCodigo)
      : await asignarPermiso(editingRol.nombre, permisoCodigo);
    setTogglingPermiso(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setPermisosRolSeleccionado(prev =>
        tiene
          ? prev.filter(p => p !== permisoCodigo)
          : [...prev, permisoCodigo]
      );
      toast.success(tiene ? 'Permiso removido' : 'Permiso asignado');
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

  const [tab, setTab] = useState<'todos' | 'con_permisos' | 'sin_permisos'>('todos');

  const filtrados = useMemo(() => {
    let list = roles;
    if (tab === 'con_permisos') list = list.filter(r => (permisosPorRol[r.nombre]?.length ?? 0) > 0);
    else if (tab === 'sin_permisos') list = list.filter(r => (permisosPorRol[r.nombre]?.length ?? 0) === 0);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      r => r.etiqueta.toLowerCase().includes(q) || r.nombre.toLowerCase().includes(q) || r.descripcion?.toLowerCase().includes(q)
    );
  }, [roles, tab, search, permisosPorRol]);

  return (
    <div className="space-y-6">
      {/* Segments */}
      <div className="flex gap-1 bg-bg-base rounded-xl p-1 w-fit">
        {[
          { key: 'todos' as const, label: 'Todos', icon: Shield, count: roles.length },
          { key: 'con_permisos' as const, label: 'Con permisos', icon: KeyRound, count: roles.filter(r => (permisosPorRol[r.nombre]?.length ?? 0) > 0).length },
          { key: 'sin_permisos' as const, label: 'Sin permisos', icon: X, count: roles.filter(r => (permisosPorRol[r.nombre]?.length ?? 0) === 0).length },
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
            placeholder="Buscar rol..."
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-3 py-2 text-sm text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>
        <Button onClick={() => { resetRolForm(); setShowModal('crear'); }}>
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </Button>
      </div>

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 bg-card border-2 border-dashed border-border/60 rounded-2xl">
          {search ? (
            <>
              <Search className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">No se encontraron roles con &quot;{search}&quot;</p>
            </>
          ) : (
            <>
              <Shield className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm mb-4">No hay roles definidos</p>
              <Button variant="secondary" onClick={() => { resetRolForm(); setShowModal('crear'); }}>
                <Plus className="w-4 h-4" />
                Crear primer rol
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((rol) => {
            const permCount = permisosPorRol[rol.nombre]?.length ?? 0;
            const userCount = conteo[rol.nombre] ?? 0;
            return (
              <Card
                key={rol.nombre}
                className="group transition-all duration-200 hover:shadow-lg hover:border-accent/20 flex flex-col"
              >
                {/* Top row: badge + user count */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${badgeStyles[rol.nombre] ?? 'bg-gray-500/15 text-gray-500 ring-1 ring-gray-500/30'}`}
                    >
                      {rol.etiqueta}
                    </span>
                    <p className="text-xs text-muted font-mono mt-1.5">{rol.nombre}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-text-primary leading-none">{userCount}</p>
                    <p className="text-[10px] text-muted mt-0.5">usuarios</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted flex-1 mb-4">
                  {rol.descripcion ?? 'Sin descripción'}
                </p>

                {/* Permission count */}
                <div className="flex items-center gap-1.5 text-xs text-muted mb-4 py-2 border-t border-border/40">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{permCount} de {permisos.length} permisos</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  {permCount > 0 ? (
                    <span className="text-xs text-muted">
                      {permCount} permiso{permCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500 font-medium">Sin permisos</span>
                  )}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setEditingRol(rol);
                        setPermisosRolSeleccionado(permisosPorRol[rol.nombre] ?? []);
                        setShowModal('permisos');
                      }}
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                      title="Permisos"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingRol(rol);
                        setShowModal('editar');
                      }}
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(rol.nombre)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50/50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal crear (stepper) */}
      {showModal === 'crear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Nuevo Rol</h2>
                    <p className="text-xs text-muted mt-0.5">Paso {step} de 2</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(null); resetRolForm(); }}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-border/60'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-border/60'}`} />
              </div>
            </div>

            {step === 1 && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Nombre visible *</label>
                  <input
                    value={rolEtiqueta}
                    onChange={e => {
                      setRolEtiqueta(e.target.value);
                      setRolNombre(e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, ''));
                    }}
                    required
                    placeholder="ej: Capturista"
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Identificador</label>
                  <input
                    value={rolNombre}
                    readOnly
                    className="w-full bg-bg-base/50 border border-border/60 rounded-xl px-3 py-2 text-sm text-muted font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted mt-1">Se genera automáticamente</p>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Descripción</label>
                  <textarea
                    value={rolDescripcion}
                    onChange={e => setRolDescripcion(e.target.value)}
                    rows={2}
                    placeholder="¿Qué permisos tiene este rol?"
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(null); resetRolForm(); }}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={() => {
                    if (!rolNombre.trim() || !rolEtiqueta.trim()) {
                      toast.error('Completa todos los campos obligatorios');
                      return;
                    }
                    setStep(2);
                  }}>
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
                      <span className="text-muted">Identificador</span>
                      <span className="font-medium text-text-primary font-mono">{rolNombre.trim().toLowerCase().replace(/\s+/g, '_')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Nombre visible</span>
                      <span className="font-medium text-text-primary">{rolEtiqueta.trim()}</span>
                    </div>
                    {rolDescripcion.trim() && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Descripción</span>
                        <span className="font-medium text-text-primary">{rolDescripcion.trim()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                    Atrás
                  </Button>
                  <Button className="flex-1" loading={isSubmitting} onClick={handleCreate}>
                    {isSubmitting ? 'Creando...' : 'Crear Rol'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal editar */}
      {showModal === 'editar' && editingRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-lg font-bold text-text-primary">Editar Rol</h2>
                </div>
                <button
                  onClick={() => { setShowModal(null); setEditingRol(null); }}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">Identificador</label>
                <input
                  value={editingRol.nombre}
                  disabled
                  className="w-full bg-bg-base/50 border border-border/60 rounded-xl px-3 py-2 text-sm text-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Nombre visible</label>
                <input
                  name="etiqueta"
                  defaultValue={editingRol.etiqueta}
                  required
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  defaultValue={editingRol.descripcion ?? ''}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(null); setEditingRol(null); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" loading={isSubmitting} type="submit">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal permisos */}
      {showModal === 'permisos' && editingRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Permisos</h2>
                    <p className="text-sm text-muted">
                      {editingRol.etiqueta} <span className="font-mono text-xs">({editingRol.nombre})</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(null); setEditingRol(null); }}
                  className="text-muted hover:text-body transition-colors p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {permisos.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No hay permisos definidos</p>
              )}
              {permisosAgrupados(permisos).map(([grupo, items]) => (
                <div key={grupo}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2 px-1">
                    {GRUPO_LABEL[grupo] ?? grupo}
                  </p>
                  <div className="space-y-1">
                    {items.map(p => {
                      const tiene = permisosRolSeleccionado.includes(p.codigo);
                      return (
                        <button
                          key={p.codigo}
                          onClick={() => handleTogglePermiso(p.codigo, tiene)}
                          disabled={togglingPermiso === p.codigo}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            tiene
                              ? 'bg-accent/10 hover:bg-accent/15 ring-1 ring-accent/20'
                              : 'hover:bg-bg-base'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            tiene
                              ? 'bg-accent border-accent'
                              : 'border-border-default'
                          }`}>
                            {tiene && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">{p.codigo}</p>
                            {p.descripcion && (
                              <p className="text-[11px] text-muted truncate">{p.descripcion}</p>
                            )}
                          </div>
                          {togglingPermiso === p.codigo && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border/40 shrink-0 bg-card rounded-b-3xl">
              <Button variant="secondary" className="w-full" onClick={() => { setShowModal(null); setEditingRol(null); }}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Eliminar Rol</h2>
            <p className="text-sm text-muted mb-6">
              ¿Estás seguro de eliminar <strong className="text-text-primary">{confirmDelete}</strong>?
              Los usuarios con este rol se quedarán sin rol asignado.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" loading={isSubmitting} onClick={() => handleDelete(confirmDelete)}>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
