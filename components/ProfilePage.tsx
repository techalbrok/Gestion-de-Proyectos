import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { User } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Avatar from './ui/Avatar';
import { CameraIcon, LoadingSpinner } from './icons/Icons';
import { profileSchema } from '../utils/validationSchemas';

const ProfilePage: React.FC = () => {
    const { currentUser, updateUser, uploadUserAvatar, addToast } = useAppContext();
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setFormData(currentUser);
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            addToast('Por favor, selecciona un archivo de imagen válido (JPG, PNG).', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            addToast('El archivo es demasiado grande. El máximo es 2MB.', 'error');
            return;
        }

        setIsUploading(true);
        try {
            await uploadUserAvatar(file);
        } catch (error) {
            // Error toast is handled in context
        } finally {
            setIsUploading(false);
            // Reset file input
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const validationResult = profileSchema.safeParse(formData);
        if (!validationResult.success) {
            const formattedErrors = validationResult.error.flatten().fieldErrors;
            const errorMap: Record<string, string> = {};
            for (const key in formattedErrors) {
                errorMap[key] = formattedErrors[key as keyof typeof formattedErrors]?.[0] || 'Error';
            }
            setErrors(errorMap);
            return;
        }

        setIsSaving(true);
        setErrors({});
        try {
            await updateUser({ ...currentUser, ...formData });
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!currentUser) {
        return <div>Cargando perfil...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading mb-6">Mi Perfil</h1>
            
            <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <Avatar user={formData as User} size="lg" />
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                    <LoadingSpinner className="w-8 h-8"/>
                                </div>
                            )}
                             <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-dark-bg rounded-full border border-gray-200 dark:border-dark-border cursor-pointer hover:bg-gray-100">
                                <CameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                             </label>
                             <input
                                id="avatar-upload"
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                accept="image/png, image/jpeg"
                                className="hidden"
                                disabled={isUploading}
                             />
                        </div>
                        <div>
                             <h2 className="text-xl font-bold text-gray-800 dark:text-white">{currentUser.full_name}</h2>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Input
                            label="Nombre Completo"
                            name="full_name"
                            value={formData.full_name || ''}
                            onChange={handleChange}
                            required
                            error={errors.full_name}
                        />
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            disabled
                            className="bg-gray-100 dark:bg-dark-bg/50"
                        />
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button type="submit" disabled={isSaving || isUploading}>
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;