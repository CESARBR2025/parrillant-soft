'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { obtenerCorte } from '@/app/actions/cortes';
import { CorteModal } from './CorteModal';
import { ResumenCard } from './ResumenCard';
import { OrdenesTable } from './OrdenesTable';
import { ExportButton } from './ExportButton';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import type { CorteCaja } from '@/types/database.types';

interface OrdenRow {
  id: number;
  mesa: number;
  zona: string | null;
  mesero: string;
  total: number;
  metodo_pago: string;
  descuento: number;
  items: number;
  cerrado_a_las: string;
}

interface CorteDiarioProps {
  cortes: CorteCaja[];
  periodoActual: {
    inicio: string;
    saldo_inicial: number;
    total_efectivo: number;
    total_tarjeta: number;
    total_transferencia: number;
    total_descuentos: number;
    total_general: number;
    total_ordenes: number;
    ordenes: OrdenRow[];
  } | null;
  puedeGenerar: boolean;
  aperturaHoy?: string | null;
  cierreHoy?: string | null;
}

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

function formatTimeRange(desde: string, hasta?: string) {
  const d = formatTime(desde);
  const h = hasta ? formatTime(hasta) : 'ahora';
  return `${d} → ${h}`;
}

export function CorteDiario({
  cortes: initialCortes,
  periodoActual: initialPeriodo,
  puedeGenerar,
  aperturaHoy: initialAperturaHoy,
  cierreHoy: initialCierreHoy,
}: CorteDiarioProps) {
  const [cortesList, setCortesList] = useState<CorteCaja[]>(initialCortes);
  const [currentPeriod, setCurrentPeriod] = useState(initialPeriodo);
  const [aperturaHoy, setAperturaHoy] = useState(initialAperturaHoy ?? null);
  const [cierreHoy, setCierreHoy] = useState(initialCierreHoy ?? null);
  const [showCorteModal, setShowCorteModal] = useState(false);

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isPastClosingTime = useMemo(() => {
    if (!cierreHoy) return false;
    const ahora = new Date();
    const [h, m] = cierreHoy.split(':').map(Number);
    const cierre = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), h, m);
    return ahora > cierre;
  }, [cierreHoy]);

  const labelCorte = isPastClosingTime ? 'Generar corte del día' : 'Generar corte parcial';

  // Re-fetch with local date on mount (fixes server/client date mismatch)
  useEffect(() => {
    const fechaLocal = localDateStr();
    obtenerCorte(fechaLocal).then((res) => {
      setCortesList(res.cortes);
      setCurrentPeriod(res.periodoActual);
      if (res.aperturaHoy) setAperturaHoy(res.aperturaHoy);
      if (res.cierreHoy) setCierreHoy(res.cierreHoy);
    });
  }, []);

  const handleSuccess = (cortes: CorteCaja[], periodoActual: any) => {
    setCortesList(cortes);
    setCurrentPeriod(periodoActual);
  };

  const tienePeriodoActivo = currentPeriod && currentPeriod.total_ordenes > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cortes de Caja</h1>
          <p className="text-sm text-muted mt-1 capitalize">{fechaHoy}</p>
        </div>
        <ExportButton />
      </div>

      {/* List of completed cortes */}
      {cortesList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <History className="w-4 h-4" />
            <span className="font-semibold text-text-primary">
              Cortes generados hoy ({cortesList.length})
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cortesList.map((c, i) => (
              <div
                key={c.id}
                className="bg-card rounded-xl border border-border/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    Corte #{cortesList.length - i}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs text-muted">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimeRange(c.periodo_inicio, c.periodo_fin)}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Efectivo</span>
                  <span className="font-semibold text-text-primary">
                    ${c.total_efectivo.toFixed(2)}
                  </span>
                </div>
                {c.dinero_dejado !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Dejó en caja</span>
                    <span className="font-semibold text-amber-500">
                      ${c.dinero_dejado.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current period - has orders */}
      {tienePeriodoActivo && currentPeriod ? (
        <>
          {/* Period info bar */}
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-text-primary">Período actual: </span>
              <span className="text-muted">
                {formatTimeRange(currentPeriod.inicio)}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted">
                <span className="font-semibold text-text-primary">Saldo inicial: </span>
                <span className="text-accent font-bold">
                  ${currentPeriod.saldo_inicial.toFixed(2)}
                </span>
              </span>
              {puedeGenerar && (
                <button
                  onClick={() => setShowCorteModal(true)}
                  className="flex items-center gap-2 bg-accent text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-accent-dark transition-all shadow-accent shrink-0"
                >
                  <Lock className="w-4 h-4" />
                  {labelCorte}
                </button>
              )}
            </div>
          </div>

          <ResumenCard
            efectivo={currentPeriod.total_efectivo}
            tarjeta={currentPeriod.total_tarjeta}
            transferencia={currentPeriod.total_transferencia}
            descuentos={currentPeriod.total_descuentos}
            totalGeneral={currentPeriod.total_general}
            totalOrdenes={currentPeriod.total_ordenes}
          />

          <OrdenesTable ordenes={currentPeriod.ordenes} />
        </>
      ) : cortesList.length > 0 && currentPeriod && currentPeriod.total_ordenes === 0 ? (
        /* Current period has no orders, but cortes exist */
        <div className="bg-card border border-border/60 rounded-2xl p-5 flex items-center gap-4">
          <Clock className="w-5 h-5 text-muted shrink-0" />
          <p className="text-sm text-muted">
            Período actual desde <strong className="text-text-primary">{formatTime(currentPeriod.inicio)}</strong> — Sin órdenes cerradas aún
          </p>
        </div>
      ) : (
        /* No cortes and no orders */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldCheck className="w-16 h-16 text-muted mb-4" />
          <p className="text-lg text-muted">No hay órdenes cerradas hoy</p>
          <p className="text-sm text-muted mt-1">
            Las órdenes se mostrarán aquí una vez que se hayan cobrado
          </p>
        </div>
      )}

      {currentPeriod && (
        <CorteModal
          open={showCorteModal}
          onClose={() => setShowCorteModal(false)}
          periodo={currentPeriod}
          horarioApertura={aperturaHoy}
          horarioCierre={cierreHoy}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
