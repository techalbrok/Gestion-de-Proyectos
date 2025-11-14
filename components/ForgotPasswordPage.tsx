
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Input from './ui/Input';
import Button from './ui/Button';
import { LoadingSpinner, CheckCircleIcon } from './icons/Icons';
import { forgotPasswordSchema } from '../utils/validationSchemas';

const ForgotPasswordPage: React.FC = () => {
    const { requestPasswordReset, setAuthView } = useAppContext();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationResult = forgotPasswordSchema.safeParse({ email });
        if (!validationResult.success) {
            setError(validationResult.error.flatten().fieldErrors.email?.[0] || null);
            return;
        }
        setError(null);
        
        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            setIsSubmitted(true);
        } catch (err: any) {
            // Error is handled by toast in context
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-dark-card">
                <div className="text-center">
                    <img src="/images/logo_albrok_rojo_transp.png" alt="Albroxfera Logo" className="w-40 mx-auto mb-4 block dark:hidden" />
                    <img src="/images/logo_albrok_blanco_transp.png" alt="Albroxfera Logo" className="w-40 mx-auto mb-4 hidden dark:block" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
                        Recuperar Contraseña
                    </h1>
                </div>
                {isSubmitted ? (
                    <div className="text-center space-y-4">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
                        <p className="text-gray-700 dark:text-gray-300">
                            Revisa tu correo electrónico para seguir las instrucciones de recuperación.
                        </p>
                         <Button variant="secondary" onClick={() => setAuthView('signin')} className="mt-6 w-full">
                            Volver a Iniciar Sesión
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
                        </p>
                        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                            <Input
                                label="Correo Electrónico"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                error={error}
                            />
                            
                            <div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Enviar Enlace'}
                                </Button>
                            </div>
                        </form>
                        <p className="text-sm text-center">
                            <button type="button" onClick={() => setAuthView('signin')} className="font-medium text-primary hover:underline dark:text-red-400">
                                Volver a Iniciar Sesión
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
