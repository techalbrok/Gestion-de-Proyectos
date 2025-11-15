import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo, useContext } from 'react';
import { Project, User, Department, ProjectStage, Comment, UserDepartment, ProjectHistory, RecentHistoryEntry, Notification, Task } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { AuthContext } from './AuthContext';
import { UIContext } from './UIContext';

interface DataContextType {
  loading: boolean;
  projects: Project[];
  users: User[];
  departments: Department[];
  userDepartments: UserDepartment[];
  recentHistory: RecentHistoryEntry[];
  notifications: Notification[];
  updateProjectStage: (projectId: string, newStage: ProjectStage) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count' | 'tasks_count'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  uploadUserAvatar: (file: File) => Promise<void>;
  addDepartment: (deptData: Omit<Department, 'id'>) => Promise<Department>;
  updateDepartment: (deptData: Department) => Promise<void>;
  deleteDepartment: (deptId: string) => Promise<void>;
  updateDepartmentMembers: (departmentId: string, memberIds: string[]) => Promise<void>;
  getComments: (projectId: string) => Promise<Comment[]>;
  getHistory: (projectId: string) => Promise<ProjectHistory[]>;
  addComment: (projectId: string, content: string) => Promise<Comment>;
  markAllNotificationsAsRead: () => Promise<void>;
  // Task Functions
  getTasks: (projectId: string) => Promise<Task[]>;
  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'created_by' | 'project_id'>, projectId: string) => Promise<Task>;
  updateTask: (taskId: string, updateData: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (taskId: string, projectId: string) => Promise<void>;
  // Archived projects
  loadArchivedProjects: () => Promise<void>;
  archivedProjectsLoaded: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const uiContext = useContext(UIContext);

  if (!authContext) {
    throw new Error('DataProvider must be used within AuthProvider');
  }
  if (!uiContext) {
    throw new Error('DataProvider must be used within UIProvider');
  }

  const { isAuthenticated, currentUser, setCurrentUser } = authContext;
  const { addToast } = uiContext;

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [recentHistory, setRecentHistory] = useState<RecentHistoryEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archivedProjectsLoaded, setArchivedProjectsLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setArchivedProjectsLoaded(false); // Reset on full refresh
    try {
      const [projectsData, usersData, departmentsData, userDepartmentsData, recentHistoryData, notificationsData] = await Promise.all([
        api.fetchProjects(),
        api.fetchUsers(),
        api.fetchDepartments(),
        api.fetchUserDepartments(),
        api.fetchRecentHistory(),
        api.fetchNotifications(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
      setDepartments(departmentsData);
      setUserDepartments(userDepartmentsData);
      setRecentHistory(recentHistoryData);
      setNotifications(notificationsData);
    } catch (error: any) {
      console.error("Failed to fetch initial data", error);
      addToast(error.message || 'Error al cargar los datos de la aplicación.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);


  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      // Clear data on logout to prevent flashing old data
      setProjects([]);
      setUsers([]);
      setDepartments([]);
      setUserDepartments([]);
      setRecentHistory([]);
      setNotifications([]);
      setArchivedProjectsLoaded(false);
      setLoading(false); // Stop loading on logout
    }
  }, [isAuthenticated, fetchData]);
  
  const loadArchivedProjects = useCallback(async () => {
    if (archivedProjectsLoaded) return;
    try {
        const archived = await api.fetchArchivedProjects();
        setProjects(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProjects = archived.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProjects];
        });
        setArchivedProjectsLoaded(true);
    } catch (error: any) {
        console.error('Error loading archived projects:', error);
        addToast(error.message || 'Error al cargar proyectos archivados.', 'error');
    }
  }, [addToast, archivedProjectsLoaded]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(`notifications:${currentUser.id}`)
        .on<Notification>(
            'postgres_changes',
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${currentUser.id}`
            },
            async () => {
                try {
                    const newNotifications = await api.fetchNotifications();
                    setNotifications(newNotifications);
                    addToast('Tienes una nueva notificación', 'success');
                } catch (error: any) {
                    console.error('Error fetching new notifications:', error);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUser, addToast]);

  const updateProjectStage = useCallback(async (projectId: string, newStage: ProjectStage) => {
    if (!currentUser) return;
    try {
      await api.updateProjectStage(projectId, newStage, currentUser, userDepartments);
      setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? { ...p, stage: newStage } : p));
      addToast('Etapa del proyecto actualizada.', 'success');
    } catch (error: any) {
      addToast(error.message || 'No se pudo actualizar la etapa del proyecto.', 'error');
    }
  }, [currentUser, userDepartments, addToast]);
  
  const getHistory = useCallback(async (projectId: string) => {
    return api.fetchProjectHistory(projectId);
  }, []);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count' | 'tasks_count'>) => {
    if (!currentUser) return;
    try {
      const newProject = await api.addProject(projectData, currentUser.id);
      setProjects(prev => [...prev, newProject]);
      addToast('Proyecto creado exitosamente.', 'success');
    } catch(e: any) {
      console.error('Error creating project:', e);
      addToast(e.message || 'Error al crear el proyecto.', 'error');
      throw e;
    }
  }, [currentUser, addToast]);
  
  const updateProject = useCallback(async (projectData: Project) => {
    if (!currentUser) return;
    try {
      const updatedProject = await api.updateProject(projectData, currentUser, userDepartments);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      addToast('Proyecto actualizado correctamente.', 'success');
    } catch(e: any) {
      console.error('Error updating project:', e);
      addToast(e.message || 'Error al actualizar el proyecto.', 'error');
      throw e;
    }
  }, [currentUser, userDepartments, addToast]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!currentUser) return;
    try {
      await api.deleteProject(projectId, currentUser, userDepartments);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      addToast('Proyecto eliminado correctamente.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error al eliminar el proyecto.', 'error');
      throw error;
    }
  }, [addToast, currentUser, userDepartments]);

  const updateUser = useCallback(async (userData: User) => {
    try {
      const updatedUser = await api.updateUser(userData);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
      addToast('Usuario actualizado.', 'success');
    } catch (error: any) {
      console.error('Error updating user:', error);
      addToast(error.message || 'Error al actualizar el usuario.', 'error');
      throw error;
    }
  }, [addToast, currentUser, setCurrentUser]);

  const uploadUserAvatar = useCallback(async (file: File) => {
    if (!currentUser) {
      addToast('Debes iniciar sesión para subir un avatar.', 'error');
      return;
    }
    try {
      const updatedUser = await api.uploadAvatar(file, currentUser.id);
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      addToast('Avatar actualizado correctamente.', 'success');
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      addToast(error.message || 'Error al subir el avatar.', 'error');
      throw error;
    }
  }, [addToast, currentUser, setCurrentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addToast('Usuario eliminado correctamente.', 'success');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      addToast(error.message || 'Error al eliminar el usuario.', 'error');
      throw error;
    }
  }, [addToast]);

  const addDepartment = useCallback(async (deptData: Omit<Department, 'id'>): Promise<Department> => {
    if (!currentUser) throw new Error("Authentication required.");
    try {
      const newDept = await api.addDepartment(deptData, currentUser);
      setDepartments(prev => [...prev, newDept]);
      addToast('Departamento creado.', 'success');
      return newDept;
    } catch(e: any) {
      console.error('Error creating department:', e);
      addToast(e.message || 'Error al crear el departamento.', 'error');
      throw e;
    }
  }, [addToast, currentUser]);
  
  const updateDepartment = useCallback(async (deptData: Department) => {
    if (!currentUser) return;
    try {
      const updatedDept = await api.updateDepartment(deptData, currentUser);
      setDepartments(prev => prev.map(d => d.id === updatedDept.id ? updatedDept : d));
      addToast('Departamento actualizado.', 'success');
    } catch(e: any) {
      console.error('Error updating department:', e);
      addToast(e.message || 'Error al actualizar el departamento.', 'error');
      throw e;
    }
  }, [addToast, currentUser]);

  const deleteDepartment = useCallback(async (deptId: string) => {
    if (!currentUser) return;
    try {
      await api.deleteDepartment(deptId, currentUser);
      setDepartments(prev => prev.filter(d => d.id !== deptId));
      setUserDepartments(prev => prev.filter(ud => ud.department_id !== deptId));
      addToast('Departamento eliminado.', 'success');
    } catch (error: any) {
      console.error('Error deleting department:', error);
      addToast(error.message || 'Error al eliminar el departamento. Asegúrate de que no tenga proyectos asignados.', 'error');
      throw error;
    }
  }, [addToast, currentUser]);

  const updateDepartmentMembers = useCallback(async (departmentId: string, memberIds: string[]) => {
    if (!currentUser) return;
    try {
      await api.updateDepartmentMembers(departmentId, memberIds, currentUser);
      const updatedUserDepartments = await api.fetchUserDepartments();
      setUserDepartments(updatedUserDepartments);
      addToast('Miembros del departamento actualizados.', 'success');
    } catch(error: any) {
      console.error('Error updating department members:', error);
      addToast(error.message || 'Error al actualizar los miembros.', 'error');
      throw error;
    }
  }, [addToast, currentUser]);

  const getComments = useCallback(async (projectId: string) => {
    return api.fetchComments(projectId);
  }, []);

  const addComment = useCallback(async (projectId: string, content: string): Promise<Comment> => {
    if (!currentUser) throw new Error("User not authenticated for commenting.");
    try {
      const newComment = await api.addComment(projectId, content, currentUser.id);
      // Increment comment count locally for instant UI update
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === projectId
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );
      return newComment;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      addToast(error.message || 'No se pudo agregar el comentario.', 'error');
      throw error;
    }
  }, [currentUser, addToast]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await api.markAllAsRead();
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      addToast(error.message || 'Error al marcar notificaciones como leídas.', 'error');
    }
  }, [addToast]);

  // --- Task Functions ---
  const getTasks = useCallback(async (projectId: string) => {
    return api.fetchTasks(projectId);
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'created_by' | 'project_id'>, projectId: string): Promise<Task> => {
      if (!currentUser) throw new Error("User not authenticated.");
      try {
          const newTaskPayload = { ...taskData, project_id: projectId, created_by: currentUser.id };
          const newTask = await api.addTask(newTaskPayload as Omit<Task, 'id' | 'created_at'>);
          // Increment task count locally
          setProjects(prevProjects =>
              prevProjects.map(p =>
                p.id === projectId
                  ? { ...p, tasks_count: (p.tasks_count || 0) + 1 }
                  : p
              )
          );
          addToast('Tarea añadida.', 'success');
          return newTask;
      } catch (error: any) {
          console.error('Error adding task:', error);
          addToast(error.message || 'No se pudo añadir la tarea.', 'error');
          throw error;
      }
  }, [currentUser, addToast]);

  const updateTask = useCallback(async (taskId: string, updateData: Partial<Omit<Task, 'id'>>) => {
      try {
          await api.updateTask(taskId, updateData);
          // No toast here to keep UI quiet for simple toggles.
      } catch (error: any) {
          console.error('Error updating task:', error);
          addToast(error.message || 'No se pudo actualizar la tarea.', 'error');
          throw error;
      }
  }, [addToast]);

  const deleteTask = useCallback(async (taskId: string, projectId: string) => {
      try {
          await api.deleteTask(taskId);
          // Decrement task count locally
          setProjects(prevProjects =>
              prevProjects.map(p =>
                p.id === projectId
                  ? { ...p, tasks_count: Math.max(0, (p.tasks_count || 1) - 1) }
                  : p
              )
          );
          addToast('Tarea eliminada.', 'success');
      } catch (error: any) {
          console.error('Error deleting task:', error);
          addToast(error.message || 'No se pudo eliminar la tarea.', 'error');
          throw error;
      }
  }, [addToast]);
  
  const value = useMemo(() => ({
    loading, projects, users, departments, userDepartments, recentHistory, notifications,
    updateProjectStage, addProject, updateProject, deleteProject,
    updateUser, deleteUser, uploadUserAvatar,
    getComments, addComment, addDepartment, updateDepartment, deleteDepartment,
    getHistory,
    updateDepartmentMembers,
    markAllNotificationsAsRead,
    getTasks, addTask, updateTask, deleteTask,
    loadArchivedProjects, archivedProjectsLoaded
  }), [
    loading, projects, users, departments, userDepartments, recentHistory, notifications,
    updateProjectStage, addProject, updateProject, deleteProject,
    updateUser, deleteUser, uploadUserAvatar,
    getComments, addComment, addDepartment, updateDepartment, deleteDepartment,
    getHistory,
    updateDepartmentMembers,
    markAllNotificationsAsRead,
    getTasks, addTask, updateTask, deleteTask,
    loadArchivedProjects, archivedProjectsLoaded
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};