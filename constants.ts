import { ProjectStage, Priority } from './types';

export const STAGE_CONFIG: Record<ProjectStage, { title: string; color: string }> = {
  [ProjectStage.PENDING]: { title: 'Pendiente', color: 'bg-gray-500' },
  [ProjectStage.IN_PROGRESS]: { title: 'En Progreso', color: 'bg-blue-500' },
  [ProjectStage.BLOCKED]: { title: 'Bloqueado', color: 'bg-orange-500' },
  [ProjectStage.REVIEW]: { title: 'Revisión', color: 'bg-indigo-500' },
  [ProjectStage.COMPLETED]: { title: 'Completado', color: 'bg-green-500' },
  [ProjectStage.CANCELLED]: { title: 'Cancelado', color: 'bg-red-500' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; textColor: string }> = {
  [Priority.HIGH]: { label: 'Alta', color: 'bg-red-100 dark:bg-red-900/50', textColor: 'text-red-800 dark:text-red-200' },
  [Priority.MEDIUM]: { label: 'Media', color: 'bg-yellow-100 dark:bg-yellow-900/50', textColor: 'text-yellow-800 dark:text-yellow-200' },
  [Priority.LOW]: { label: 'Baja', color: 'bg-green-100 dark:bg-green-900/50', textColor: 'text-green-800 dark:text-green-200' },
};