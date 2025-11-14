import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ProjectStage, Priority, Comment, User, Department, UserRole, ProjectHistory } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';
import Avatar from './ui/Avatar';
import { PaperAirplaneIcon, ClockIcon, TrashIcon } from './icons/Icons';
import { LoadingSpinner } from './icons/Icons';
import { projectSchema } from '../utils/validationSchemas';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const { departments, users, currentUser, userDepartments, addProject, updateProject, deleteProject, getComments, getHistory, addComment, showConfirmation } = useAppContext();
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  
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


  useEffect(() => {
    if (project) {
      setFormData(project);
      setLoadingData(true);
      Promise.all([
        getComments(project.id),
        getHistory(project.id)
      ]).then(([commentsData, historyData]) => {
        setComments(commentsData);
        setHistory(historyData);
      }).finally(() => setLoadingData(false));
    } else {
      setFormData({
        title: '',
        description: '',
        stage: ProjectStage.PENDING,
        priority: Priority.MEDIUM,
        members: [],
        department_id: userVisibleDepartments[0]?.id || '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: null
      });
    }
    setErrors({});
  }, [project, getComments, getHistory, userVisibleDepartments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(errors[name]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
  };

  const handleMemberChange = (selectedUser: User) => {
    if (isReadOnly) return;
    setFormData(prev => {
        const currentMembers = prev.members || [];
        const isMember = currentMembers.includes(selectedUser.id);
        if (isMember) {
            return {...prev, members: currentMembers.filter(id => id !== selectedUser.id)};
        } else {
            return {...prev, members: [...currentMembers, selectedUser.id]};
        }
    });
  }

  const handleSave = async () => {
    if (isReadOnly) return;

    const validationResult = projectSchema.safeParse(formData);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.flatten().fieldErrors;
      const errorMap: Record<string, string> = {};
      for (const key in formattedErrors) {
          errorMap[key] = formattedErrors[key as keyof typeof formattedErrors]?.[0] || 'Error de validación';
      }
      setErrors(errorMap);
      return;
    }
    setErrors({});

    if (project) {
        await updateProject(formData as Project);
    } else {
        await addProject(formData as Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count'>);
    }
    onClose();
  }
  
  const handleAddComment = async () => {
    if (project && newComment.trim() && !isSubmittingComment) {
        const content = newComment.trim();
        setIsSubmittingComment(true);
        setNewComment('');
        try {
            await addComment(project.id, content);
            const updatedComments = await getComments(project.id);
            setComments(updatedComments);
        } catch (error) {
            console.error('Failed to add comment:', error);
            // Restore content if submission fails
            setNewComment(content);
        } finally {
            setIsSubmittingComment(false);
        }
    }
  };

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
  
  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  const renderDetailsTab = () => (
    <div className="space-y-6">
        <Input label="Título del Proyecto" name="title" value={formData.title || ''} onChange={handleChange} disabled={isReadOnly} error={errors.title} />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-dark-card dark:border-dark-border focus:ring-primary focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed" disabled={isReadOnly}></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Departamento" name="department_id" value={formData.department_id || ''} onChange={handleChange} disabled={isReadOnly || !!project} error={errors.department_id}>
                {userVisibleDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Prioridad" name="priority" value={formData.priority || ''} onChange={handleChange} disabled={isReadOnly} error={errors.priority}>
                {Object.values(Priority).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
            </Select>
            <Input label="Fecha de Inicio" name="start_date" type="date" value={typeof formData.start_date === 'string' ? formData.start_date.split('T')[0] : ''} onChange={handleChange} disabled={isReadOnly} error={errors.start_date} />
            <Input label="Fecha Límite" name="due_date" type="date" value={typeof formData.due_date === 'string' ? formData.due_date.split('T')[0] : ''} onChange={handleChange} disabled={isReadOnly} error={errors.due_date} />
            <Select label="Etapa" name="stage" value={formData.stage || ''} onChange={handleChange} disabled={isReadOnly} error={errors.stage}>
                {Object.values(ProjectStage).map(s => <option key={s} value={s}>{STAGE_CONFIG[s].title}</option>)}
            </Select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Miembros Asignados</label>
            <div className="flex flex-wrap gap-2">
                {users.map(user => (
                    <div key={user.id} onClick={() => handleMemberChange(user)} className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.members?.includes(user.id) ? 'bg-red-100 dark:bg-primary/20 ring-2 ring-primary' : 'bg-gray-100 dark:bg-dark-card'}`}>
                        <Avatar user={user} size="sm" />
                        <span className="text-sm">{user.full_name}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
  
  const renderCommentsTab = () => (
      <div className="flex flex-col h-96">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {loadingData ? <LoadingSpinner/> : comments.map(comment => {
                const user = getUserById(comment.user_id);
                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                      <Avatar user={user} size="md" />
                      <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-dark-card rounded-lg p-3">
                              <p className="text-sm font-semibold">{user?.full_name}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                  </div>
                )
            })}
        </div>
        <div className="mt-4 flex items-center space-x-2">
            <Avatar user={currentUser} size="md" />
            <div className="relative flex-1">
                <Input placeholder="Escribe un comentario..." value={newComment} onChange={e => setNewComment(e.target.value)} className="pr-10" />
                <button 
                  onClick={handleAddComment} 
                  disabled={isSubmittingComment} 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmittingComment ? <LoadingSpinner className="w-5 h-5"/> : <PaperAirplaneIcon className="w-5 h-5"/>}
                </button>
            </div>
        </div>
      </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {loadingData ? <LoadingSpinner/> : history.map(entry => {
        const user = getUserById(entry.changed_by);
        return (
          <div key={entry.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 pt-1">
              <ClockIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{user?.full_name || 'Usuario'}</span> cambió la etapa
                {entry.previous_stage && <> de <span className={`font-semibold ${STAGE_CONFIG[entry.previous_stage]?.color} text-white px-1.5 py-0.5 rounded`}>{STAGE_CONFIG[entry.previous_stage]?.title}</span></>}
                &nbsp;a <span className={`font-semibold ${STAGE_CONFIG[entry.new_stage]?.color} text-white px-1.5 py-0.5 rounded`}>{STAGE_CONFIG[entry.new_stage]?.title}</span>.
              </p>
              <p className="text-xs text-gray-500 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );


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
                {project && <TabButton tabName="comments" label="Comentarios" />}
                {project && <TabButton tabName="history" label="Historial" />}
            </div>
        </div>
        
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'comments' && renderCommentsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        
        <div className="mt-6 flex justify-between items-center">
            <div>
                {project && canEditProject && (
                    <Button variant="destructive" onClick={handleDelete}>
                        <TrashIcon className="w-5 h-5 mr-2" />
                        Eliminar Proyecto
                    </Button>
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