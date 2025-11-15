import React, { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Import ProjectStage and Priority enums to correctly type default project data.
import { Project, Comment, User, UserRole, ProjectHistory, ProjectStage, Priority, Task } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { TrashIcon, DocumentDuplicateIcon } from './icons/Icons';
import { projectSchema } from '../utils/validationSchemas';
import { useZodForm } from '../hooks/useZodForm';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import ProjectDetailsTab from './ProjectDetailsTab';
import ProjectCommentsTab from './ProjectCommentsTab';
import ProjectHistoryTab from './ProjectHistoryTab';
import ProjectTasksTab from './ProjectTasksTab';
import { ProjectAttachmentsTab } from './ProjectAttachmentsTab';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const { departments, users, userDepartments, addProject, updateProject, deleteProject, getComments, getHistory, getTasks } = useData();
  const { currentUser } = useAuth();
  const { showConfirmation, preselectedDepartmentId } = useUI();
  
  const [activeTab, setActiveTab] = useState('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const canEditProject = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (!project) {
        const userDeptIds = userDepartments.filter(ud => ud.user_id === currentUser.id).map(ud => ud.department_id);
        return userDeptIds.length > 0;
    }
    return userDepartments.some(ud => ud.user_id === currentUser.id && ud.department_id === project.department_id);
  }, [currentUser, project, userDepartments]);

  const isReadOnly = project ? !canEditProject : false;

  const userVisibleDepartments = useMemo(() => {
    if (currentUser?.role === UserRole.ADMIN) {
        return departments;
    }
    const userDeptIds = userDepartments.filter(ud => ud.user_id === currentUser?.id).map(ud => ud.department_id);
    return departments.filter(d => userDeptIds.includes(d.id));
  }, [currentUser, departments, userDepartments]);

  const getInitialData = useCallback(() => {
    const defaultDepartmentId = preselectedDepartmentId || userVisibleDepartments[0]?.id || '';

    const defaultData = {
      title: '',
      description: '',
      stage: ProjectStage.PENDING,
      priority: Priority.MEDIUM,
      members: [] as string[],
      department_id: defaultDepartmentId,
      start_date: new Date().toISOString().split('T')[0],
      due_date: null,
    };

    return project
      ? {
          title: project.title,
          description: project.description,
          department_id: project.department_id,
          stage: project.stage,
          priority: project.priority,
          start_date: project.start_date,
          due_date: project.due_date,
          members: project.members || [],
        }
      : defaultData;
  }, [project, userVisibleDepartments, preselectedDepartmentId]);

  const { formData, errors, handleChange, validate, setFormData, setField } = useZodForm(
    projectSchema,
    getInitialData()
  );

  useEffect(() => {
    setFormData(getInitialData());
    if (project) {
      setLoadingData(true);
      Promise.all([
        getComments(project.id),
        getHistory(project.id),
        getTasks(project.id)
      ]).then(([commentsData, historyData, tasksData]) => {
        setComments(commentsData);
        setHistory(historyData);
        setTasks(tasksData);
      }).finally(() => setLoadingData(false));
    }
  }, [project, getComments, getHistory, getTasks, setFormData, getInitialData]);


  const handleSave = async () => {
    if (isReadOnly || !validate()) return;
    
    if (project) {
        await updateProject({ ...project, ...formData } as Project);
    } else {
        await addProject(formData as Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count' | 'tasks_count'>);
    }
    onClose();
  }

  const handleDelete = () => {
    if (!project) return;

    showConfirmation({
        title: 'Eliminar Proyecto',
        message: `¿Estás seguro de que quieres eliminar el proyecto "${project.title}"? Todos los comentarios, historial y notificaciones asociados se borrarán permanentemente. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar Proyecto',
        onConfirm: async () => {
            await deleteProject(project.id);
            onClose();
        }
    });
  };

  const handleDuplicate = async () => {
    if (!project) return;

    const duplicatedProject = {
      title: `${project.title} (Copia)`,
      description: project.description,
      department_id: project.department_id,
      stage: ProjectStage.PENDING,
      priority: project.priority,
      start_date: new Date().toISOString().split('T')[0],
      due_date: project.due_date,
      members: project.members,
    };

    await addProject(duplicatedProject);
    onClose();
  };

  const TabButton: React.FC<{tabName: string, label: string}> = ({tabName, label}) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabName ? 'bg-red-100 text-red-700 dark:bg-primary/20 dark:text-red-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-card'}`}
    >
        {label}
    </button>
  );

  return (
    <Modal title={project ? 'Detalles del Proyecto' : 'Crear Proyecto'} onClose={onClose}>
        <div className="mb-4 border-b border-gray-200 dark:border-dark-border">
            <div className="flex space-x-2">
                <TabButton tabName="details" label="Detalles" />
                {project && <TabButton tabName="tasks" label="Tareas" />}
                {project && <TabButton tabName="comments" label="Comentarios" />}
                {project && <TabButton tabName="attachments" label="Archivos" />}
                {project && <TabButton tabName="history" label="Historial" />}
            </div>
        </div>
        
        {activeTab === 'details' && (
            <ProjectDetailsTab
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                setField={setField}
                isReadOnly={isReadOnly}
                userVisibleDepartments={userVisibleDepartments}
                users={users}
                project={project}
            />
        )}
        {activeTab === 'tasks' && project && (
            <ProjectTasksTab
                project={project}
                tasks={tasks}
                setTasks={setTasks}
                loadingData={loadingData}
            />
        )}
        {activeTab === 'comments' && project && (
            <ProjectCommentsTab
                project={project}
                comments={comments}
                setComments={setComments}
                loadingData={loadingData}
            />
        )}
        {activeTab === 'attachments' && project && (
            <ProjectAttachmentsTab projectId={project.id} />
        )}
        {activeTab === 'history' && (
            <ProjectHistoryTab
                history={history}
                loadingData={loadingData}
                users={users}
            />
        )}
        
        <div className="mt-6 flex justify-between items-center">
            <div className="flex space-x-2">
                {project && canEditProject && (
                    <>
                        <Button variant="secondary" onClick={handleDuplicate}>
                            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
                            Duplicar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <TrashIcon className="w-5 h-5 mr-2" />
                            Eliminar
                        </Button>
                    </>
                )}
            </div>
            <div className="flex space-x-3">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                {!isReadOnly && (
                    <Button onClick={handleSave} disabled={!canEditProject}>
                        {project ? 'Guardar Cambios' : 'Crear Proyecto'}
                    </Button>
                )}
            </div>
        </div>
    </Modal>
  );
};

export default ProjectModal;