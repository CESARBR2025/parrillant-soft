'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, Pencil, Power, PowerOff, Store, Users, Check, X, Mail, Trash2, Building2, UserX, Globe,
} from 'lucide-react';
import { crearUsuario, actualizarUsuario, toggleActivoUsuario, eliminarUsuario, asignarSucursal, removerSucursal } from '@/app/actions/usuarios';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type PerfilRow = {
  id: string;
  rol: string;
  nombre: string;
  activo: boolean;
};

type SucursalRow = {
  id: string;
  slug: string;
  nombre: string;
  activa: boolean;
};

const ROLES = [
  { value: 'super_admin', label: 'Super Administrador' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'gerente_sucursal', label: 'Gerente Sucursal' },
  { value: 'caja', label: 'Caja' },
  { value: 'mesero', label: 'Mesero' },
  { value: 'barra', label: 'Barra' },
  { value: 'cocina', label: 'Cocina' },
] as const;

const ROL_ORDER: Record<string, number> = {
  super_admin: 0,
  administrador: 1,
  gerente_sucursal: 2,
  caja: 3,
  cocina: 4,
  barra: 5,
  mesero: 6,
};

const ROL_VARIANT: Record<string, 'danger' | 'default' | 'success' | 'warning' | 'purple' | 'info'> = {
  super_admin: 'danger',
  administrador: 'purple',
  gerente_sucursal: 'info',
  caja: 'info',
  mesero: 'success',
  barra: 'purple',
  cocina: 'default',
};

type Tab = 'todos' | 'por_sucursal' | 'super_admin' | 'sin_sucursal';

interface Props {
  initialUsuarios: PerfilRow[];
  emails: Record<string, string>;
  sucursalesPorUsuario: Record<string, { id: string; slug: string; nombre: string }[]>;
  sucursales: SucursalRow[];
  usuariosPorSucursal: Record<string, PerfilRow[]>;
  usuariosSinSucursal: PerfilRow[];
  usuariosGlobales: PerfilRow[];
}

export function AdminUsuariosClient({
  initialUsuarios,
  emails,
  sucursalesPorUsuario,
  sucursales,
  usuariosPorSucursal,
  usuariosSinSucursal,
  usuariosGlobales,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('todos');
  const [showModal, setShowModal] = useState<'crear' | 'editar' | 'sucursales' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      toast.error(result.error);
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
      toast.error(result.error);
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
      toast.error(result.error);
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
      toast.error(result.error);
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

  const TAB_ITEMS: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'todos', label: 'Todos', icon: Users, count: initialUsuarios.length },
    { key: 'por_sucursal', label: 'Por Sucursal', icon: Building2, count: sucursales.length },
    { key: 'super_admin', label: 'Super Admin', icon: Globe, count: usuariosGlobales.length },
    { key: 'sin_sucursal', label: 'Sin Sucursal', icon: UserX, count: usuariosSinSucursal.length },
  ];

  const TABS_HEADER = (
    <div className="flex gap-1 bg-bg-base rounded-xl p-1 w-fit">
      {TAB_ITEMS.map(t => (
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
  );

  const TABLA_USUARIO = ({ usuarios, mostrarSucursales = true }: { usuarios: PerfilRow[]; mostrarSucursales?: boolean }) => {
    const ordenados = [...usuarios].sort((a, b) => (ROL_ORDER[a.rol] ?? 99) - (ROL_ORDER[b.rol] ?? 99));
    return ordenados.length === 0 ? null : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-border/60">
            <th className="pb-3 font-semibold">Nombre</th>
            <th className="pb-3 font-semibold hidden sm:table-cell">Email</th>
            <th className="pb-3 font-semibold">Rol</th>
            {mostrarSucursales && <th className="pb-3 font-semibold hidden md:table-cell">Sucursales</th>}
            <th className="pb-3 font-semibold">Estado</th>
            <th className="pb-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map(u => {
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
                {mostrarSucursales && (
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
                )}
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
                    {u.rol !== 'super_admin' && (
                      <button
                        onClick={() => openSucursales(u)}
                        className="p-1.5 rounded-lg text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Asignar sucursales"
                      >
                        <Store className="w-4 h-4" />
                      </button>
                    )}
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
                            toast.error(result.error);
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
  );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {TABS_HEADER}
        <Button onClick={() => { resetForm(); setShowModal('crear'); }}>
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tab: Todos */}
      {tab === 'todos' && (
        initialUsuarios.length === 0
          ? <EmptyState icon={Users} title="Sin usuarios" description="Crea el primer usuario" />
          : <TABLA_USUARIO usuarios={initialUsuarios} />
      )}

      {/* Tab: Por Sucursal */}
      {tab === 'por_sucursal' && (
        <div className="space-y-4">
          {sucursales.map(s => {
            const usuariosDeSuc = usuariosPorSucursal[s.id] ?? [];
            return (
              <details key={s.id} className="bg-card border-2 border-border-default rounded-2xl overflow-hidden group">
                <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-base/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary">{s.nombre}</p>
                    <p className="text-xs text-muted">{usuariosDeSuc.length} usuarios</p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {usuariosDeSuc.length}
                  </Badge>
                </summary>
                <div className="px-4 pb-4">
                  {usuariosDeSuc.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">Sin usuarios asignados</p>
                  ) : (
                    <TABLA_USUARIO usuarios={usuariosDeSuc} mostrarSucursales={false} />
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* Tab: Super Admin */}
      {tab === 'super_admin' && (
        usuariosGlobales.length === 0
          ? <EmptyState icon={Globe} title="Sin super admins" description="No hay usuarios con rol super_admin" />
          : <TABLA_USUARIO usuarios={usuariosGlobales} mostrarSucursales={false} />
      )}

      {/* Tab: Sin Sucursal */}
      {tab === 'sin_sucursal' && (
        usuariosSinSucursal.length === 0
          ? <EmptyState icon={UserX} title="Sin pendientes" description="Todos los usuarios tienen sucursal asignada" />
          : <TABLA_USUARIO usuarios={usuariosSinSucursal} mostrarSucursales={false} />
      )}

      {/* Create Modal */}
      {showModal === 'crear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Nuevo Usuario</h2>
                <button onClick={() => { setShowModal(null); resetForm(); }} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">Email</label>
                <div className="flex items-center bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body">
                  <input
                    type="text" value={email}
                    onChange={e => setEmail(e.target.value.replace(/[^a-z0-9._-]/g, ''))}
                    className="flex-1 bg-transparent outline-none text-body" placeholder="usuario"
                  />
                  <span className="text-muted shrink-0">@parrilla.com</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body uppercase" placeholder="Nombre del usuario" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-2">Asignar a sucursales</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sucursales.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedSucursales.includes(s.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedSucursales(prev => [...prev, s.id]);
                          else setSelectedSucursales(prev => prev.filter(id => id !== s.id));
                        }}
                        className="rounded border-border/60 text-accent"
                      />
                      <span className="text-sm text-body">{s.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(null); resetForm(); }}>Cancelar</Button>
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
                <button onClick={() => { setShowModal(null); resetForm(); }} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body uppercase" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value)}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(null); resetForm(); }}>Cancelar</Button>
                <Button className="flex-1" loading={isSubmitting} onClick={handleEdit}>Guardar</Button>
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
                <h2 className="text-lg font-bold text-text-primary">Sucursales de {nombre}</h2>
                <button onClick={() => { setShowModal(null); resetForm(); }} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
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
                <Button variant="secondary" className="w-full" onClick={() => { setShowModal(null); resetForm(); }}>Cerrar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
