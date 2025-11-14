import React, { useState, useEffect } from 'react';
import { Department, User } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import Avatar from './ui/Avatar';
import { departmentSchema } from '../utils/validationSchemas';

interface DepartmentModalProps {
  department: Department | null;
  onClose: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ department, onClose }) => {
    const { addDepartment, updateDepartment, users, userDepartments, updateDepartmentMembers } = useAppContext();
    const [formData, setFormData] = useState<Partial<Department>>({});
    const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    useEffect(() => {
        if (department) {
            setFormData(department);
            const currentMembers = userDepartments
                .filter(ud => ud.department_id === department.id)
                .map(ud => ud.user_id);
            setMemberIds(new Set(currentMembers));
        } else {
            setFormData({
                name: '',
                description: '',
                coordinator_id: '',
            });
            setMemberIds(new Set());
        }
        setErrors({});
    }, [department, userDepartments]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    const handleMemberToggle = (userId: string) => {
        setMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        const validationResult = departmentSchema.safeParse(formData);
        if (!validationResult.success) {
            const formattedErrors = validationResult.error.flatten().fieldErrors;
            const errorMap: Record<string, string> = {};
            for (const key in formattedErrors) {
                errorMap[key] = formattedErrors[key as keyof typeof formattedErrors]?.[0] || 'Error';
            }
            setErrors(errorMap);
            return;
        }
        
        if (department) {
            await updateDepartment(formData as Department);
            await updateDepartmentMembers(department.id, Array.from(memberIds));
        } else {
            const newDept = await addDepartment(formData as Omit<Department, 'id'>);
            if(newDept && memberIds.size > 0) {
              await updateDepartmentMembers(newDept.id, Array.from(memberIds));
            }
        }
        onClose();
    };

    const isEditMode = !!department;

    return (
        <Modal title={isEditMode ? 'Editar Departamento' : 'Crear Departamento'} onClose={onClose}>
            <div className="space-y-6">
                <Input
                    label="Nombre del Departamento"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="Ej. Ventas y Captación"
                    required
                    error={errors.name}
                />
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea 
                        name="description" 
                        value={formData.description || ''} 
                        onChange={handleChange} 
                        rows={3} 
                        className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-dark-card dark:border-dark-border focus:ring-primary focus:border-primary"
                        placeholder="Añada una breve descripción del departamento..."
                    ></textarea>
                </div>
                <Select
                    label="Coordinador"
                    name="coordinator_id"
                    value={formData.coordinator_id || ''}
                    onChange={handleChange}
                >
                    <option value="">Sin coordinador</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                </Select>

                {isEditMode && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gestionar Miembros</label>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-2 border rounded-md dark:border-dark-border">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-bg rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <Avatar user={user} size="sm" />
                                        <span>{user.full_name}</span>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={memberIds.has(user.id)}
                                        onChange={() => handleMemberToggle(user.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>{isEditMode ? 'Guardar Cambios' : 'Crear Departamento'}</Button>
            </div>
        </Modal>
    );
};

export default DepartmentModal;
