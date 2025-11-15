import React from 'react';
import { z } from 'zod';
import { Project, ProjectStage, Priority, User, Department } from '../types';
import Input from './ui/Input';
import Select from './ui/Select';
import Avatar from './ui/Avatar';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';
import { projectSchema } from '../utils/validationSchemas';

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectDetailsTabProps {
    formData: ProjectFormData;
    errors: Partial<Record<keyof ProjectFormData, string | undefined>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setField: (fieldName: keyof ProjectFormData, value: any) => void;
    isReadOnly: boolean;
    userVisibleDepartments: Department[];
    users: User[];
    project: Project | null;
}

const ProjectDetailsTab: React.FC<ProjectDetailsTabProps> = ({
    formData,
    errors,
    handleChange,
    setField,
    isReadOnly,
    userVisibleDepartments,
    users,
    project,
}) => {

    const handleMemberChange = (selectedUser: User) => {
        if (isReadOnly) return;
        const currentMembers = formData.members || [];
        const isMember = currentMembers.includes(selectedUser.id);
        const newMembers = isMember
            ? currentMembers.filter(id => id !== selectedUser.id)
            : [...currentMembers, selectedUser.id];
        setField('members', newMembers);
    }

    return (
        <div className="space-y-6">
            <Input label="Título del Proyecto" name="title" value={formData.title || ''} onChange={handleChange} disabled={isReadOnly} error={errors.title} />
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-dark-card dark:border-dark-border focus:ring-primary focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed" disabled={isReadOnly}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select label="Departamento" name="department_id" value={formData.department_id || ''} onChange={handleChange} disabled={isReadOnly || !!project} error={errors.department_id}>
                    {userVisibleDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
                <Select label="Prioridad" name="priority" value={formData.priority || ''} onChange={handleChange} disabled={isReadOnly} error={errors.priority}>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                </Select>
                <Input label="Fecha de Inicio" name="start_date" type="date" value={typeof formData.start_date === 'string' ? formData.start_date.split('T')[0] : ''} onChange={handleChange} disabled={isReadOnly} error={errors.start_date} />
                <Input label="Fecha Límite" name="due_date" type="date" value={typeof formData.due_date === 'string' ? formData.due_date.split('T')[0] : ''} onChange={handleChange} disabled={isReadOnly} error={errors.due_date} />
                <Select label="Etapa" name="stage" value={formData.stage || ''} onChange={handleChange} disabled={isReadOnly} error={errors.stage}>
                    {Object.values(ProjectStage).map(s => <option key={s} value={s}>{STAGE_CONFIG[s].title}</option>)}
                </Select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Miembros Asignados</label>
                <div className="flex flex-wrap gap-2">
                    {users.map(user => (
                        <div key={user.id} onClick={() => handleMemberChange(user)} className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.members?.includes(user.id) ? 'bg-red-100 dark:bg-primary/20 ring-2 ring-primary' : 'bg-gray-100 dark:bg-dark-card'}`}>
                            <Avatar user={user} size="sm" />
                            <span className="text-sm">{user.full_name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsTab;