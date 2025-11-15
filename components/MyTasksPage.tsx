import React, { useState, useEffect, useMemo } from 'react';
import { Task, Project } from '../types';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { fetchUserTasks } from '../services/api';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import { CheckCircleIcon, ClipboardListIcon, CalendarDaysIcon, LoadingSpinner } from './icons/Icons';

interface TaskWithProject extends Task {
    project: Project;
}

const MyTasksPage: React.FC = () => {
    const { projects } = useData();
    const { currentUser } = useAuth();
    const { setView, setProjectToOpen } = useUI();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [myTasks, setMyTasks] = useState<TaskWithProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMyTasks = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const tasks = await fetchUserTasks(currentUser.id);

                const tasksWithProjects: TaskWithProject[] = tasks
                    .map(task => {
                        const project = projects.find(p => p.id === task.project_id);
                        if (!project) return null;
                        return { ...task, project };
                    })
                    .filter((task): task is TaskWithProject => task !== null);

                setMyTasks(tasksWithProjects);
            } catch (error) {
                console.error('Failed to load user tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMyTasks();
    }, [currentUser, projects]);

    const filteredTasks = useMemo(() => {
        switch (filter) {
            case 'pending':
                return myTasks.filter(t => !t.is_completed);
            case 'completed':
                return myTasks.filter(t => t.is_completed);
            default:
                return myTasks;
        }
    }, [myTasks, filter]);

    const tasksByProject = useMemo(() => {
        const grouped: Record<string, TaskWithProject[]> = {};
        filteredTasks.forEach(task => {
            if (!grouped[task.project.id]) {
                grouped[task.project.id] = [];
            }
            grouped[task.project.id].push(task);
        });
        return grouped;
    }, [filteredTasks]);

    const handleProjectClick = (projectId: string) => {
        setProjectToOpen(projectId);
        setView('projects');
    };

    if (!currentUser) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <LoadingSpinner className="w-12 h-12" />
            </div>
        );
    }

    if (myTasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <EmptyState
                    icon={ClipboardListIcon}
                    title="No tienes tareas asignadas"
                    message="Cuando se te asignen tareas en los proyectos, aparecerán aquí para que puedas gestionarlas fácilmente."
                />
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Mis Tareas</h1>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={filter === 'all' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('all')}
                    >
                        Todas ({myTasks.length})
                    </Button>
                    <Button
                        variant={filter === 'pending' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('pending')}
                    >
                        Pendientes ({myTasks.filter(t => !t.is_completed).length})
                    </Button>
                    <Button
                        variant={filter === 'completed' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('completed')}
                    >
                        Completadas ({myTasks.filter(t => t.is_completed).length})
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
                {Object.keys(tasksByProject).length === 0 ? (
                    <EmptyState
                        icon={ClipboardListIcon}
                        title={`No tienes tareas ${filter === 'pending' ? 'pendientes' : filter === 'completed' ? 'completadas' : ''}`}
                        message="Ajusta los filtros para ver más tareas."
                    />
                ) : (
                    Object.entries(tasksByProject).map(([projectId, tasks]) => {
                        const project = tasks[0].project;
                        return (
                            <div key={projectId} className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => handleProjectClick(projectId)}
                                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
                                    >
                                        {project.title}
                                    </button>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {tasks.map(task => {
                                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.is_completed;
                                        return (
                                            <div
                                                key={task.id}
                                                className="flex items-center p-3 space-x-3 bg-gray-50 dark:bg-dark-bg rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg/50"
                                            >
                                                <div className="flex items-center justify-center">
                                                    {task.is_completed ? (
                                                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                                    ) : (
                                                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {task.title}
                                                    </p>
                                                    {task.due_date && (
                                                        <div className={`flex items-center space-x-1 text-xs mt-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                                                            <CalendarDaysIcon className="w-3 h-3" />
                                                            <span>
                                                                {isOverdue && 'Vencida: '}
                                                                {new Date(task.due_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MyTasksPage;
