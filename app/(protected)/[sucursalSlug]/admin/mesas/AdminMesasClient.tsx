'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CircleOff, Check, X, Table2 } from 'lucide-react';
import { generarMesas } from '@/app/actions/generarMesas';
import { actualizarMesa, cambiarEstadoMesa, eliminarMesa } from '@/app/actions/actualizarMesa';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Tables } from '@/types/database.types';

type Mesa = Tables<'mesas'>;

const ZONAS = ['Salón Principal', 'Terraza', 'VIP', 'Barra'];

const ESTADO_VARIANT: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  disponible: 'success',
  ocupada: 'warning',
  reservada: 'warning',
  fuera_de_servicio: 'danger',
};

const ESTADO_LABEL: Record<string, string> = {
  disponible: 'Disponible',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  fuera_de_servicio: 'Fuera de servicio',
};

export function AdminMesasClient({ initialMesas }: { initialMesas: Mesa[] }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  // Bulk generate form
  const [cantidad, setCantidad] = useState(30);
  const [desde, setDesde] = useState(1);
  const [capacidad, setCapacidad] = useState(4);
  const [zona, setZona] = useState('Salón Principal');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNumero, setEditNumero] = useState(0);
  const [editCapacidad, setEditCapacidad] = useState(4);
  const [editZona, setEditZona] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generarMesas(cantidad, desde, capacidad, zona || null);
    setIsGenerating(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${cantidad} mesas generadas correctamente`);
      router.refresh();
    }
  };

  const handleEdit = async (id: number) => {
    const result = await actualizarMesa(id, {
      numero: editNumero,
      capacidad: editCapacidad,
      zona: editZona,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setEditingId(null);
      toast.success('Mesa actualizada');
      router.refresh();
    }
  };

  const handleToggleStatus = async (mesa: Mesa) => {
    const nuevoEstado: 'disponible' | 'fuera_de_servicio' = mesa.estado === 'fuera_de_servicio' ? 'disponible' : 'fuera_de_servicio';
    const result = await cambiarEstadoMesa(mesa.id, nuevoEstado);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(nuevoEstado === 'disponible' ? 'Mesa disponible' : 'Mesa fuera de servicio');
      router.refresh();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) return;
    const result = await eliminarMesa(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Mesa eliminada');
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Bulk Generator */}
      <section className="bg-card border-2 border-border/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-accent" />
          Generar Mesas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-muted mb-1">Cantidad</label>
            <input
              type="number"
              value={cantidad}
              onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
              className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Numerar desde</label>
            <input
              type="number"
              value={desde}
              onChange={e => setDesde(Math.max(1, Number(e.target.value)))}
              className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Capacidad</label>
            <input
              type="number"
              value={capacidad}
              onChange={e => setCapacidad(Math.max(1, Number(e.target.value)))}
              className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Zona</label>
            <select
              value={zona}
              onChange={e => setZona(e.target.value)}
              className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body"
            >
              <option value="">Sin zona</option>
              {ZONAS.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={handleGenerate} loading={isGenerating}>
          {isGenerating ? 'Generando...' : `Generar ${cantidad} mesas`}
        </Button>
      </section>

      {/* Mesa List */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Table2 className="w-4 h-4 text-accent" />
          Mesas Registradas
        </h2>

        {initialMesas.length === 0 ? (
          <EmptyState
            icon={Table2}
            title="Sin mesas"
            description="Usa el formulario de arriba para generar las mesas de esta sucursal"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border/60">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Zona</th>
                  <th className="pb-3 font-semibold">Capacidad</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initialMesas.map(mesa => (
                  <tr key={mesa.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                    {editingId === mesa.id ? (
                      <>
                        <td className="py-3">
                          <input
                            type="number"
                            value={editNumero}
                            onChange={e => setEditNumero(Number(e.target.value))}
                            className="w-16 bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="py-3">
                          <select
                            value={editZona ?? ''}
                            onChange={e => setEditZona(e.target.value || null)}
                            className="bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-sm"
                          >
                            <option value="">Sin zona</option>
                            {ZONAS.map(z => (
                              <option key={z} value={z}>{z}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={editCapacidad}
                            onChange={e => setEditCapacidad(Number(e.target.value))}
                            className="w-16 bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="py-3">
                          <Badge variant={ESTADO_VARIANT[mesa.estado] ?? 'default'}>
                            {ESTADO_LABEL[mesa.estado] ?? mesa.estado}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(mesa.id)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg text-muted hover:bg-bg-base transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 font-medium text-text-primary">Mesa {mesa.numero}</td>
                        <td className="py-3 text-muted capitalize">{mesa.zona?.replace(/_/g, ' ') ?? '—'}</td>
                        <td className="py-3 text-muted">{mesa.capacidad} pers.</td>
                        <td className="py-3">
                          <Badge variant={ESTADO_VARIANT[mesa.estado] ?? 'default'}>
                            {ESTADO_LABEL[mesa.estado] ?? mesa.estado}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingId(mesa.id);
                                setEditNumero(mesa.numero);
                                setEditCapacidad(mesa.capacidad);
                                setEditZona(mesa.zona);
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(mesa)}
                              className="p-1.5 rounded-lg text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title={mesa.estado === 'fuera_de_servicio' ? 'Poner disponible' : 'Fuera de servicio'}
                            >
                              <CircleOff className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(mesa.id)}
                              className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
