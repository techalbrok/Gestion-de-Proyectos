import React, { useState, useEffect, useMemo } from 'react';
import { Task, Project } from '../types';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { fetchUserTasks } from '../services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
import { CheckCircleIcon, ClipboardListIcon, CalendarDaysIcon, LoadingSpinner, PlusIcon, PencilIcon, TrashIcon } from './icons/Icons';
import Avatar from './ui/Avatar';

interface TaskWithProject extends Task {
    project: Project;
}

interface TaskModalProps {
    task: TaskWithProject | null;
    projects: Project[];
    users: any[];
    onClose: () => void;
    onSave: (taskData: any) => void;
    onDelete?: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, projects, users, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [projectId, setProjectId] = useState(task?.project_id || '');
    const [assignedTo, setAssignedTo] = useState(task?.assigned_to || '');
    const [dueDate, setDueDate] = useState(task?.due_date || '');
    const [isCompleted, setIsCompleted] = useState(task?.is_completed || false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !projectId) return;

        setIsSaving(true);
        try {
            const taskData = {
                title: title.trim(),
                project_id: projectId,
                assigned_to: assignedTo || undefined,
                due_date: dueDate || null,
                is_completed: isCompleted,
            };
            await onSave(taskData);
            onClose();
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !onDelete) return;
        try {
            await onDelete(task.id);
            onClose();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const availableUsers = projectId ? users.filter(u => {
        const project = projects.find(p => p.id === projectId);
        return project?.members.includes(u.id);
    }) : [];

    return (
        <Modal title={task ? 'Editar Tarea' : 'Nueva Tarea'} onClose={onClose}>
            <div className="space-y-4">
                <Input
                    label="Título de la tarea"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Describe la tarea..."
                    required
                />
                
                <Select
                    label="Proyecto"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </Select>

                {projectId && (
                    <Select
                        label="Asignado a"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                    >
                        <option value="">Sin asignar</option>
                        {availableUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                    </Select>
                )}

                <Input
                    label="Fecha límite"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="completed"
                        checked={isCompleted}
                        onChange={(e) => setIsCompleted(e.target.checked)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="completed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Marcar como completada
                    </label>
                </div>
            </div>

            <div className="mt-6 flex justify-between">
                <div>
                    {task && onDelete && (
                        <Button variant="destructive" onClick={handleDelete}>
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Eliminar
                        </Button>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !title.trim() || !projectId}>
                        {isSaving ? 'Guardando...' : (task ? 'Actualizar' : 'Crear')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const MyTasksPage: React.FC = () => {
    const { projects, users, addTask, updateTask, deleteTask } = useData();
    const { currentUser } = useAuth();
    const { setView, setProjectToOpen, showConfirmation } = useUI();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [myTasks, setMyTasks] = useState<TaskWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task: TaskWithProject) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleDeleteTask = (task: TaskWithProject) => {
        showConfirmation({
            title: 'Eliminar Tarea',
            message: `¿Estás seguro de que quieres eliminar la tarea "${task.title}"?`,
            confirmText: 'Eliminar',
            onConfirm: async () => {
                try {
                    await deleteTask(task.id, task.project_id);
                    setMyTasks(prev => prev.filter(t => t.id !== task.id));
                } catch (error) {
                    console.error('Error deleting task:', error);
                }
            }
        });
    };

    const handleSaveTask = async (taskData: any) => {
        if (selectedTask) {
            // Update existing task
            await updateTask(selectedTask.id, taskData);
            setMyTasks(prev => prev.map(t => 
                t.id === selectedTask.id 
                    ? { ...t, ...taskData }
                    : t
            ));
        } else {
            // Create new task
            const newTask = await addTask(taskData, taskData.project_id);
            const project = projects.find(p => p.id === taskData.project_id);
            if (project) {
                setMyTasks(prev => [...prev, { ...newTask, project }]);
            }
        }
    };

    const handleToggleComplete = async (task: TaskWithProject) => {
        const updatedTask = { ...task, is_completed: !task.is_completed };
        await updateTask(task.id, { is_completed: !task.is_completed });
        setMyTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
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
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border-l-4 border-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Mis Tareas</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gestión personal de tareas asignadas</p>
                    </div>
                </div>
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
                <Button onClick={handleCreateTask}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Tarea
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
                                        const assignedUser = users.find(u => u.id === task.assigned_to);
                                        return (
                                            <div
                                                key={task.id}
                                                className="flex items-center p-3 space-x-3 bg-gray-50 dark:bg-dark-bg rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg/50 group"
                                            >
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleToggleComplete(task)}
                                                        className="flex items-center justify-center"
                                                    >
                                                        {task.is_completed ? (
                                                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                                        ) : (
                                                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-green-400 transition-colors"></div>
                                                        )}
                                                    </button>
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
                                                {assignedUser && (
                                                    <div className="flex items-center space-x-1">
                                                        <Avatar user={assignedUser} size="sm" />
                                                    </div>
                                                )}
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditTask(task)}
                                                        className="p-1 text-gray-400 hover:text-blue-500 rounded"
                                                        title="Editar tarea"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task)}
                                                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                        title="Eliminar tarea"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
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
        
        {isModalOpen && (
            <TaskModal 
                task={selectedTask} 
                projects={projects} 
                users={users} 
                onClose={closeModal} 
                onSave={handleSaveTask} 
                onDelete={selectedTask ? () => handleDeleteTask(selectedTask) : undefined} 
            />
        )}
    );
};

export default MyTasksPage;