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
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-bg-base to-bg-gradient">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <Image
                        src="/parrillalogo.png"
                        alt="Parrilla Norteña Soft"
                        width={160}
                        height={160}
                        priority
                        unoptimized
                        className="mx-auto mb-6 drop-shadow-[0_0_30px_rgba(232,82,10,0.15)]"
                    />
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="text-white">Parrilla </span>
                        <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                            Norteña Soft
                        </span>
                    </h1>
                    <p className="text-sm text-body/70 mt-2">
                        Software de control y gestión del restaurante
                    </p>
                </div>

                <div className="bg-card rounded-2xl border border-border/60 p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-muted">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60 pointer-events-none" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-border/40 pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted/40 bg-bg-base focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all duration-150"
                                    placeholder="usuario@parrilla.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-muted">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60 pointer-events-none" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-border/40 pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted/40 bg-bg-base focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all duration-150"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                }}
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent text-white hover:bg-accent-hover rounded-xl px-4 py-3 font-semibold transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
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

                <p className="text-center text-xs text-muted/50 mt-6">
                    &copy; {new Date().getFullYear()} Parrilla Norteña Soft
                </p>
            </div>
        </main>
    );
}
