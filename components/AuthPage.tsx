
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Input from './ui/Input';
import Button from './ui/Button';
import { LoadingSpinner } from './icons/Icons';
import { loginSchema } from '../utils/validationSchemas';

const AuthPage: React.FC = () => {
    const { login, setAuthView } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    const validateAndSetErrors = (schema: any, data: any) => {
        const result = schema.safeParse(data);
        if (!result.success) {
            const formattedErrors = result.error.flatten().fieldErrors;
            const errorMap: Record<string, string> = {};
            for (const key in formattedErrors) {
                errorMap[key] = formattedErrors[key as keyof typeof formattedErrors]?.[0] || 'Error';
            }
            setErrors(errorMap);
            return false;
        }
        setErrors({});
        return true;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateAndSetErrors(loginSchema, { email, password })) {
            return;
        }
        
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            // Error is handled by the toast in context.
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
                        Gestión de Proyectos
                    </h1>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <Input
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        error={errors.email}
                    />
                    <div>
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            error={errors.password}
                        />
                        <div className="flex items-center justify-end text-sm mt-2">
                            <button
                                type="button"
                                onClick={() => setAuthView('forgot-password')}
                                className="font-medium text-primary hover:underline dark:text-red-400"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Iniciar Sesión'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;
