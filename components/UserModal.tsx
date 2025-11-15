import React from 'react';
import { User, UserRole } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { userSchema } from '../utils/validationSchemas';
import { useZodForm } from '../hooks/useZodForm';
import { useData } from '../hooks/useData';

interface UserModalProps {
  user: User;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose }) => {
    const { updateUser } = useData();
    const { formData, errors, handleChange, validate } = useZodForm(userSchema, {
        full_name: user.full_name,
        role: user.role,
    });

    const handleSave = async () => {
        if (!validate()) return;

        await updateUser({ ...user, ...formData });
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
                    value={user.email || ''}
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