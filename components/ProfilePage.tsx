import React, { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Avatar from './ui/Avatar';
import { CameraIcon, LoadingSpinner, UserCircleIcon } from './icons/Icons';
import { profileSchema } from '../utils/validationSchemas';
import { useZodForm } from '../hooks/useZodForm';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const ProfilePage: React.FC = () => {
    const { currentUser } = useAuth();
    const { updateUser, uploadUserAvatar } = useData();
    const { addToast } = useUI();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { formData, errors, handleChange, validate, setFormData } = useZodForm(
        profileSchema,
        { full_name: currentUser?.full_name || '' }
    );

    useEffect(() => {
        if (currentUser) {
            setFormData({ full_name: currentUser.full_name });
        }
    }, [currentUser, setFormData]);

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
        if (!currentUser || !validate()) return;
        
        setIsSaving(true);
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
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border-l-4 border-primary mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <UserCircleIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Mi Perfil</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configuración y personalización de cuenta de usuario</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <Avatar user={currentUser} size="lg" />
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
                            value={currentUser.email || ''}
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