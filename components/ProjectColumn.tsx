import React from 'react';
import { Project, ProjectStage } from '../types';
import { STAGE_CONFIG } from '../constants';
import ProjectCard from './ProjectCard';

interface ProjectColumnProps {
  stage: ProjectStage;
  projects: Project[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: ProjectStage) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, project: Project) => void;
  onCardClick: (project: Project) => void;
  canEditProject: (project: Project) => boolean;
  draggedItem: Project | null;
  dragOverStage: ProjectStage | null;
  onDragEnter: (stage: ProjectStage) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

const ProjectColumn: React.FC<ProjectColumnProps> = ({
  stage,
  projects,
  onDrop,
  onDragOver,
  onDragStart,
  onCardClick,
  canEditProject,
  draggedItem,
  dragOverStage,
  onDragEnter,
  onDragLeave,
  onDragEnd,
}) => {
  const config = STAGE_CONFIG[stage];
  const isDragOver = dragOverStage === stage;

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden w-80 flex-shrink-0 transition-colors duration-200 ${
        isDragOver ? 'bg-slate-200 dark:bg-dark-border' : 'bg-slate-100 dark:bg-dark-card'
      }`}
      onDrop={(e) => onDrop(e, stage)}
      onDragOver={onDragOver}
      onDragEnter={() => onDragEnter(stage)}
      onDragLeave={onDragLeave}
    >
      <div className={`flex items-center justify-between p-4 ${config.color}`}>
        <h2 className="text-lg font-bold text-white">{config.title}</h2>
        <span className="px-3 py-1 text-sm font-semibold text-white bg-black bg-opacity-20 rounded-full">
          {projects.length}
        </span>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onDragStart={onDragStart}
            onClick={() => onCardClick(project)}
            canEdit={canEditProject(project)}
            isDragging={draggedItem?.id === project.id}
            onDragEnd={onDragEnd}
          />
        ))}
        {projects.length === 0 && (
          <div className="flex items-center justify-center h-20 text-sm text-gray-500 border-2 border-dashed rounded-lg dark:text-gray-400">
            Arrastra proyectos aquí
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectColumn;