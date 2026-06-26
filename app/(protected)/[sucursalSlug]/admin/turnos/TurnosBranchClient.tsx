'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, X, Clock, UserCheck, ArrowRight, Trash2,
  CalendarDays, Repeat, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  programarApertura, toggleApertura, eliminarApertura,
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
}: {
  aperturas: AperturaSimple[];
  turnosActivos: TurnoSimple[];
  sucursal: SucursalSimple;
  todasSucursales: SucursalSimple[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('programaciones');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Create modal
  const [showProgramar, setShowProgramar] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');
  const [horaInicio, setHoraInicio] = useState('14:00');
  const [horaFin, setHoraFin] = useState('22:00');
  const [recurrencia, setRecurrencia] = useState<string>(''); // '' | 'semanal' | 'mensual' | 'anual'

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
        console.log('[reasignar] sucursales con apertura:', sucsConApertura);
        const filtradas = sucsConApertura.filter(s => s.id !== sucursal.id);
        console.log('[reasignar] filtradas (sin actual):', filtradas.map(s => s.nombre));
        setOtrasSucursales(filtradas);
      }).catch(err => {
        console.error('[reasignar] error:', err);
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
  const aperturaHoyActiva = aperturasIniciales.some(
    a => a.activa && a.fecha === ahora.toISOString().split('T')[0] &&
      a.hora_inicio <= ahora.toTimeString().slice(0, 5) &&
      a.hora_fin >= ahora.toTimeString().slice(0, 5)
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Turnos</h1>
          <p className="text-sm text-muted mt-1">
            {sucursal.nombre}
            {aperturaHoyActiva && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Aceptando turnos ahora
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowProgramar(true)} variant="primary">
          <Plus className="w-4 h-4" />
          Programar Turno
        </Button>
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
          <div className="bg-card rounded-2xl border-2 border-border-default p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Programaciones de Turno
            </h2>

            {aperturasIniciales.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Sin turnos programados"
                description="Programa un turno para que los meseros puedan registrar su entrada"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border/60">
                      <th className="pb-3 font-semibold">Fecha</th>
                      <th className="pb-3 font-semibold">Inicio</th>
                      <th className="pb-3 font-semibold">Fin</th>
                      <th className="pb-3 font-semibold">Repite</th>
                      <th className="pb-3 font-semibold">Estado</th>
                      <th className="pb-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aperturasIniciales.map(a => (
                      <tr key={a.id} className="border-b border-border/40 hover:bg-bg-base/50 transition-colors">
                        <td className="py-3 font-medium text-text-primary">
                          {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </td>
                        <td className="py-3 text-text-primary">{a.hora_inicio.slice(0, 5)}</td>
                        <td className="py-3 text-text-primary">{a.hora_fin.slice(0, 5)}</td>
                        <td className="py-3">
                          {a.recurrencia ? (
                            <Badge variant="info">
                              <Repeat className="w-3 h-3 inline mr-1" />
                              {a.recurrencia === 'semanal' ? 'Semanal' : a.recurrencia === 'mensual' ? 'Mensual' : 'Anual'}
                              {a.recurrencia_fin && ` hasta ${new Date(a.recurrencia_fin + 'T00:00:00').toLocaleDateString('es-MX')}`}
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge variant={a.activa ? 'success' : 'danger'}>
                            {a.activa ? 'Activa' : 'Desactivada'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggle(a.id, !a.activa)}
                              disabled={isSubmitting === a.id}
                              className="text-xs text-accent hover:text-accent-dark bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {a.activa ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleEliminar(a.id)}
                              disabled={isSubmitting === a.id}
                              className="text-xs text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
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
          <div className="bg-card rounded-2xl border-2 border-border-default p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent" />
              Meseros en Turno
            </h2>

            {turnosActivos.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Sin meseros activos"
                description="No hay meseros registrados en turno actualmente"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border/60">
                      <th className="pb-3 font-semibold">Mesero</th>
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
                          <td className="py-3 text-text-primary">
                            {inicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3">
                            <Badge variant="info">
                              {horas > 0 ? `${horas}h ` : ''}{mins}min
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setShowReasignar({ turnoId: t.id });
                                  setSucursalDestino('');
                                }}
                                className="text-xs text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                <ArrowRight className="w-3 h-3 inline mr-1" />
                                Reasignar
                              </button>
                              <button
                                onClick={() => handleCerrarTurno(t.id)}
                                disabled={isSubmitting === t.id}
                                className="text-xs text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                Cerrar turno
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
        <div className="bg-card rounded-2xl border-2 border-border-default p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              Calendario de Turnos
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500/30 inline-block" />
                <span className="text-muted">Normal</span>
              </div>
              <div className="flex items-center gap-1">
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
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {diasSemana.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: primerDiaSemana }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
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
                <h2 className="text-lg font-bold text-text-primary">Programar Turno</h2>
                <button onClick={() => setShowProgramar(false)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted mt-1">{sucursal.nombre}</p>
            </div>
            <form onSubmit={handleProgramar} className="p-6 space-y-4">
              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Tipo de turno</label>
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

              {/* Fecha inicio */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">
                  {recurrencia ? 'Fecha inicio' : 'Fecha'}
                </label>
                <input
                  type="date" value={fechaInicio} onChange={e => {
                    setFechaInicio(e.target.value);
                    if (recurrencia) handleRecurrenciaChange(recurrencia);
                  }}
                  className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                  required
                />
              </div>

              {recurrencia && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Fecha fin</label>
                  <input
                    type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
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
                  <label className="block text-sm font-medium text-text-secondary">Hora inicio</label>
                  <input
                    type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Hora fin</label>
                  <input
                    type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProgramar(false)}
                  className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting === 'programar'}
                  className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting === 'programar' ? '...' : 'Programar'}
                </button>
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
                <h2 className="text-lg font-bold text-text-primary">Modificar Día</h2>
                <button onClick={() => setShowEditarDia(null)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted mt-1">
                {new Date(showEditarDia.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Hora inicio</label>
                  <input
                    type="time" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Hora fin</label>
                  <input
                    type="time" value={editHoraFin} onChange={e => setEditHoraFin(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditarDia(null)}
                  className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarExcepcion}
                  disabled={isSubmitting === 'editar'}
                  className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting === 'editar' ? '...' : 'Guardar'}
                </button>
              </div>

              {showEditarDia.excepcion && (
                <div className="pt-2 border-t border-border-default/60">
                  <button
                    onClick={() => handleRestaurarExcepcion(showEditarDia.excepcion!.id)}
                    disabled={isSubmitting === 'restaurar'}
                    className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors disabled:opacity-50"
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
                <h2 className="text-lg font-bold text-text-primary">Reasignar Mesero</h2>
                <button onClick={() => setShowReasignar(null)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted mt-1">
                El turno se cerrará en esta sucursal y se abrirá uno nuevo en la destino
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Sucursal destino</label>
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
                <button onClick={() => setShowReasignar(null)}
                  className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                >
                  Cancelar
                </button>
                <button onClick={handleReasignar} disabled={!sucursalDestino || isSubmitting === 'reasignar'}
                  className="flex-1 bg-amber-500 text-white hover:bg-amber-600 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting === 'reasignar' ? '...' : 'Reasignar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}