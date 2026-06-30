'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, X, Clock, UserCheck, ArrowRight, Trash2, Pencil,
  CalendarDays, Repeat, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import {
  programarApertura, modificarApertura, toggleApertura, eliminarApertura,
  cerrarTurno, reasignarTurno, crearExcepcion,
  eliminarExcepcion, obtenerCalendarioMensual,
  obtenerSucursalesConApertura,
} from '@/app/actions/turnos';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type Tab = 'programaciones' | 'calendario';

interface AperturaSimple {
  id: string;
  sucursal_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  activa: boolean;
  recurrencia: string | null;
  recurrencia_fin: string | null;
}

interface TurnoSimple {
  id: string;
  usuario_id: string;
  inicio: string;
  usuario_nombre: string;
}

interface SucursalSimple {
  id: string;
  slug: string;
  nombre: string;
}

interface DiaCalendario {
  fecha: string;
  apertura: any | null;
  excepcion: any | null;
}

export function TurnosBranchClient({
  aperturas: aperturasIniciales,
  turnosActivos,
  sucursal,
  todasSucursales,
  aperturaHoyActiva,
  totalActivos,
  totalActivas,
}: {
  aperturas: AperturaSimple[];
  turnosActivos: TurnoSimple[];
  sucursal: SucursalSimple;
  todasSucursales: SucursalSimple[];
  aperturaHoyActiva: boolean;
  totalActivos: number;
  totalActivas: number;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('programaciones');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create modal
  const [showProgramar, setShowProgramar] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFin, setHoraFin] = useState('22:00');
  const [recurrencia, setRecurrencia] = useState<string>('');

  // Edit modal
  const [showEditarProgramacion, setShowEditarProgramacion] = useState<AperturaSimple | null>(null);

  // Reassign modal
  const [showReasignar, setShowReasignar] = useState<{ turnoId: string } | null>(null);
  const [sucursalDestino, setSucursalDestino] = useState('');
  const [otrasSucursales, setOtrasSucursales] = useState<SucursalSimple[]>([]);

  // Calendar
  const [mesActual, setMesActual] = useState(() => new Date());
  const [calendario, setCalendario] = useState<DiaCalendario[]>([]);
  const [loadingCalendario, setLoadingCalendario] = useState(false);

  // Edit day modal
  const [showEditarDia, setShowEditarDia] = useState<{
    fecha: string;
    apertura: any;
    excepcion: any | null;
  } | null>(null);
  const [editHoraInicio, setEditHoraInicio] = useState('');
  const [editHoraFin, setEditHoraFin] = useState('');
  const [isEditingException, setIsEditingException] = useState(false);

  useEffect(() => {
    if (showReasignar) {
      obtenerSucursalesConApertura().then(sucsConApertura => {
        const filtradas = sucsConApertura.filter(s => s.id !== sucursal.id);
        setOtrasSucursales(filtradas);
      }).catch(() => {
        setOtrasSucursales([]);
      });
      setSucursalDestino('');
    }
  }, [showReasignar]);

  function handleRecurrenciaChange(tipo: string) {
    setRecurrencia(tipo);
    if (tipo === 'semanal') {
      const fin = new Date(fechaInicio);
      fin.setDate(fin.getDate() + 6);
      setFechaFin(fin.toISOString().split('T')[0]);
    } else if (tipo === 'mensual') {
      const fin = new Date(fechaInicio);
      fin.setDate(fin.getDate() + 29);
      setFechaFin(fin.toISOString().split('T')[0]);
    } else if (tipo === 'anual') {
      const fin = new Date(fechaInicio);
      fin.setDate(fin.getDate() + 364);
      setFechaFin(fin.toISOString().split('T')[0]);
    } else {
      setFechaFin('');
    }
  }

  function calcularDias() {
    if (!recurrencia || !fechaInicio || !fechaFin) return null;
    const finicio = new Date(fechaInicio);
    const ffin = new Date(fechaFin);
    const diff = Math.round((ffin.getTime() - finicio.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : null;
  }

  const cargarCalendario = useCallback(async (anio: number, mes: number) => {
    setLoadingCalendario(true);
    try {
      const result = await obtenerCalendarioMensual(sucursal.id, anio, mes);
      setCalendario(result.dias ?? []);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setCalendario([]);
    } finally {
      setLoadingCalendario(false);
    }
  }, [sucursal.id]);

  useEffect(() => {
    if (activeTab === 'calendario') {
      cargarCalendario(mesActual.getFullYear(), mesActual.getMonth() + 1);
    }
  }, [activeTab, mesActual, cargarCalendario]);

  function mesAnterior() {
    setMesActual(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function mesSiguiente() {
    setMesActual(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  async function handleProgramar(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting('programar');
    const result = await programarApertura(
      sucursal.id,
      fechaInicio,
      horaInicio, horaFin,
      recurrencia || null,
      recurrencia ? fechaFin : null
    );
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowProgramar(false);
      setRecurrencia('');
      setFechaFin('');
      toast.success('Turno programado para ' + sucursal.nombre);
      router.refresh();
    }
  }

  async function handleToggle(aperturaId: string, activa: boolean) {
    setIsSubmitting(aperturaId);
    const result = await toggleApertura(aperturaId, activa);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(activa ? 'Turno activado' : 'Turno desactivado');
      router.refresh();
    }
  }

  async function handleEliminar(aperturaId: string) {
    if (!confirm('¿Eliminar esta programación de turno?')) return;
    setIsSubmitting(aperturaId);
    const result = await eliminarApertura(aperturaId);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Programación eliminada');
      router.refresh();
    }
  }

  function handleEditar(a: AperturaSimple) {
    setHoraInicio(a.hora_inicio.slice(0, 5));
    setHoraFin(a.hora_fin.slice(0, 5));
    setShowEditarProgramacion(a);
  }

  async function handleGuardarEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditarProgramacion) return;
    setIsSubmitting('editar-programacion');
    const result = await modificarApertura(showEditarProgramacion.id, {
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowEditarProgramacion(null);
      toast.success('Horario actualizado');
      router.refresh();
    }
  }

  async function handleCerrarTurno(turnoId: string) {
    if (!confirm('¿Cerrar este turno del mesero?')) return;
    setIsSubmitting(turnoId);
    const result = await cerrarTurno(turnoId);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Turno cerrado');
      router.refresh();
    }
  }

  async function handleReasignar() {
    if (!showReasignar || !sucursalDestino) return;
    setIsSubmitting('reasignar');
    const result = await reasignarTurno(showReasignar.turnoId, sucursalDestino);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowReasignar(null);
      setSucursalDestino('');
      toast.success('Mesero reasignado correctamente');
      router.refresh();
    }
  }

  function abrirEditarDia(dia: DiaCalendario) {
    if (!dia.apertura) return;
    setShowEditarDia({
      fecha: dia.fecha,
      apertura: dia.apertura,
      excepcion: dia.excepcion,
    });
    if (dia.excepcion) {
      setEditHoraInicio(dia.excepcion.hora_inicio.slice(0, 5));
      setEditHoraFin(dia.excepcion.hora_fin.slice(0, 5));
      setIsEditingException(true);
    } else {
      setEditHoraInicio(dia.apertura.hora_inicio.slice(0, 5));
      setEditHoraFin(dia.apertura.hora_fin.slice(0, 5));
      setIsEditingException(false);
    }
  }

  async function handleGuardarExcepcion() {
    if (!showEditarDia) return;
    if (editHoraInicio >= editHoraFin) {
      toast.error('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }
    setIsSubmitting('editar');
    const result = await crearExcepcion(
      showEditarDia.apertura.id,
      showEditarDia.fecha,
      editHoraInicio,
      editHoraFin
    );
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowEditarDia(null);
      toast.success('Horario actualizado para ' +
        new Date(showEditarDia.fecha + 'T00:00:00').toLocaleDateString('es-MX')
      );
      router.refresh();
      cargarCalendario(mesActual.getFullYear(), mesActual.getMonth() + 1);
    }
  }

  async function handleRestaurarExcepcion(excepcionId: string) {
    if (!confirm('¿Restaurar el horario original de este día?')) return;
    setIsSubmitting('restaurar');
    const result = await eliminarExcepcion(excepcionId);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowEditarDia(null);
      toast.success('Horario restaurado');
      router.refresh();
      cargarCalendario(mesActual.getFullYear(), mesActual.getMonth() + 1);
    }
  }

  const ahora = new Date();

  const aperturasFiltradas = useMemo(() => {
    if (!search.trim()) return aperturasIniciales;
    const q = search.toLowerCase();
    return aperturasIniciales.filter(a => {
      const fecha = new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-MX');
      return fecha.includes(q) || a.hora_inicio.includes(q) || a.hora_fin.includes(q) || (a.recurrencia?.includes(q));
    });
  }, [aperturasIniciales, search]);

  // Calendar grid helpers
  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mesesNombre = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Turnos</h1>
          <p className="text-sm text-muted mt-1 flex items-center gap-2">
            {sucursal.nombre}
            {aperturaHoyActiva && (
              <span className="inline-flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Aceptando turnos ahora
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowProgramar(true)}>
          <Plus className="w-4 h-4" />
          Programar Turno
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <p className="text-2xl font-bold text-text-primary">{aperturasIniciales.length}</p>
          <p className="text-xs text-muted mt-1">Programaciones</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <p className="text-2xl font-bold text-blue-500">{totalActivos}</p>
          <p className="text-xs text-muted mt-1">Empleados activos</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <p className="text-2xl font-bold text-amber-500">{totalActivas}</p>
          <p className="text-xs text-muted mt-1">Activas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-base rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('programaciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'programaciones'
            ? 'bg-card text-text-primary shadow-sm'
            : 'text-muted hover:text-text-primary'
          }`}
        >
          <Clock className="w-4 h-4" />
          Programaciones
        </button>
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'calendario'
            ? 'bg-card text-text-primary shadow-sm'
            : 'text-muted hover:text-text-primary'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendario
        </button>
      </div>

      {activeTab === 'programaciones' && (
        <>
          {/* Programaciones */}
          <div className="bg-card rounded-2xl border-2 border-border/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Programaciones de Turno
              </h2>
              <div className="relative max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-bg-base border border-border/60 rounded-lg pl-8 pr-2 py-1.5 text-xs text-body placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                />
              </div>
            </div>

            {aperturasFiltradas.length === 0 ? (
              <EmptyState
                icon={Clock}
                title={search ? 'Sin resultados' : 'Sin turnos programados'}
                description={search ? 'Intenta con otro término' : 'Programa un turno para que los meseros puedan registrar su entrada'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border/60">
                      <th className="pb-3 font-semibold">Fecha</th>
                      <th className="pb-3 font-semibold">Horario</th>
                      <th className="pb-3 font-semibold hidden sm:table-cell">Repite</th>
                      <th className="pb-3 font-semibold">Estado</th>
                      <th className="pb-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aperturasFiltradas.map(a => (
                      <tr key={a.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                        <td className="py-3 font-medium text-text-primary whitespace-nowrap">
                          {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </td>
                        <td className="py-3 text-text-primary whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-muted" />
                            {a.hora_inicio.slice(0, 5)} – {a.hora_fin.slice(0, 5)}
                          </span>
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          {a.recurrencia ? (
                            <Badge variant="info">
                              <Repeat className="w-3 h-3 inline mr-1" />
                              {a.recurrencia === 'semanal' ? 'Semanal' : a.recurrencia === 'mensual' ? 'Mensual' : 'Anual'}
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge variant={a.activa ? 'success' : 'danger'} className="whitespace-nowrap">
                            {a.activa ? 'Activa' : 'Desactivada'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditar(a)}
                              disabled={isSubmitting === a.id}
                              className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                              title="Editar horario"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggle(a.id, !a.activa)}
                              disabled={isSubmitting === a.id}
                              className="text-xs text-accent hover:text-accent-dark bg-accent/10 hover:bg-accent/20 px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {a.activa ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleEliminar(a.id)}
                              disabled={isSubmitting === a.id}
                              className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50/50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Meseros en turno */}
          <div className="bg-card rounded-2xl border-2 border-border/60 p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent" />
              Empleados en Turno
            </h2>

            {turnosActivos.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Sin empleados activos"
                description="No hay empleados registrados en turno actualmente"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border/60">
                      <th className="pb-3 font-semibold">Nombre</th>
                      <th className="pb-3 font-semibold">Desde</th>
                      <th className="pb-3 font-semibold">Duración</th>
                      <th className="pb-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosActivos.map(t => {
                      const inicio = new Date(t.inicio);
                      const duracion = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);
                      const horas = Math.floor(duracion / 60);
                      const mins = duracion % 60;

                      return (
                        <tr key={t.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                          <td className="py-3 font-medium text-text-primary">{t.usuario_nombre}</td>
                          <td className="py-3 text-text-primary whitespace-nowrap">
                            {inicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3">
                            <Badge variant={horas >= 8 ? 'warning' : 'info'}>
                              {horas > 0 ? `${horas}h ` : ''}{mins}min
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setShowReasignar({ turnoId: t.id });
                                  setSucursalDestino('');
                                }}
                                className="text-xs text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                              >
                                <ArrowRight className="w-3 h-3 inline mr-1" />
                                Reasignar
                              </button>
                              <button
                                onClick={() => handleCerrarTurno(t.id)}
                                disabled={isSubmitting === t.id}
                                className="text-xs text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                Cerrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'calendario' && (
        <div className="bg-card rounded-2xl border-2 border-border/60 p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              Calendario de Turnos
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500/30 inline-block" />
                <span className="text-muted">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500/30 inline-block" />
                <span className="text-muted">Modificado</span>
              </div>
            </div>
          </div>

          {/* Month navigator */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={mesAnterior}
              className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {mesesNombre[mes === 0 ? 11 : mes - 1]}
            </button>
            <h3 className="text-lg font-bold text-text-primary">
              {mesesNombre[mes]} {anio}
            </h3>
            <button
              onClick={mesSiguiente}
              className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark transition-colors"
            >
              {mesesNombre[mes === 11 ? 0 : mes + 1]}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingCalendario ? (
            <div className="text-center py-12 text-muted">Cargando...</div>
          ) : (
            <div>
              <div className="grid grid-cols-7 mb-2">
                {diasSemana.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: primerDiaSemana }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: diasEnMes }).map((_, i) => {
                  const dia = i + 1;
                  const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                  const info = calendario.find(c => c.fecha === fechaStr);

                  let bgClass = 'bg-bg-base/50';
                  let textClass = 'text-muted';
                  let clickable = false;

                  if (info?.excepcion) {
                    bgClass = 'bg-orange-500/20 border border-orange-500/40';
                    textClass = 'text-text-primary';
                    clickable = true;
                  } else if (info?.apertura) {
                    bgClass = 'bg-blue-500/15 border border-blue-500/30';
                    textClass = 'text-text-primary';
                    clickable = true;
                  }

                  const hoy = new Date();
                  const esHoy =
                    hoy.getFullYear() === anio &&
                    hoy.getMonth() === mes &&
                    hoy.getDate() === dia;

                  return (
                    <button
                      key={dia}
                      onClick={() => clickable && info && abrirEditarDia(info)}
                      disabled={!clickable}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${bgClass} ${textClass} ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                      } ${esHoy ? 'ring-2 ring-accent' : ''}`}
                    >
                      <span className="font-semibold">{dia}</span>
                      {info?.excepcion && (
                        <span className="text-[9px] leading-tight text-orange-500 mt-0.5">
                          {info.excepcion.hora_inicio.slice(0, 5)}
                        </span>
                      )}
                      {info?.apertura && !info?.excepcion && (
                        <span className="text-[9px] leading-tight text-blue-400 mt-0.5">
                          {info.apertura.hora_inicio.slice(0, 5)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {calendario.length > 0 && calendario.filter(c => c.apertura).length === 0 && (
            <p className="text-sm text-muted text-center py-6">
              No hay turnos programados para este mes
            </p>
          )}
        </div>
      )}

      {/* Modal: Programar turno */}
      {showProgramar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Programar Turno</h2>
                    <p className="text-sm text-muted">{sucursal.nombre}</p>
                  </div>
                </div>
                <button onClick={() => setShowProgramar(false)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleProgramar} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-muted mb-1">Tipo de turno</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '', label: 'Única', desc: 'Un solo día' },
                    { value: 'semanal', label: 'Semanal', desc: '7 días' },
                    { value: 'mensual', label: 'Mensual', desc: '30 días' },
                    { value: 'anual', label: 'Anual', desc: '365 días' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleRecurrenciaChange(opt.value)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left ${recurrencia === opt.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border-default text-text-primary hover:border-accent/50'
                      }`}
                    >
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="block text-xs text-muted mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-muted mb-1">
                  {recurrencia ? 'Fecha inicio' : 'Fecha'}
                </label>
                <input
                  type="date" value={fechaInicio} onChange={e => {
                    setFechaInicio(e.target.value);
                    if (recurrencia) handleRecurrenciaChange(recurrencia);
                  }}
                  className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                  required
                />
              </div>

              {recurrencia && (
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Fecha fin</label>
                  <input
                    type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    required
                  />
                </div>
              )}

              {recurrencia && (() => {
                const dias = calcularDias();
                if (!dias) return null;
                return (
                  <div className="bg-accent/10 rounded-xl p-3 text-sm text-accent font-medium text-center">
                    Turno de {dias} días — del{' '}
                    {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    {' '}al{' '}
                    {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Hora inicio</label>
                  <input
                    type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Hora fin</label>
                  <input
                    type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowProgramar(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" type="submit" loading={isSubmitting === 'programar'}>
                  Programar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar programación */}
      {showEditarProgramacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500/10 to-accent/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Editar Horario</h2>
                    <p className="text-sm text-muted">
                      {new Date(showEditarProgramacion.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowEditarProgramacion(null)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleGuardarEditar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Hora inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={e => setHoraInicio(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Hora fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={e => setHoraFin(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowEditarProgramacion(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" type="submit" loading={isSubmitting === 'editar-programacion'}>
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar día */}
      {showEditarDia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className={`px-6 pt-6 pb-5 ${showEditarDia.excepcion
              ? 'bg-gradient-to-r from-orange-500/10 to-amber-400/10'
              : 'bg-gradient-to-r from-blue-500/10 to-accent/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/15">
                    <CalendarDays className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Modificar Día</h2>
                    <p className="text-sm text-muted">
                      {showEditarDia.excepcion ? 'Horario modificado' : 'Horario normal'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowEditarDia(null)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-text-primary">
                {new Date(showEditarDia.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Hora inicio</label>
                  <input
                    type="time" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted mb-1">Hora fin</label>
                  <input
                    type="time" value={editHoraFin} onChange={e => setEditHoraFin(e.target.value)}
                    className="w-full bg-bg-base border border-border/60 rounded-xl px-3 py-2 text-sm text-body focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowEditarDia(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" loading={isSubmitting === 'editar'} onClick={handleGuardarExcepcion}>
                  Guardar
                </Button>
              </div>

              {showEditarDia.excepcion && (
                <div className="pt-2 border-t border-border/40">
                  <button
                    onClick={() => handleRestaurarExcepcion(showEditarDia.excepcion!.id)}
                    disabled={isSubmitting === 'restaurar'}
                    className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors disabled:opacity-50 py-2"
                  >
                    Restaurar horario original
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reasignar */}
      {showReasignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Reasignar Mesero</h2>
                    <p className="text-sm text-muted">El turno se cerrará y abrirá en la destino</p>
                  </div>
                </div>
                <button onClick={() => setShowReasignar(null)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-muted mb-1">Sucursal destino</label>
                <div className="space-y-2">
                  {otrasSucursales.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSucursalDestino(s.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${sucursalDestino === s.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border-default hover:border-accent/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-text-primary">{s.nombre}</p>
                      <p className="text-xs text-muted">{s.slug}</p>
                    </button>
                  ))}
                  {otrasSucursales.length === 0 && (
                    <p className="text-sm text-muted">No hay otras sucursales disponibles</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowReasignar(null)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
                  disabled={!sucursalDestino}
                  loading={isSubmitting === 'reasignar'}
                  onClick={handleReasignar}
                >
                  Reasignar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
