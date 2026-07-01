'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { registrarSaldoInicialCaja } from '@/app/actions/turnos';
import { obtenerSaldoInicialSugerido } from '@/app/actions/cortes';

interface SaldoInicialModalProps {
  turnoId: string;
  onConfirm: () => void;
}

export function SaldoInicialModal({ turnoId, onConfirm }: SaldoInicialModalProps) {
  const [monto, setMonto] = useState('');
  const [sugerido, setSugerido] = useState<number | null>(null);
  const [cargandoSugerido, setCargandoSugerido] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerSaldoInicialSugerido().then((res) => {
      if (res.monto > 0) {
        setSugerido(res.monto);
        setMonto(String(res.monto));
      }
    }).finally(() => setCargandoSugerido(false));
  }, []);

  async function handleConfirm() {
    const valor = parseFloat(monto);
    if (isNaN(valor) || valor < 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setEnviando(true);
    setError(null);

    const result = await registrarSaldoInicialCaja(turnoId, valor);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setEnviando(false);
      return;
    }

    toast.success('Saldo inicial registrado');
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-bg-card rounded-2xl border-2 border-border-default shadow-card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-accent to-amber-400" />
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Saldo inicial de caja
            </h2>
            <p className="text-sm text-muted">
              Ingresa el monto en efectivo que hay actualmente en la caja
            </p>
          </div>

          {cargandoSugerido ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : sugerido !== null ? (
            <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-3 mb-4 text-sm text-muted">
              Se ha sugerido <strong className="text-text-primary">${sugerido.toFixed(2)}</strong> del corte anterior
            </div>
          ) : null}

          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className="w-full rounded-xl border-2 border-border-default/60 pl-10 pr-4 py-4 text-2xl font-bold text-text-primary text-center bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              autoFocus
              disabled={enviando}
            />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={enviando || monto === ''}
            className="w-full bg-accent text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-accent-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-accent"
          >
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            {enviando ? 'Guardando...' : 'Confirmar saldo inicial'}
          </button>
        </div>
      </div>
    </div>
  );
}
