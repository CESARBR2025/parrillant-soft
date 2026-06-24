'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X, Users, UserPlus, UserMinus } from 'lucide-react';
import { asignarSucursal, removerSucursal } from '@/app/actions/usuarios';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface UsuarioSimple {
  id: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

const ROL_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  caja: 'Caja',
  mesero: 'Mesero',
  barra: 'Barra',
  cocina: 'Cocina',
};

const ROL_VARIANT: Record<string, 'danger' | 'default' | 'success' | 'warning' | 'purple' | 'info'> = {
  super_admin: 'danger',
  admin: 'warning',
  caja: 'info',
  mesero: 'success',
  barra: 'purple',
  cocina: 'default',
};

export function SucursalUsuariosClient({
  usuariosAsignados,
  usuariosDisponibles,
  sucursalId,
}: {
  usuariosAsignados: UsuarioSimple[];
  usuariosDisponibles: UsuarioSimple[];
  sucursalId: string;
}) {
  const router = useRouter();
  const [showAgregar, setShowAgregar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleAsignar = async (usuarioId: string) => {
    setIsSubmitting(usuarioId);
    const result = await asignarSucursal(usuarioId, sucursalId);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowAgregar(false);
      router.refresh();
    }
  };

  const handleRemover = async (usuarioId: string) => {
    if (!confirm('¿Remover este usuario de la sucursal?')) return;
    setIsSubmitting(usuarioId);
    const result = await removerSucursal(usuarioId, sucursalId);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {usuariosAsignados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin usuarios asignados"
          description="Agrega usuarios a esta sucursal para que puedan operar aquí"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border/60">
                <th className="pb-3 font-semibold">Nombre</th>
                <th className="pb-3 font-semibold">Rol</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosAsignados.map(u => (
                <tr key={u.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                  <td className="py-3 font-medium text-text-primary">{u.nombre}</td>
                  <td className="py-3">
                    <Badge variant={ROL_VARIANT[u.rol] ?? 'default'}>
                      {ROL_LABEL[u.rol] ?? u.rol}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={u.activo ? 'success' : 'danger'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleRemover(u.id)}
                      disabled={isSubmitting === u.id}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <UserMinus className="w-3 h-3" />
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agregar usuario */}
      <div>
        <Button onClick={() => setShowAgregar(true)} variant="secondary">
          <UserPlus className="w-4 h-4" />
          Agregar Usuario
        </Button>
      </div>

      {showAgregar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Agregar Usuario</h2>
                <button
                  onClick={() => setShowAgregar(false)}
                  className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {usuariosDisponibles.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No hay usuarios disponibles para agregar
                </p>
              ) : (
                usuariosDisponibles.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-base"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{u.nombre}</p>
                      <Badge variant={ROL_VARIANT[u.rol] ?? 'default'}>
                        {ROL_LABEL[u.rol] ?? u.rol}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleAsignar(u.id)}
                      disabled={isSubmitting === u.id}
                      className="text-xs text-accent hover:text-accent-dark bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSubmitting === u.id ? '...' : 'Agregar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
