'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import type { Rol } from '@/types/roles';
import { RUTA_INICIO_POR_ROL } from '@/types/roles';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClientSupabaseClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol, activo')
            .eq('id', data.user.id)
            .single();

        if (!perfil?.activo) {
            await supabase.auth.signOut();
            setError('Tu cuenta está inactiva. Contacta al administrador.');
            setLoading(false);
            return;
        }

        const rutaInicio = RUTA_INICIO_POR_ROL[perfil.rol as Rol] ?? '/';
        router.push(rutaInicio);
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent-light via-bg-app to-bg-app">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <Image
                        src="/parrillalogo.png"
                        alt="Parrilla Norteña Soft"
                        width={160}
                        height={160}
                        priority
                        unoptimized
                        className="mx-auto mb-6 drop-shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                    />
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="text-text-primary">Parrilla </span>
                        <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                            Norteña Soft
                        </span>
                    </h1>
                    <p className="text-sm text-text-muted mt-2">
                        Software de control y gestión del restaurante
                    </p>
                </div>

                <div className="bg-bg-card rounded-2xl border-2 border-border-default p-8 shadow-card">
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
                </div>

                <p className="text-center text-xs text-text-muted/50 mt-6">
                    &copy; {new Date().getFullYear()} Parrilla Norteña Soft
                </p>
            </div>
        </main>
    );
}
