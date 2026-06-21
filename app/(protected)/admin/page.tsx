import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Users, ClipboardList, CookingPot, Wine, CreditCard } from 'lucide-react';

export default async function AdminPage() {
    const supabase = await createServerSupabaseClient();

    const { count: mesasActivas } = await supabase
        .from('mesas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'ocupada');

    const { count: ordenesPendientes } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['pendiente', 'en_preparacion']);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Panel de Administración</h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-card rounded-2xl border-2 border-border-default p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                            <Users className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">Mesas Ocupadas</span>
                    </div>
                    <p className="text-3xl font-bold text-text-primary">{mesasActivas ?? 0}</p>
                </div>

                <div className="bg-card rounded-2xl border-2 border-border-default p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-info" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">Órdenes Activas</span>
                    </div>
                    <p className="text-3xl font-bold text-text-primary">{ordenesPendientes ?? 0}</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl border-2 border-border-default p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Acceso Rápido</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Cocina', href: '/cocina', icon: CookingPot, color: 'text-yellow-400' },
                        { label: 'Barra', href: '/barra', icon: Wine, color: 'text-purple-400' },
                        { label: 'Caja', href: '/caja', icon: CreditCard, color: 'text-green-400' },
                        { label: 'Órdenes', href: '/mesero', icon: ClipboardList, color: 'text-blue-400' },
                    ].map(item => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 p-4 rounded-xl bg-bg-base hover:bg-bg-gradient transition-colors border-2 border-border"
                        >
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <span className="text-sm font-medium text-text-primary">{item.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}