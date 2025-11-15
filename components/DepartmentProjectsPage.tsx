import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import ProjectModal from './ProjectModal';
import { ChevronLeftIcon, ClipboardListIcon, CheckCircleIcon, Cog6ToothIcon, UserGroupIcon, PlusIcon, DownloadIcon } from './icons/Icons';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';
import StatCard from './ui/StatCard';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import { exportProjectsToCSV } from '../utils/csvExport';

const DepartmentProjectsPage: React.FC = () => {
    const { departments, projects, users, userDepartments } = useData();
    const { viewingDepartmentId, setView, setViewingDepartmentId, setPreselectedDepartmentId } = useUI();

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const department = useMemo(() => {
        return departments.find(d => d.id === viewingDepartmentId);
    }, [departments, viewingDepartmentId]);

    const departmentProjects = useMemo(() => {
        return projects.filter(p => p.department_id === viewingDepartmentId);
    }, [projects, viewingDepartmentId]);

    const departmentStats = useMemo(() => {
        const total = departmentProjects.length;
        const inProgress = departmentProjects.filter(p => p.stage === 'in_progress').length;
        const completed = departmentProjects.filter(p => p.stage === 'completed').length;
        const memberCount = userDepartments.filter(ud => ud.department_id === viewingDepartmentId).length;
        return { total, inProgress, completed, memberCount };
    }, [departmentProjects, userDepartments, viewingDepartmentId]);


    const handleBack = () => {
        setViewingDepartmentId(null);
        setView('departments');
    };

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const handleCreateProject = () => {
        setPreselectedDepartmentId(viewingDepartmentId);
        setSelectedProject(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProject(null);
        setPreselectedDepartmentId(null);
    };

    const handleExportCSV = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        const deptName = department?.name.replace(/\s+/g, '-').toLowerCase() || 'department';
        exportProjectsToCSV(departmentProjects, departments, `proyectos-${deptName}-${timestamp}.csv`);
    };

    if (!department) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-bold dark:text-white">Departamento no encontrado.</h1>
                <Button onClick={handleBack} variant="secondary" className="mt-4">Volver a Departamentos</Button>
            </div>
        );
    }
    
    const coordinator = users.find(u => u.id === department.coordinator_id);

    return (
        <div className="p-6 flex flex-col h-full space-y-6">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <Button onClick={handleBack} variant="secondary">
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />
                        Volver a Departamentos
                    </Button>
                    <div className="flex items-center space-x-2">
                        <Button variant="secondary" onClick={handleExportCSV} disabled={departmentProjects.length === 0}>
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            Exportar CSV
                        </Button>
                        <Button onClick={handleCreateProject}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Crear Proyecto
                        </Button>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">{department.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{department.description}</p>
                    {coordinator && (
                        <div className="flex items-center space-x-2 mt-4 text-sm">
                            <span className="font-semibold dark:text-gray-300">Coordinador:</span>
                            <Avatar user={coordinator} size="sm" />
                            <span className="dark:text-gray-300">{coordinator.full_name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Proyectos Totales" value={departmentStats.total} icon={ClipboardListIcon} variant="department" />
                <StatCard title="En Progreso" value={departmentStats.inProgress} icon={Cog6ToothIcon} variant="department" />
                <StatCard title="Completados" value={departmentStats.completed} icon={CheckCircleIcon} variant="department" />
                <StatCard title="Miembros" value={departmentStats.memberCount} icon={UserGroupIcon} variant="department" />
            </div>
            
            {/* Projects Table */}
            <div className="flex-1 bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-bg dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Proyecto</th>
                                <th scope="col" className="px-6 py-3">Etapa</th>
                                <th scope="col" className="px-6 py-3">Prioridad</th>
                                <th scope="col" className="px-6 py-3">Fecha Límite</th>
                                <th scope="col" className="px-6 py-3">Miembros</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentProjects.length > 0 ? departmentProjects.map(project => {
                                const stageConfig = STAGE_CONFIG[project.stage];
                                const priorityConfig = PRIORITY_CONFIG[project.priority];
                                const projectMembers = users.filter(u => project.members.includes(u.id));

                                return (
                                    <tr 
                                        key={project.id} 
                                        className="bg-white border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer"
                                        onClick={() => handleProjectClick(project)}
                                    >
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {project.title}
                                        </th>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${stageConfig.color}`}>
                                                {stageConfig.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityConfig.color} ${priorityConfig.textColor}`}>
                                                {priorityConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {projectMembers.map(member => (
                                                    <Avatar key={member.id} user={member} size="sm" />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-400" />
                                        <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">No hay proyectos</h3>
                                        <p className="mt-1 text-sm">Este departamento aún no tiene proyectos asignados.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <ProjectModal project={selectedProject} onClose={closeModal} />}
        </div>
    );
};

export default DepartmentProjectsPage;