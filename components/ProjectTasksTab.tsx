import React, { useState } from 'react';
import { Project, Task, User } from '../types';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import Input from './ui/Input';
import Button from './ui/Button';
import { PlusIcon, TrashIcon, LoadingSpinner } from './icons/Icons';
import Avatar from './ui/Avatar';

interface ProjectTasksTabProps {
    project: Project;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loadingData: boolean;
}

const TaskItem: React.FC<{ 
    task: Task; 
    onToggle: (taskId: string, isCompleted: boolean) => void;
    onDelete: (taskId: string) => void;
    users: User[];
}> = ({ task, onToggle, onDelete, users }) => {
    
    const assignedUser = users.find(u => u.id === task.assigned_to);

    return (
        <div className="flex items-center p-2 space-x-3 bg-gray-50 dark:bg-dark-bg rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg/50">
            <input
                type="checkbox"
                checked={task.is_completed}
                onChange={(e) => onToggle(task.id, e.target.checked)}
                className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
            <span className={`flex-1 text-sm ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                {task.title}
            </span>
            {assignedUser && <Avatar user={assignedUser} size="sm" />}
            <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ project, tasks, setTasks, loadingData }) => {
    const { users, addTask, updateTask, deleteTask } = useData();
    const { currentUser } = useAuth();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !currentUser) return;
        
        setIsSubmitting(true);
        try {
            const newTask = await addTask({
                title: newTaskTitle.trim(),
                is_completed: false,
            }, project.id);
            setTasks(prev => [...prev, newTask]);
            setNewTaskTitle('');
        } catch (error) {
            // Error toast is handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleTask = async (taskId: string, is_completed: boolean) => {
        const originalTasks = tasks;
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed } : t));
        try {
            await updateTask(taskId, { is_completed });
        } catch (error) {
            // Revert on error
            setTasks(originalTasks);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const originalTasks = tasks;
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await deleteTask(taskId, project.id);
        } catch (error) {
            // Revert on error
            setTasks(originalTasks);
        }
    };

    const completedTasks = tasks.filter(t => t.is_completed);
    const pendingTasks = tasks.filter(t => !t.is_completed);

    return (
        <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {loadingData ? <div className="flex justify-center items-center h-full"><LoadingSpinner /></div> : (
                    <>
                        {pendingTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} users={users} />
                        ))}
                        {completedTasks.length > 0 && pendingTasks.length > 0 && <hr className="my-4 border-gray-200 dark:border-dark-border" />}
                        {completedTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} users={users} />
                        ))}
                         {tasks.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 pt-16">
                                <p>No hay tareas en este proyecto.</p>
                                <p className="text-sm">¡Añade la primera para empezar!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
             <div className="mt-4 flex items-center space-x-2 border-t pt-4 dark:border-dark-border">
                <div className="relative flex-1">
                     <Input
                        placeholder="Añadir una nueva tarea y presionar Enter..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                        disabled={isSubmitting}
                    />
                </div>
                <Button onClick={handleAddTask} disabled={isSubmitting || !newTaskTitle.trim()}>
                    {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : 'Añadir'}
                </Button>
            </div>
        </div>
    );
};

export default ProjectTasksTab;
