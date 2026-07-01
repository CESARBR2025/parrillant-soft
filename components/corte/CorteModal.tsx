'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { generarCorte, obtenerCorte } from '@/app/actions/cortes';
import {
  Lock,
  CheckCircle2,
  Banknote,
  CreditCard,
  Smartphone,
  Percent,
  ShoppingCart,
  Clock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CalendarClock,
  Store,
  DollarSign,
  Receipt,
  ShieldCheck,
  Coins,
  ChevronRight,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import type { CorteCaja } from '@/types/database.types';

interface CortePeriodoData {
  inicio: string;
  saldo_inicial: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_descuentos: number;
  total_general: number;
  total_ordenes: number;
}

interface CorteModalProps {
  open: boolean;
  onClose: () => void;
  periodo: CortePeriodoData;
  horarioApertura: string | null;
  horarioCierre: string | null;
  onSuccess: (cortes: CorteCaja[], periodoActual: CortePeriodoData | null) => void;
}

export type { CortePeriodoData };

function localDateStr(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const steps = [
  { num: 1, label: 'Resumen', icon: Receipt },
  { num: 2, label: 'Dinero a dejar', icon: Coins },
  { num: 3, label: 'Confirmar', icon: ShieldCheck },
];

export function CorteModal({ open, onClose, periodo, horarioApertura, horarioCierre, onSuccess }: CorteModalProps) {
  const [step, setStep] = useState(1);
  const [dineroDejado, setDineroDejado] = useState('');
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setDineroDejado('');
      setError(null);
    }
  }, [open]);

  const totalAEntregar = periodo.saldo_inicial + periodo.total_efectivo - (parseFloat(dineroDejado) || 0);

  function handleNext() {
    setError(null);
    if (step === 2) {
      const valor = parseFloat(dineroDejado);
      if (isNaN(valor) || valor < 0) {
        setError('Ingresa un monto válido');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleGenerar() {
    const valor = parseFloat(dineroDejado);
    if (isNaN(valor) || valor < 0) {
      setError('Ingresa un monto válido para "Dinero dejado"');
      return;
    }

    setGenerando(true);
    setError(null);
    try {
      const fechaLocal = localDateStr();
      console.log('[CorteModal] llamando generarCorte');
      const result = await generarCorte(valor, fechaLocal);
      console.log('[CorteModal] generarCorte result:', result);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success('Corte generado exitosamente');

      console.log('[CorteModal] llamando obtenerCorte');
      const resumen = await obtenerCorte(fechaLocal);
      console.log('[CorteModal] obtenerCorte result:', resumen);
      onSuccess(resumen.cortes, resumen.periodoActual);
      onClose();
    } catch (e) {
      console.error('[CorteModal] Error al generar:', e);
      const msg = e instanceof Error ? e.message : 'Error al generar el corte';
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerando(false);
    }
  }

  function handleClose() {
    if (!generando) onClose();
  }

  if (!open) return null;

  const StepIcon = steps[step - 1].icon;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="bg-card rounded-3xl border border-border/40 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-accent via-accent/70 to-amber-400" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
            <StepIcon className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary">Generar corte</h2>
            <p className="text-xs text-muted mt-0.5">
              Paso {step} de 3 — {steps[step - 1].label}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-text-primary hover:bg-bg-base transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 pb-5">
          <div className="flex items-center">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0 ${
                        isActive
                          ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-110'
                          : isDone
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-bg-base text-muted border border-border/40'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:block transition-colors duration-300 ${
                        isActive ? 'text-text-primary' : isDone ? 'text-emerald-500' : 'text-muted'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 mx-3">
                      <div className="h-0.5 rounded-full bg-bg-base overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            isDone ? 'bg-emerald-500' : 'bg-bg-base'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="px-6 pb-6 max-h-[420px] overflow-y-auto scroll-smooth">
          {step === 1 && (
            <div className="space-y-4">
              {/* Schedule */}
              {(horarioApertura || horarioCierre) && (
                <div className="bg-gradient-to-r from-bg-base to-bg-base/50 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-muted border border-border/30">
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  Horario:{' '}
                  <strong className="text-text-primary font-semibold">
                    {horarioApertura?.slice(0, 5) ?? '—'}
                  </strong>
                  <ChevronRight className="w-3 h-3" />
                  <strong className="text-text-primary font-semibold">
                    {horarioCierre?.slice(0, 5) ?? '—'}
                  </strong>
                </div>
              )}

              {/* Period */}
              <div className="bg-gradient-to-r from-accent/8 to-accent/3 rounded-2xl px-4 py-3.5">
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <CalendarClock className="w-4 h-4 text-accent" />
                  <span>
                    Período:{' '}
                    <strong className="text-text-primary">{formatTime(periodo.inicio)}</strong>
                    {' → '}
                    <strong className="text-text-primary">ahora</strong>
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-bg-base overflow-hidden">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-accent to-amber-400" />
                  </div>
                </div>
              </div>

              {/* Payment cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Banknote}
                  label="Efectivo"
                  value={periodo.total_efectivo}
                  color="text-emerald-500"
                  bg="bg-emerald-500/10"
                />
                <StatCard
                  icon={CreditCard}
                  label="Tarjeta"
                  value={periodo.total_tarjeta}
                  color="text-blue-500"
                  bg="bg-blue-500/10"
                />
                <StatCard
                  icon={Smartphone}
                  label="Transferencia"
                  value={periodo.total_transferencia}
                  color="text-violet-500"
                  bg="bg-violet-500/10"
                />
                <StatCard
                  icon={Percent}
                  label="Descuentos"
                  value={periodo.total_descuentos}
                  color="text-danger"
                  bg="bg-danger/10"
                  negative
                />
              </div>

              {/* Orders count */}
              <div className="flex items-center justify-between bg-card rounded-2xl border border-border/40 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm text-muted">Órdenes cerradas</span>
                </div>
                <span className="text-xl font-bold text-text-primary">{periodo.total_ordenes}</span>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-accent/15 to-accent/5 rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">Total general</span>
                <span className="text-2xl font-bold text-accent">
                  ${periodo.total_general.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Saldo inicial + efectivo */}
              <div className="bg-card rounded-2xl border border-border/40 px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Saldo inicial</p>
                    <p className="text-lg font-bold text-text-primary truncate">
                      ${periodo.saldo_inicial.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted">Efectivo del período</p>
                  <p className="text-lg font-bold text-text-primary">
                    ${periodo.total_efectivo.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="bg-card rounded-2xl border-2 border-border/40 px-5 py-4 space-y-3">
                <label className="block text-sm font-semibold text-text-primary">
                  Dinero que dejas en caja
                </label>
                <p className="text-xs text-muted">
                  Este monto quedará disponible para el próximo turno
                </p>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dineroDejado}
                    onChange={(e) => { setDineroDejado(e.target.value); setError(null); }}
                    placeholder="0.00"
                    className="w-full rounded-2xl border-2 border-border-default/60 pl-10 pr-4 py-3.5 text-2xl font-bold text-text-primary text-center bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Total a entregar */}
              <div className="bg-gradient-to-br from-accent/20 via-accent/10 to-transparent rounded-2xl border border-accent/30 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">Total a entregar</p>
                </div>
                <p className="text-3xl font-bold text-accent">${totalAEntregar.toFixed(2)}</p>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted pt-2 border-t border-accent/20">
                  <span className="text-text-primary font-medium">${periodo.saldo_inicial.toFixed(2)}</span>
                  <span>+</span>
                  <span className="text-text-primary font-medium">${periodo.total_efectivo.toFixed(2)}</span>
                  <span>−</span>
                  <span className="text-amber-500 font-medium">${(parseFloat(dineroDejado) || 0).toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {/* Success header */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  Todo listo para generar el corte
                </p>
                <p className="text-xs text-muted mt-1">
                  Revisa que todos los datos sean correctos
                </p>
              </div>

              {/* Summary */}
              <div className="bg-card rounded-2xl border border-border/40 divide-y divide-border/30 overflow-hidden">
                <SummaryRow
                  icon={Receipt}
                  label="Total general"
                  value={`$${periodo.total_general.toFixed(2)}`}
                />
                <SummaryRow
                  icon={ShoppingCart}
                  label="Órdenes cerradas"
                  value={String(periodo.total_ordenes)}
                />
                <SummaryRow
                  icon={DollarSign}
                  label="Saldo inicial"
                  value={`$${periodo.saldo_inicial.toFixed(2)}`}
                />
                <SummaryRow
                  icon={Coins}
                  label="Dinero dejado"
                  value={`$${(parseFloat(dineroDejado) || 0).toFixed(2)}`}
                  highlight
                />
                <div className="px-4 py-3.5 flex items-center justify-between bg-accent/5">
                  <span className="text-sm font-bold text-text-primary">Total a entregar</span>
                  <span className="text-xl font-bold text-accent">${totalAEntregar.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-1">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={generando}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-muted hover:text-text-primary rounded-2xl hover:bg-bg-base transition-all disabled:opacity-50 active:scale-[0.97]"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-accent text-white rounded-2xl px-6 py-2.5 text-sm font-bold hover:bg-accent-dark transition-all shadow-lg shadow-accent/25 active:scale-[0.97]"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerar}
              disabled={generando}
              className="flex items-center gap-2.5 bg-gradient-to-r from-accent to-accent/90 text-white rounded-2xl px-6 py-2.5 text-sm font-bold hover:from-accent-dark hover:to-accent transition-all shadow-lg shadow-accent/30 disabled:opacity-50 disabled:shadow-none active:scale-[0.97]"
            >
              {generando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Generar corte
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  negative,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bg: string;
  negative?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/40 p-3.5 space-y-2 hover:shadow-md transition-shadow">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className={`text-lg font-bold ${negative ? 'text-danger' : 'text-text-primary'}`}>
          {negative ? '-' : ''}${value.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${highlight ? 'text-amber-500' : 'text-muted'}`} />
        <span className={`text-sm ${highlight ? 'font-semibold text-text-primary' : 'text-muted'}`}>
          {label}
        </span>
      </div>
      <span className={`text-sm font-bold ${highlight ? 'text-amber-500' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}
