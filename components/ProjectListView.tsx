import React from 'react';
import { Project } from '../types';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';
import Avatar from './ui/Avatar';
import { useData } from '../hooks/useData';

interface ProjectListViewProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

const ProjectListView: React.FC<ProjectListViewProps> = ({ projects, onProjectClick }) => {
    const { users, departments } = useData();

    return (
        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-bg dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Proyecto</th>
                            <th scope="col" className="px-6 py-3">Departamento</th>
                            <th scope="col" className="px-6 py-3">Etapa</th>
                            <th scope="col" className="px-6 py-3">Prioridad</th>
                            <th scope="col" className="px-6 py-3">Fecha Inicio</th>
                            <th scope="col" className="px-6 py-3">Fecha Límite</th>
                            <th scope="col" className="px-6 py-3">Miembros</th>
                            <th scope="col" className="px-6 py-3 text-center">Tareas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => {
                            const stageConfig = STAGE_CONFIG[project.stage];
                            const priorityConfig = PRIORITY_CONFIG[project.priority];
                            const projectMembers = users.filter(u => project.members.includes(u.id));
                            const department = departments.find(d => d.id === project.department_id);

                            return (
                                <tr
                                    key={project.id}
                                    className="bg-white border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer"
                                    onClick={() => onProjectClick(project)}
                                >
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <div>
                                            <p className="font-semibold">{project.title}</p>
                                            {project.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {department?.name || 'N/A'}
                                        </span>
                                    </td>
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
                                    <td className="px-6 py-4 text-sm">
                                        {new Date(project.start_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2">
                                            {projectMembers.slice(0, 3).map(member => (
                                                <Avatar key={member.id} user={member} size="sm" />
                                            ))}
                                            {projectMembers.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-dark-card">
                                                    +{projectMembers.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {project.tasks_count || 0}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectListView;
