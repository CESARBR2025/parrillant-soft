'use client'

interface ChangeCalculatorProps {
  total: number
  recibido: number
}

export function ChangeCalculator({ total, recibido }: ChangeCalculatorProps) {
  if (recibido <= 0 || recibido < total) return null

  const cambio = recibido - total

  return (
    <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-green-400 font-medium">Cambio</span>
        <span className="text-2xl font-bold text-green-400">
          ${cambio.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
