'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Pencil, Power, PowerOff, Store, Users, Check, X, Mail, Trash2,
} from 'lucide-react';
import { crearUsuario, actualizarUsuario, toggleActivoUsuario, eliminarUsuario, asignarSucursal, removerSucursal } from '@/app/actions/usuarios';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Tables } from '@/types/database.types';

type PerfilRow = Tables<'perfiles'>;
type SucursalRow = Tables<'sucursales'>;

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'caja', label: 'Caja' },
  { value: 'mesero', label: 'Mesero' },
  { value: 'barra', label: 'Barra' },
  { value: 'cocina', label: 'Cocina' },
] as const;

const ROL_VARIANT: Record<string, 'danger' | 'default' | 'success' | 'warning' | 'purple' | 'info'> = {
  super_admin: 'danger',
  admin: 'warning',
  caja: 'info',
  mesero: 'success',
  barra: 'purple',
  cocina: 'default',
};

export function AdminUsuariosClient({
  initialUsuarios,
  emails,
  sucursalesPorUsuario,
  sucursales,
}: {
  initialUsuarios: PerfilRow[];
  emails: Record<string, string>;
  sucursalesPorUsuario: Record<string, { id: string; slug: string; nombre: string }[]>;
  sucursales: SucursalRow[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState<'crear' | 'editar' | 'sucursales' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('mesero');
  const [selectedSucursales, setSelectedSucursales] = useState<string[]>([]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNombre('');
    setRol('mesero');
    setSelectedSucursales([]);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!email.trim() || !password.trim() || !nombre.trim()) return;
    setIsSubmitting(true);
    const result = await crearUsuario({
      email: `${email.trim()}@parrilla.com`,
      password,
      nombre: nombre.trim(),
      rol,
      sucursales: selectedSucursales,
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(
                        result.error);
    } else {
      setShowModal(null);
      resetForm();
      toast.success('Usuario creado correctamente');
      router.refresh();
    }
  };

  const handleEdit = async () => {
    if (!nombre.trim() || !editingId) return;
    setIsSubmitting(true);
    const result = await actualizarUsuario(editingId, {
      nombre: nombre.trim(),
      rol,
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(
                        result.error);
    } else {
      setShowModal(null);
      resetForm();
      toast.success('Usuario actualizado correctamente');
      router.refresh();
    }
  };

  const handleToggle = async (id: string) => {
    const result = await toggleActivoUsuario(id);
    if (result.error) {
      toast.error(
                        result.error);
    } else {
      toast.success(result.activo ? 'Usuario activado' : 'Usuario desactivado');
      router.refresh();
    }
  };

  const handleToggleSucursal = async (usuarioId: string, sucursalId: string, add: boolean) => {
    const result = add
      ? await asignarSucursal(usuarioId, sucursalId)
      : await removerSucursal(usuarioId, sucursalId);
    if (result.error) {
      toast.error(
                        result.error);
    } else {
      toast.success(add ? 'Usuario asignado a la sucursal' : 'Usuario removido de la sucursal');
      router.refresh();
    }
  };

  const openEdit = (u: PerfilRow) => {
    setEditingId(u.id);
    setNombre(u.nombre);
    setRol(u.rol);
    setShowModal('editar');
  };

  const openSucursales = (u: PerfilRow) => {
    setEditingId(u.id);
    setNombre(u.nombre);
    setSelectedSucursales(sucursalesPorUsuario[u.id]?.map(s => s.id) ?? []);
    setShowModal('sucursales');
  };

  return (
    <div className="space-y-6">
      <Button onClick={() => { resetForm(); setShowModal('crear'); }}>
        <Plus className="w-4 h-4" />
        Nuevo Usuario
      </Button>

      {initialUsuarios.length === 0 ? (
        <EmptyState icon={Users} title="Sin usuarios" description="Crea el primer usuario" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border/60">
                <th className="pb-3 font-semibold">Nombre</th>
                <th className="pb-3 font-semibold hidden sm:table-cell">Email</th>
                <th className="pb-3 font-semibold">Rol</th>
                <th className="pb-3 font-semibold hidden md:table-cell">Sucursales</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialUsuarios.map(u => {
                const userSucs = sucursalesPorUsuario[u.id] ?? [];
                return (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                    <td className="py-3 font-medium text-text-primary">{u.nombre}</td>
                    <td className="py-3 text-muted text-xs hidden sm:table-cell">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {emails[u.id] ?? '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={ROL_VARIANT[u.rol] ?? 'default'}>
                        {ROLES.find(r => r.value === u.rol)?.label ?? u.rol}
                      </Badge>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {userSucs.length === 0 ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          userSucs.map(s => (
                            <Badge key={s.id} variant="default" className="text-xs">
                              {s.nombre}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={u.activo ? 'success' : 'danger'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openSucursales(u)}
                          className="p-1.5 rounded-lg text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Asignar sucursales"
                        >
                          <Store className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(u.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title={u.activo ? 'Desactivar' : 'Activar'}
                        >
                          {u.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        {!u.activo && (
                          <button
                            onClick={async () => {
                              if (!confirm(`¿Eliminar permanentemente a ${u.nombre}?`)) return;
                              const result = await eliminarUsuario(u.id);
                              if (result.error) {
                                toast.error(
                        result.error);
                              } else {
                                toast.success('Usuario eliminado permanentemente');
                                router.refresh();
                              }
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal === 'crear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Nuevo Usuario</h2>
                <button
                  onClick={() => { setShowModal(null); resetForm(); }}
                  className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">Email</label>
                <div className="flex items-center bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body">
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value.replace(/[^a-z0-9._-]/g, ''))}
                    className="flex-1 bg-transparent outline-none text-body"
                    placeholder="usuario"
                  />
                  <span className="text-muted shrink-0">@parrilla.com</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                  placeholder="Nombre del usuario"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Rol</label>
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-2">Asignar a sucursales</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sucursales.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSucursales.includes(s.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSucursales(prev => [...prev, s.id]);
                          } else {
                            setSelectedSucursales(prev => prev.filter(id => id !== s.id));
                          }
                        }}
                        className="rounded border-border/60 text-accent"
                      />
                      <span className="text-sm text-body">{s.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(null); resetForm(); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" loading={isSubmitting} onClick={handleCreate}>
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal === 'editar' && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Editar Usuario</h2>
                <button
                  onClick={() => { setShowModal(null); resetForm(); }}
                  className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base"
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
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Rol</label>
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(null); resetForm(); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" loading={isSubmitting} onClick={handleEdit}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sucursales Modal */}
      {showModal === 'sucursales' && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">
                  Sucursales de {nombre}
                </h2>
                <button
                  onClick={() => { setShowModal(null); resetForm(); }}
                  className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {sucursales.map(s => {
                const asignada = selectedSucursales.includes(s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-base">
                    <span className="text-sm text-body">{s.nombre}</span>
                    <button
                      onClick={async () => {
                        await handleToggleSucursal(editingId, s.id, !asignada);
                        setSelectedSucursales(prev =>
                          asignada ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        asignada
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-accent/10 text-accent hover:bg-accent/20'
                      }`}
                    >
                      {asignada ? 'Remover' : 'Asignar'}
                    </button>
                  </div>
                );
              })}
              {sucursales.length === 0 && (
                <p className="text-sm text-muted text-center py-4">No hay sucursales activas</p>
              )}
              <div className="pt-2">
                <Button variant="secondary" className="w-full" onClick={() => { setShowModal(null); resetForm(); }}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
