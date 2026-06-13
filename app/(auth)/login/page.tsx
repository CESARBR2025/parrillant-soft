// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

        // Obtener rol para redirigir al dashboard correcto
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
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">🍽️ RestaurantOS</h1>
                    <p className="mt-2 text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="usuario@restaurante.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white
                       hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </main>
    );
}