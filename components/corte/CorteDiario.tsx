'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generarCorte, obtenerCorte } from '@/app/actions/cortes';
import { ResumenCard } from './ResumenCard';
import { OrdenesTable } from './OrdenesTable';
import { ExportButton } from './ExportButton';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';
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
  initialCorte: CorteCaja | null;
  initialEnVivo: {
    total_efectivo: number;
    total_tarjeta: number;
    total_transferencia: number;
    total_descuentos: number;
    total_general: number;
    total_ordenes: number;
    ordenes: OrdenRow[];
  } | null;
  yaGenerado: boolean;
  puedeGenerar: boolean;
}

export function CorteDiario({ initialCorte, initialEnVivo, yaGenerado, puedeGenerar }: CorteDiarioProps) {
  const [corte, setCorte] = useState<CorteCaja | null>(initialCorte);
  const [enVivo, setEnVivo] = useState(initialEnVivo);
  const [generado, setGenerado] = useState(yaGenerado);
  const [generando, setGenerando] = useState(false);

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleGenerar = useCallback(async () => {
    setGenerando(true);
    try {
      const result = await generarCorte();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Corte generado exitosamente');

      const resumen = await obtenerCorte();
      if (resumen.corte) {
        setCorte(resumen.corte);
        setGenerado(true);
        setEnVivo(null);
      }
    } catch {
      toast.error('Error al generar el corte');
    } finally {
      setGenerando(false);
    }
  }, []);

  if (generado && corte) {
    const detalle = corte.detalle as { ordenes: OrdenRow[] } | null;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Corte de Caja</h1>
            <p className="text-sm text-muted mt-1 capitalize">{fechaHoy}</p>
          </div>
          <ExportButton />
        </div>

        <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">Corte generado</p>
            <p className="text-sm text-muted">
              {new Date(corte.created_at).toLocaleString('es-MX', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        <ResumenCard
          efectivo={corte.total_efectivo}
          tarjeta={corte.total_tarjeta}
          transferencia={corte.total_transferencia}
          descuentos={corte.total_descuentos}
          totalGeneral={corte.total_general}
          totalOrdenes={corte.total_ordenes}
        />

        {detalle?.ordenes && detalle.ordenes.length > 0 && (
          <OrdenesTable ordenes={detalle.ordenes} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Corte de Caja</h1>
          <p className="text-sm text-muted mt-1 capitalize">{fechaHoy}</p>
        </div>

        <div className="flex gap-2">
          <ExportButton label="Exportar Vista Previa" />
        </div>
      </div>

      {enVivo && enVivo.total_ordenes > 0 ? (
        <>
          <ResumenCard
            efectivo={enVivo.total_efectivo}
            tarjeta={enVivo.total_tarjeta}
            transferencia={enVivo.total_transferencia}
            descuentos={enVivo.total_descuentos}
            totalGeneral={enVivo.total_general}
            totalOrdenes={enVivo.total_ordenes}
          />

          <div className="bg-amber-900/20 border border-amber-800/30 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary mb-1">
                Corte del día no generado aún
              </p>
              <p className="text-sm text-muted mb-4">
                Revisa las órdenes del día antes de generar el corte. Una vez generado,
                quedará congelado y disponible para exportar.
              </p>
              <div className="flex gap-3">
                {puedeGenerar && (
                  <button
                    onClick={handleGenerar}
                    disabled={generando}
                    className="flex items-center gap-2 bg-accent text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-accent-dark transition-all disabled:opacity-50 shadow-accent"
                  >
                    {generando ? (
                      <>Generando...</>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Generar Corte
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <OrdenesTable ordenes={enVivo.ordenes} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldCheck className="w-16 h-16 text-muted mb-4" />
          <p className="text-lg text-muted">No hay órdenes cerradas hoy</p>
          <p className="text-sm text-muted mt-1">
            Las órdenes se mostrarán aquí una vez que se hayan cobrado
          </p>
        </div>
      )}
    </div>
  );
}
