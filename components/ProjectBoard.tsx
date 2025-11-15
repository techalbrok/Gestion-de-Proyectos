import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProjectStage, UserRole } from '../types';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';
import ProjectColumn from './ProjectColumn';
import ProjectListView from './ProjectListView';
import ProjectModal from './ProjectModal';
import Button from './ui/Button';
import Select from './ui/Select';
import { PlusIcon, FunnelIcon, ArchiveIcon, DocumentPlusIcon, Squares2X2Icon, ListBulletIcon, DownloadIcon } from './icons/Icons';
import EmptyState from './ui/EmptyState';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { exportProjectsToCSV } from '../utils/csvExport';

const ProjectBoard: React.FC = () => {
  const { projects, updateProjectStage, userDepartments, departments, users, loadArchivedProjects, archivedProjectsLoaded } = useData();
  const { currentUser } = useAuth();
  const { initialDepartmentFilter, setInitialDepartmentFilter, projectToOpen, setProjectToOpen } = useUI();

  const [draggedItem, setDraggedItem] = useState<Project | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProjectStage | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showMyProjectsOnly, setShowMyProjectsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  useEffect(() => {
    if (projectToOpen) {
      const project = projects.find(p => p.id === projectToOpen);
      if (project) {
        setSelectedProject(project);
        setIsModalOpen(true);
      }
      setProjectToOpen(null); // Reset after opening
    }
  }, [projectToOpen, projects, setProjectToOpen]);
  
  useEffect(() => {
    if (showArchived && !archivedProjectsLoaded) {
      loadArchivedProjects();
    }
  }, [showArchived, archivedProjectsLoaded, loadArchivedProjects]);

  useEffect(() => {
    if (initialDepartmentFilter) {
      setDepartmentFilter(initialDepartmentFilter);
      setInitialDepartmentFilter(null); // Clear after use
    }
  }, [initialDepartmentFilter, setInitialDepartmentFilter]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const departmentMatch = !departmentFilter || project.department_id === departmentFilter;
      const priorityMatch = !priorityFilter || project.priority === priorityFilter;
      const memberMatch = !memberFilter || project.members.includes(memberFilter);
      const myProjectsMatch = !showMyProjectsOnly || (currentUser && project.members.includes(currentUser.id));
      return departmentMatch && priorityMatch && memberMatch && myProjectsMatch;
    });
  }, [projects, departmentFilter, priorityFilter, memberFilter, showMyProjectsOnly, currentUser]);

  const handleClearFilters = () => {
    setDepartmentFilter('');
    setPriorityFilter('');
    setMemberFilter('');
    setShowMyProjectsOnly(false);
  };

  const canEditProject = (project: Project): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    return userDepartments.some(ud => ud.user_id === currentUser.id && ud.department_id === project.department_id);
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, project: Project) => {
    if (!canEditProject(project)) {
      e.preventDefault();
      return;
    }
    setDraggedItem(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (stage: ProjectStage) => {
    if (draggedItem && draggedItem.stage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
     if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: ProjectStage) => {
    e.preventDefault();
    if (draggedItem && draggedItem.stage !== stage) {
       if (canEditProject(draggedItem)) {
         updateProjectStage(draggedItem.id, stage);
       }
    }
    setDraggedItem(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverStage(null);
  };
  
  const handleCardClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  }
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  }

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportProjectsToCSV(filteredProjects, departments, `proyectos-${timestamp}.csv`);
  };

  const stagesToShow = useMemo(() => {
    const allStages = Object.values(ProjectStage);
    if (showArchived) {
        return allStages;
    }
    return allStages.filter(
        stage => stage !== ProjectStage.COMPLETED && stage !== ProjectStage.CANCELLED
    );
  }, [showArchived]);

  if (projects.length === 0 && !isModalOpen && !archivedProjectsLoaded) {
    return (
        <div className="flex items-center justify-center h-full p-6">
            <EmptyState
                icon={DocumentPlusIcon}
                title="Crea tu primer proyecto"
                message="Empieza a organizar tu trabajo. Los proyectos aparecerán aquí una vez creados en el tablero."
                action={
                    <Button onClick={handleCreateProject}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Crear Proyecto
                    </Button>
                }
            />
             {isModalOpen && <ProjectModal project={selectedProject} onClose={closeModal} />}
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardListIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Tablero de Proyectos</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gestión y seguimiento de todos los proyectos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-100 dark:bg-dark-bg rounded-md p-1">
                    <button
                        onClick={() => setViewMode('board')}
                        className={`p-2 rounded transition-colors ${viewMode === 'board' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Vista de Tablero"
                    >
                        <Squares2X2Icon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Vista de Lista"
                    >
                        <ListBulletIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <ArchiveIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <label htmlFor="show-archived" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">Mostrar Archivados</label>
                    <input
                        id="show-archived"
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                </div>
                <Button variant="secondary" onClick={handleExportCSV} disabled={filteredProjects.length === 0}>
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Exportar CSV
                </Button>
                <Button onClick={handleCreateProject}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Crear Proyecto
                </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 bg-white dark:bg-dark-card rounded-lg shadow-sm">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} name="department-filter">
                    <option value="">Todos los Departamentos</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
                 <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} name="priority-filter">
                    <option value="">Todas las Prioridades</option>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}
                </Select>
                <Select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} name="member-filter">
                    <option value="">Todos los Miembros</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </Select>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded-md border border-gray-200 dark:border-dark-border">
                <input
                    id="my-projects-filter"
                    type="checkbox"
                    checked={showMyProjectsOnly}
                    onChange={(e) => setShowMyProjectsOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="my-projects-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer whitespace-nowrap">
                    Solo mis proyectos
                </label>
            </div>
            <Button variant="secondary" onClick={handleClearFilters}>Limpiar Filtros</Button>
        </div>

      {viewMode === 'board' ? (
        <div className="flex-1 flex overflow-x-auto gap-6 pb-4">
          {filteredProjects.length > 0 ? (
              stagesToShow.map(stage => {
                const stageProjects = filteredProjects.filter(p => p.stage === stage);
                return (
                  <ProjectColumn
                    key={stage}
                    stage={stage}
                    projects={stageProjects}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragStart={handleDragStart}
                    onCardClick={handleCardClick}
                    canEditProject={canEditProject}
                    draggedItem={draggedItem}
                    dragOverStage={dragOverStage}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                  />
                );
              })
          ) : (
               <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                      icon={FunnelIcon}
                      title="No se encontraron proyectos"
                      message="Prueba a ajustar o limpiar los filtros para ver más resultados en el tablero."
                      action={
                          <Button variant="secondary" onClick={handleClearFilters}>Limpiar Filtros</Button>
                      }
                  />
              </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredProjects.length > 0 ? (
            <ProjectListView projects={filteredProjects} onProjectClick={handleCardClick} />
          ) : (
            <EmptyState
              icon={FunnelIcon}
              title="No se encontraron proyectos"
              message="Prueba a ajustar o limpiar los filtros para ver más resultados."
              action={
                <Button variant="secondary" onClick={handleClearFilters}>Limpiar Filtros</Button>
              }
            />
          )}
        </div>
      )}
      {isModalOpen && <ProjectModal project={selectedProject} onClose={closeModal} />}
    </div>
  );
};

export default ProjectBoard;