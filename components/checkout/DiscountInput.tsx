'use client'

import { useState, useCallback } from 'react'

interface DiscountInputProps {
  subtotal: number
  onChange: (discount: number) => void
}

type DiscountType = 'percentage' | 'fixed'

export function DiscountInput({ subtotal, onChange }: DiscountInputProps) {
  const [type, setType] = useState<DiscountType>('percentage')
  const [value, setValue] = useState('')

  const handleValueChange = useCallback(
    (raw: string) => {
      setValue(raw)
      const num = parseFloat(raw) || 0
      if (type === 'percentage') {
        const maxPct = Math.min(num, 100)
        onChange((subtotal * maxPct) / 100)
      } else {
        onChange(Math.min(num, subtotal))
      }
    },
    [type, subtotal, onChange],
  )

  const handleTypeChange = useCallback(
    (newType: DiscountType) => {
      setType(newType)
      setValue('')
      onChange(0)
    },
    [onChange],
  )

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted font-medium">Descuento</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleTypeChange('percentage')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            type === 'percentage'
              ? 'bg-accent text-white'
              : 'bg-card text-muted border border-border/60 hover:text-body'
          }`}
        >
          %
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('fixed')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            type === 'fixed'
              ? 'bg-accent text-white'
              : 'bg-card text-muted border border-border/60 hover:text-body'
          }`}
        >
          $
        </button>
        <div className="relative flex-1">
          {type === 'fixed' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              $
            </span>
          )}
          <input
            type="number"
            min="0"
            max={type === 'percentage' ? 100 : subtotal}
            step="any"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={type === 'percentage' ? '0%' : '$0'}
            className="w-full bg-bg-base border border-border/60 rounded-lg px-3 py-1.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />
          {type === 'percentage' && value && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              %
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
