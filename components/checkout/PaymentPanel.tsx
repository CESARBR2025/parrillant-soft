'use client'

import { useState } from 'react'
import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import { ChangeCalculator } from './ChangeCalculator'

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia'

interface PaymentPanelProps {
  total: number
  onPay: (method: PaymentMethod, recibido: number) => Promise<void>
  loading: boolean
}

const METHODS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: Smartphone },
]

export function PaymentPanel({ total, onPay, loading }: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [recibido, setRecibido] = useState('')

  const montoRecibido = parseFloat(recibido) || 0
  const puedePagar =
    (method === 'efectivo' && montoRecibido >= total) ||
    (method !== 'efectivo' && total > 0)

  return (
    <div className="bg-card rounded-2xl border-2 border-border/60 overflow-hidden">
      {/* Total display */}
      <div className="bg-accent/10 px-6 py-5 border-b border-border/60">
        <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Total a cobrar</p>
        <p className="text-4xl font-black text-text-primary">${total.toFixed(2)}</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Payment method */}
        <div className="space-y-3">
          <label className="text-xs text-muted uppercase tracking-wider font-semibold">Método de pago</label>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMethod(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                  method === key
                    ? 'bg-accent text-white shadow-accent'
                    : 'bg-bg-base text-muted border border-border/60 hover:text-body hover:border-border'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash input */}
        {method === 'efectivo' && (
          <div className="space-y-3">
            <label className="text-xs text-muted uppercase tracking-wider font-semibold">
              Monto recibido
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted font-bold">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={recibido}
                onChange={(e) => setRecibido(e.target.value)}
                placeholder="0.00"
                className="w-full bg-bg-base border border-border/60 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <ChangeCalculator total={total} recibido={montoRecibido} />
          </div>
        )}

        {method !== 'efectivo' && (
          <p className="text-xs text-muted text-center py-2">
            Confirma el cobro de{' '}
            <span className="text-text-primary font-semibold">${total.toFixed(2)}</span>{' '}
            con {METHODS.find((m) => m.key === method)?.label}
          </p>
        )}

        {/* Pay button */}
        <button
          onClick={() => onPay(method, montoRecibido)}
          disabled={!puedePagar || loading}
          className="w-full bg-accent text-white font-bold text-lg py-4 rounded-xl hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-accent"
        >
          {loading
            ? 'Procesando...'
            : `Cobrar $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
