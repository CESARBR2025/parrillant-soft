'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, LogIn, Loader2, AlertCircle, Store, Clock, CheckCircle2 } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import type { Rol, KnownRol, Sucursal } from '@/types/roles';
import { RUTA_INICIO_POR_ROL } from '@/types/roles';
import { registrarTurno, obtenerTurnoActivo } from '@/app/actions/turnos';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClientSupabaseClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [userRol, setUserRol] = useState<Rol | null>(null);
    const [step, setStep] = useState<'login' | 'sucursal'>('login');
    const [registrandoTurno, setRegistrandoTurno] = useState<string | null>(null);
    const [confirmarSucursal, setConfirmarSucursal] = useState<Sucursal | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !data.user) {
            setError('Credenciales incorrectas. Verifica tu email y contraseña.');
            setLoading(false);
            return;
        }

        const { data: perfilRaw } = await supabase
            .from('perfiles')
            .select('rol, activo')
            .eq('id', data.user.id)
            .single();
        const perfil = perfilRaw as { rol: string; activo: boolean } | null;
        console.log(perfil)

        if (!perfil?.activo) {
            await supabase.auth.signOut();
            setError('Tu cuenta está inactiva. Contacta al administrador.');
            setLoading(false);
            return;
        }

        const rol = perfil.rol as Rol;
        console.log(rol)

        if (rol === 'super_admin' || rol === 'administrador') {
            router.push('/admin');
            return;
        }

        // Verificar si ya tiene un turno activo (todos los roles)
        const { slug: turnoActivoSlug } = await obtenerTurnoActivo(data.session?.access_token);
        if (turnoActivoSlug) {
            const ruta = RUTA_INICIO_POR_ROL[rol as KnownRol] ?? '/mesero';
            router.push(`/${turnoActivoSlug}${ruta}`);
            return;
        }

        const userSucursalesRaw = await supabase
            .from('usuario_sucursales')
            .select('sucursales!inner(id, slug, nombre)')
            .eq('usuario_id', data.user.id);
        const userSucursales: { sucursales: { id: string; slug: string; nombre: string } }[] = userSucursalesRaw.data ?? [];

        const sucs = userSucursales
            .map(s => s.sucursales)
            .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);

        if (sucs.length === 0) {
            await supabase.auth.signOut();
            setError('No tienes sucursales asignadas. Contacta al administrador.');
            setLoading(false);
            return;
        }

        let sucsFinal: Sucursal[] = sucs;

        if (rol === 'mesero') {
            const hoy = new Date().toISOString().split('T')[0];
            const horaActual = new Date().toTimeString().slice(0, 5);
            const sucsIds = sucs.map(s => s.id);

            // Aperturas de día único (fecha = hoy)
            const unicasRaw = await supabase
                .from('aperturas_turno')
                .select('sucursal_id')
                .in('sucursal_id', sucsIds)
                .eq('fecha', hoy)
                .lte('hora_inicio', horaActual)
                .gte('hora_fin', horaActual)
                .eq('activa', true);
            const unicas: { sucursal_id: string }[] = unicasRaw.data ?? [];

            // Aperturas recurrentes activas hoy (fecha <= hoy, recurrencia_fin >= hoy)
            const recurrentesRaw = await (supabase as any)
                .from('aperturas_turno')
                .select('id, sucursal_id, hora_inicio, hora_fin')
                .in('sucursal_id', sucsIds)
                .lte('fecha', hoy)
                .gte('recurrencia_fin', hoy)
                .eq('activa', true)
                .not('recurrencia', 'is', null);
            const recurrentes: { id: string; sucursal_id: string; hora_inicio: string; hora_fin: string }[] = recurrentesRaw.data ?? [];

            const sucursalesConApertura = new Set(unicas.map(a => a.sucursal_id));

            for (const r of recurrentes) {
                if (sucursalesConApertura.has(r.sucursal_id)) continue;
                const excRaw = await (supabase as any)
                    .from('aperturas_excepciones')
                    .select('hora_inicio, hora_fin')
                    .eq('apertura_id', r.id)
                    .eq('fecha', hoy)
                    .maybeSingle();
                const exc = excRaw.data as { hora_inicio: string; hora_fin: string } | null;
                const hi = exc?.hora_inicio ?? r.hora_inicio;
                const hf = exc?.hora_fin ?? r.hora_fin;
                if (hi <= horaActual && hf >= horaActual) {
                    sucursalesConApertura.add(r.sucursal_id);
                }
            }

            sucsFinal = sucs.filter(s => sucursalesConApertura.has(s.id));

            if (sucsFinal.length === 0) {
                await supabase.auth.signOut();
                setError('No hay turnos abiertos en tus sucursales en este momento. Contacta al administrador.');
                setLoading(false);
                return;
            }
        }

        setSucursales(sucsFinal);

        setUserRol(rol);
        setStep('sucursal');
        setLoading(false);
    }

    async function handleConfirmarRegistro() {
        if (!confirmarSucursal) return;
        setRegistrandoTurno(confirmarSucursal.id);
        setError(null);
        const result = await registrarTurno(confirmarSucursal.id, confirmarSucursal.slug);
        setRegistrandoTurno(null);
        if (result.error) {
            setError(result.error);
            setConfirmarSucursal(null);
        } else {
            setConfirmarSucursal(null);
            const ruta = RUTA_INICIO_POR_ROL[userRol as KnownRol] ?? '/mesero';
            router.push(`/${confirmarSucursal.slug}${ruta}`);
        }
    }

    if (confirmarSucursal) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent-light via-bg-app to-bg-app">
                <div className="w-full max-w-sm">
                    <div className="bg-bg-card rounded-2xl border-2 border-border-default shadow-card overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-accent to-amber-400" />
                        <div className="p-8 text-center">
                            <div className="w-32 h-32 mx-auto mb-4 rounded-xl flex items-center justify-center">
                                <Image
                                    src="/parrillalogo.png"
                                    alt="Parrilla Norteña Soft"
                                    width={120}
                                    height={120}
                                    priority
                                    unoptimized
                                    className="drop-shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                                />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary mb-2">
                                ¿Registrar turno?
                            </h2>
                            <p className="text-sm text-muted mb-6">
                                Vas a registrar tu entrada en <strong className="text-text-primary">{confirmarSucursal.nombre}</strong>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmarSucursal(null)}
                                    className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmarRegistro}
                                    disabled={registrandoTurno === confirmarSucursal.id}
                                    className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {registrandoTurno === confirmarSucursal.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    {registrandoTurno === confirmarSucursal.id ? 'Registrando...' : 'Confirmar'}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (step === 'sucursal') {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent-light via-bg-app to-bg-app">
                <div className="w-full max-w-sm">
                    <div className="bg-bg-card rounded-2xl border-2 border-border-default shadow-card overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-accent to-amber-400" />
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <div className="w-32 h-32 mx-auto mb-3 rounded-xl flex items-center justify-center">
                                    <Image
                                        src="/parrillalogo.png"
                                        alt="Parrilla Norteña Soft"
                                        width={120}
                                        height={120}
                                        priority
                                        unoptimized
                                        className="drop-shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                                    />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">
                                    <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                                        Selecciona Sucursal
                                    </span>
                                </h1>
                            </div>

                            <div className="space-y-3">
                                {sucursales.map(s => (
                                    <div
                                        key={s.id}
                                        className="w-full bg-bg-card rounded-2xl border-2 border-border-default p-5
                                            hover:border-accent/50 hover:bg-accent/5 transition-all space-y-3"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                                <Store className="w-6 h-6 text-accent" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-text-primary">{s.nombre}</p>
                                                <p className="text-xs text-muted">{s.slug}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setConfirmarSucursal(s)}
                                            className="w-full bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Clock className="w-4 h-4" />
                                            Registrar turno
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent-light via-bg-app to-bg-app">
            <div className="w-full max-w-sm">
                <div className="bg-bg-card rounded-2xl border-2 border-border-default shadow-card overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-accent to-amber-400" />
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-36 h-36 mx-auto mb-4 rounded-2xl flex items-center justify-center">
                                <Image
                                    src="/parrillalogo.png"
                                    alt="Parrilla Norteña Soft"
                                    width={140}
                                    height={140}
                                    priority
                                    unoptimized
                                    className="drop-shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                                />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                <span className="text-text-primary">Parrilla </span>
                                <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                                    Norteña Soft
                                </span>
                            </h1>
                            <p className="text-sm text-text-muted mt-1.5">
                                Software de control y gestión del restaurante
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                                    Correo electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-border-default/60 pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
                                        placeholder="usuario@parrilla.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-border-default/60 pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-danger/10 text-danger border border-danger/20">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 font-semibold transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-accent"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogIn className="w-4 h-4" />
                                )}
                                {loading ? 'Ingresando...' : 'Ingresar'}
                            </button>
                        </form>

                        <p className="text-center text-xs text-text-muted/50 mt-6">
                            &copy; {new Date().getFullYear()} Parrilla Norteña Soft
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
