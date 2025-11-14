
import React from 'react';
import { Project } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { PRIORITY_CONFIG } from '../constants';
import { ChatBubbleLeftRightIcon, CalendarDaysIcon, PencilIcon } from './icons/Icons';
import Avatar from './ui/Avatar';

interface ProjectCardProps {
  project: Project;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, project: Project) => void;
  onClick: () => void;
  canEdit: boolean;
  isDragging: boolean;
  onDragEnd: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDragStart, onClick, canEdit, isDragging, onDragEnd }) => {
  const { users, departments } = useAppContext();
  const department = departments.find(d => d.id === project.department_id);
  const priorityConfig = PRIORITY_CONFIG[project.priority];
  const projectMembers = users.filter(user => project.members.includes(user.id));

  return (
    <div
      draggable={canEdit}
      onDragStart={e => onDragStart(e, project)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`relative p-4 bg-white border border-gray-200 shadow-sm cursor-pointer dark:bg-dark-card dark:border-dark-border rounded-xl hover:shadow-xl hover:scale-[1.03] transition-all duration-300 ${isDragging ? 'opacity-50 rotate-3 scale-105 shadow-2xl' : ''}`}
    >
      {canEdit && (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-primary dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
            aria-label="Editar proyecto"
            title="Editar proyecto"
        >
            <PencilIcon className="w-4 h-4" />
        </button>
      )}

      <div className={`flex items-start justify-between mb-2 ${canEdit ? 'pr-8' : ''}`}>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{department?.name || '...'}</span>
        <span className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${priorityConfig.color} ${priorityConfig.textColor}`}>
          {priorityConfig.label}
        </span>
      </div>
      <h3 className="mb-4 text-base font-bold text-gray-800 dark:text-white">{project.title}</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {projectMembers.map(member => (
            <Avatar key={member.id} user={member} size="sm" />
          ))}
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
           {project.due_date && (
             <div className="flex items-center">
               <CalendarDaysIcon className="w-4 h-4 mr-1"/>
               <span>{new Date(project.due_date).toLocaleDateString()}</span>
             </div>
           )}
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
            <span>{project.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
