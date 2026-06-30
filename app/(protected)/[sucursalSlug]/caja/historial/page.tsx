'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { useSucursal } from '@/components/providers/SucursalProvider'
import { Calendar, Search } from 'lucide-react'

interface OrdenCerrada {
  id: number
  total: number | null
  metodo_pago: string | null
  pagado_con: number | null
  created_at: string
  updated_at: string
  mesas: { numero: number; zona: string | null } | null
  perfiles: { nombre: string; apellido: string | null } | null
}

interface Totales {
  efectivo: number
  tarjeta: number
  transferencia: number
  granTotal: number
  count: number
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

export default function HistorialPage() {
  const supabase = createClientSupabaseClient()
  const sucursal = useSucursal()
  const [ordenes, setOrdenes] = useState<OrdenCerrada[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10)
  })
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d.toISOString().slice(0, 10)
  })
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todas')
  const [buscandoMesero, setBuscandoMesero] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!sucursal?.id) return
      setLoading(true)

      let query = supabase
        .from('ordenes')
        .select(
          `id, total, metodo_pago, pagado_con, created_at, updated_at, mesero_id,
        mesas (numero, zona),
        perfiles!ordenes_mesero_id_fkey (nombre, apellido)`,
        )
        .eq('sucursal_id', sucursal.id)
        .eq('estado', 'cerrado')
        .gte('updated_at', `${fechaInicio}T00:00:00`)
        .lte('updated_at', `${fechaFin}T23:59:59`)
        .order('updated_at', { ascending: false })

      if (filtroMetodo !== 'todas') {
        query = query.eq('metodo_pago', filtroMetodo)
      }

      if (buscandoMesero.trim()) {
        query = query.ilike(
          'perfiles.nombre',
          `%${buscandoMesero.trim()}%`,
        )
      }

      const { data } = await query
      if (!cancelled) {
        setOrdenes((data ?? []) as unknown as OrdenCerrada[])
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [supabase, fechaInicio, fechaFin, filtroMetodo, buscandoMesero])

  const totales = ordenes.reduce<Totales>(
    (acc, o) => {
      const t = Number(o.total ?? 0)
      acc.granTotal += t
      acc.count++
      if (o.metodo_pago === 'efectivo') acc.efectivo += t
      else if (o.metodo_pago === 'tarjeta') acc.tarjeta += t
      else if (o.metodo_pago === 'transferencia') acc.transferencia += t
      return acc
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0, granTotal: 0, count: 0 },
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Historial de Ventas</h1>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border-2 border-border/60 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-muted font-medium block mb-1">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-bg-base border border-border/60 rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-medium block mb-1">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-bg-base border border-border/60 rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-medium block mb-1">
              Método de pago
            </label>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="w-full bg-bg-base border border-border/60 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option value="todas">Todas</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted font-medium block mb-1">
              Mesero
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={buscandoMesero}
                onChange={(e) => setBuscandoMesero(e.target.value)}
                placeholder="Buscar mesero..."
                className="w-full bg-bg-base border border-border/60 rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border-2 border-border/60 p-4 text-center">
          <p className="text-xs font-bold text-text-primary">Efectivo</p>
          <p className="text-lg font-bold text-success">
            ${totales.efectivo.toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border-2 border-border/60 p-4 text-center">
          <p className="text-xs font-bold text-text-primary">Tarjeta</p>
          <p className="text-lg font-bold text-info">
            ${totales.tarjeta.toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border-2 border-border/60 p-4 text-center">
          <p className="text-xs font-bold text-text-primary">Transferencia</p>
          <p className="text-lg font-bold text-text-accent">
            ${totales.transferencia.toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-accent/30 p-4 text-center">
          <p className="text-xs font-bold text-text-primary">Total</p>
          <p className="text-lg font-bold text-accent">
            ${totales.granTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ordenes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-sm">No hay órdenes cerradas en este periodo</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border-2 border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-bg-base/50">
                  <th className="text-left px-4 py-3 text-text-primary font-bold">
                    Mesa
                  </th>
                  <th className="text-left px-4 py-3 text-text-primary font-bold">
                    Mesero
                  </th>
                  <th className="text-left px-4 py-3 text-text-primary font-bold">
                    Método
                  </th>
                  <th className="text-right px-4 py-3 text-text-primary font-bold">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 text-text-primary font-bold">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {ordenes.map((orden) => (
                  <tr
                    key={orden.id}
                    className="hover:bg-bg-base/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-text-primary font-medium">
                      Mesa {orden.mesas?.numero}
                      {orden.mesas?.zona && (
                        <span className="text-muted ml-1">
                          {orden.mesas.zona}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {orden.perfiles?.nombre}{' '}
                      {orden.perfiles?.apellido ?? ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-bg-base px-2 py-1 rounded-full text-muted">
                        {METODO_LABEL[orden.metodo_pago ?? ''] ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-text-primary font-semibold">
                      ${Number(orden.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-xs">
                      {new Date(orden.updated_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
