import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { LoadingSpinner } from './icons/Icons';
import { loginSchema } from '../utils/validationSchemas';
import { useZodForm } from '../hooks/useZodForm';
import AuthHeader from './ui/AuthHeader';
import { useAuth } from '../hooks/useAuth';

const AuthPage: React.FC = () => {
    const { login, setAuthView } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    const { formData, errors, handleChange, validate } = useZodForm(loginSchema, {
      email: '',
      password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }
        
        setIsLoading(true);
        try {
            await login(formData.email, formData.password);
        } catch (err: any) {
            // Error is handled by the toast in context.
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-dark-card">
                <AuthHeader title="Gestión de Proyectos" />

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
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
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
                        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white border-primary" disabled={isLoading}>
                            {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : 'Iniciar Sesión'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;