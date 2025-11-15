import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { LoadingSpinner, CheckCircleIcon } from './icons/Icons';
import { forgotPasswordSchema } from '../utils/validationSchemas';
import { useZodForm } from '../hooks/useZodForm';
import AuthHeader from './ui/AuthHeader';
import { useAuth } from '../hooks/useAuth';

const ForgotPasswordPage: React.FC = () => {
    const { requestPasswordReset, setAuthView } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const { formData, errors, handleChange, validate } = useZodForm(forgotPasswordSchema, {
        email: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!validate()) return;
        
        setIsLoading(true);
        try {
            await requestPasswordReset(formData.email);
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
                <AuthHeader title="Recuperar Contraseña" />
                
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
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@email.com"
                                error={errors.email}
                            />
                            
                            <div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white border-primary" disabled={isLoading}>
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