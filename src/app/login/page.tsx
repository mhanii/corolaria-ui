"use client"

/**
 * Login Page
 * 
 * Beautiful login page matching the Coloraria brand.
 * Redirects to chat after successful login.
 */

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/chat');
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) {
        return null;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(username, password);
            router.push('/chat');
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err?.message || 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md px-4">
            {/* Branding Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <Logo size="lg" />
                    <div className="text-left">
                        <h1 className="text-3xl font-bold font-display text-foreground group-hover:text-primary transition-smooth">
                            Coloraria
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Asistente Legal IA
                        </p>
                    </div>
                </Link>
            </div>

            {/* Login Card */}
            <Card className="shadow-medium border-border/50">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-display text-center">
                        Iniciar Sesión
                    </CardTitle>
                    <CardDescription className="text-center">
                        Ingresa tus credenciales para acceder
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Username Field */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Usuario
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Tu nombre de usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10"
                                    disabled={isLoading}
                                    required
                                    minLength={3}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    disabled={isLoading}
                                    required
                                    minLength={6}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Back to Home Link */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
                ¿No tienes cuenta? Contacta al administrador.
            </p>
        </div>
    );
}

