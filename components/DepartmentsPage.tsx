import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Department } from '../types';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, ClipboardListIcon, BuildingLibraryIcon } from './icons/Icons';
import DepartmentModal from './DepartmentModal';
import EmptyState from './ui/EmptyState';

const DepartmentsPage: React.FC = () => {
    const { departments, users, userDepartments, deleteDepartment, setView, setViewingDepartmentId, showConfirmation } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);

    const handleCreate = () => {
        setSelectedDept(null);
        setIsModalOpen(true);
    };

    const handleEdit = (dept: Department) => {
        setSelectedDept(dept);
        setIsModalOpen(true);
    };

    const handleDelete = (dept: Department) => {
        showConfirmation({
            title: 'Eliminar Departamento',
            message: `¿Estás seguro de que quieres eliminar "${dept.name}"? Esta acción no se puede deshacer. Nota: un departamento no puede ser eliminado si tiene proyectos asignados.`,
            confirmText: 'Eliminar Departamento',
            onConfirm: () => deleteDepartment(dept.id),
        });
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDept(null);
    };

    const handleViewProjects = (departmentId: string) => {
        setViewingDepartmentId(departmentId);
        setView('department-projects');
    };

    const departmentData = useMemo(() => {
        return departments.map(dept => {
            const coordinator = users.find(u => u.id === dept.coordinator);
            const memberCount = userDepartments.filter(ud => ud.department_id === dept.id).length;
            return { ...dept, coordinator, memberCount };
        });
    }, [departments, users, userDepartments]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Departamentos</h1>
                <Button onClick={handleCreate}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Crear Departamento
                </Button>
            </div>

            {departmentData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentData.map(dept => (
                        <div key={dept.id} className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{dept.name}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-10 overflow-hidden">{dept.description}</p>
                                
                                <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 dark:border-dark-border">
                                    <div className="text-sm">
                                        <p className="font-semibold">Coordinador:</p>
                                        {dept.coordinator ? (
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Avatar user={dept.coordinator} size="sm" />
                                                <span>{dept.coordinator.full_name}</span>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No asignado</p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                         <UserGroupIcon className="w-5 h-5 text-gray-500"/>
                                         <span className="font-semibold">{dept.memberCount} Miembros</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 mt-4">
                                <button onClick={() => handleViewProjects(dept.id)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md" title="Ver Proyectos">
                                    <ClipboardListIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => handleEdit(dept)} className="p-2 text-gray-500 hover:text-primary dark:hover:text-primary-dark rounded-md">
                                    <PencilIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => handleDelete(dept)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-500 rounded-md">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={BuildingLibraryIcon}
                    title="Crea tu primer departamento"
                    message="Los departamentos te ayudan a organizar tus equipos y proyectos. ¡Empieza creando uno para comenzar!"
                    action={
                        <Button onClick={handleCreate}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Crear Departamento
                        </Button>
                    }
                />
            )}
            
            {isModalOpen && <DepartmentModal department={selectedDept} onClose={closeModal} />}
        </div>
    );
};

export default DepartmentsPage;