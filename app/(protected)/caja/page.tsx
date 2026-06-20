'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Clock } from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Orden = Database['public']['Tables']['ordenes']['Row'] & {
  mesas: { numero: number; zona: string | null } | null
  detalles_orden: {
    cantidad: number
    precio_unitario: number
    listo: boolean
    productos_menu: { nombre: string } | null
  }[]
}

export default function CajaPage() {
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [resumen, setResumen] = useState({ totalVentas: 0, ordenesCerradas: 0 })
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false

    async function load() {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const [ordenesRes, cerradasRes] = await Promise.all([
        supabase
          .from('ordenes')
          .select(
            `id, estado, total, created_at, mesa_id, mesero_id, notas, metodo_pago, pagado_con, cerrado_por_id, updated_at,
          mesas (numero, zona),
          detalles_orden (cantidad, precio_unitario, listo, productos_menu (nombre))`,
          )
          .in('estado', ['entregado'])
          .order('created_at', { ascending: true }),
        supabase
          .from('ordenes')
          .select('total', { count: 'exact' })
          .eq('estado', 'cerrado')
          .gte('updated_at', hoy.toISOString()),
      ])

      if (cancelled) return

      if (ordenesRes.data) {
        setOrdenes(ordenesRes.data as unknown as Orden[])
      }
      if (cerradasRes.data) {
        setResumen({
          totalVentas:
            cerradasRes.data.reduce((acc, o) => acc + Number(o.total ?? 0), 0),
          ordenesCerradas: cerradasRes.count ?? 0,
        })
      }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('caja-ordenes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes' },
        () => load(),
      )
      .subscribe()

    const timer = setInterval(() => setNow(Date.now()), 30_000)

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [supabase])

  const tiempoEspera = (createdAt: string) => {
    const diff = now - new Date(createdAt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '< 1 min'
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Caja</h1>
        </div>

        {/* Day summary */}
        <div className="flex gap-3">
          <div className="bg-card border border-border/60 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <p className="text-xs font-bold text-text-primary">Ventas hoy</p>
            <p className="text-lg font-bold text-accent">
              ${resumen.totalVentas.toFixed(2)}
            </p>
          </div>
          <div className="bg-card border border-border/60 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <p className="text-xs font-bold text-text-primary">Cerradas</p>
            <p className="text-lg font-bold text-text-primary">
              {resumen.ordenesCerradas}
            </p>
          </div>
        </div>
      </div>

      {/* Orders grid */}
      {ordenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="w-12 h-12 text-muted mb-4" />
          <p className="text-muted text-sm">
            No hay órdenes pendientes de cobro
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordenes.map((orden) => {
            const total =
              orden.detalles_orden?.reduce(
                (acc, d) => acc + d.cantidad * Number(d.precio_unitario),
                0,
              ) ?? 0

            return (
              <button
                key={orden.id}
                onClick={() =>
                  router.push(`/caja/ordenes/${orden.id}/cobrar`)
                }
                className="bg-card rounded-2xl border border-border/60 p-5 text-left hover:border-accent/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-lg font-bold text-text-primary">
                      Mesa {orden.mesas?.numero}
                    </span>
                    {orden.mesas?.zona && (
                      <span className="text-xs text-muted ml-2">
                        {orden.mesas.zona}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="w-3 h-3" />
                    {tiempoEspera(orden.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">
                      {orden.detalles_orden?.length ?? 0} ítems
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-accent">
                      ${total.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted group-hover:text-accent transition-colors">
                      Cobrar →
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}