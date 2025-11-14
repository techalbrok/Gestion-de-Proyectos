import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { userSchema } from '../utils/validationSchemas';

interface UserModalProps {
  user: User;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose }) => {
    const { updateUser } = useAppContext();
    const [formData, setFormData] = useState<Partial<User>>(user);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    useEffect(() => {
        setFormData(user);
        setErrors({});
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSave = async () => {
        const validationResult = userSchema.safeParse(formData);
        if (!validationResult.success) {
            const formattedErrors = validationResult.error.flatten().fieldErrors;
            const errorMap: Record<string, string> = {};
            for (const key in formattedErrors) {
                errorMap[key] = formattedErrors[key as keyof typeof formattedErrors]?.[0] || 'Error';
            }
            setErrors(errorMap);
            return;
        }

        await updateUser(formData as User);
        onClose();
    };

    return (
        <Modal title="Editar Usuario" onClose={onClose}>
            <div className="space-y-6">
                <Input
                    label="Nombre Completo"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    error={errors.full_name}
                />
                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    disabled
                />
                <Select
                    label="Rol"
                    name="role"
                    value={formData.role || ''}
                    onChange={handleChange}
                    error={errors.role}
                >
                    {Object.values(UserRole).map(role => (
                        <option key={role} value={role} className="capitalize">{role}</option>
                    ))}
                </Select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
        </Modal>
    );
};

export default UserModal;
