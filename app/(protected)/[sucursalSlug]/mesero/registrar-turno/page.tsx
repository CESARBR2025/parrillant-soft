'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, CheckCircle2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { registrarTurno } from '@/app/actions/turnos';

export default function RegistrarTurnoPage() {
  const router = useRouter();
  const params = useParams();
  const sucursalSlug = params.sucursalSlug as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegistrar() {
    setIsSubmitting(true);
    setError(null);
    const result = await registrarTurno(undefined, sucursalSlug);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      router.push(`/${sucursalSlug}/mesero/mapa`);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent-light via-bg-app to-bg-app">
      <div className="w-full max-w-sm">
        <div className="bg-bg-card rounded-2xl border-2 border-border-default p-8 shadow-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Registrar Turno
          </h2>
          <p className="text-sm text-muted mb-6">
            No tienes un turno activo en esta sucursal. Regístralo para comenzar a trabajar.
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/`)}
              className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <button
              onClick={handleRegistrar}
              disabled={isSubmitting}
              className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isSubmitting ? 'Registrando...' : 'Registrar turno'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
