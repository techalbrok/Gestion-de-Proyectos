import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project, User, Department, ProjectStage, Comment, UserDepartment, ProjectHistory, RecentHistoryEntry, ToastMessage, ConfirmationOptions, Notification } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

type AuthView = 'signin' | 'forgot-password';
type Theme = 'light' | 'dark';

interface AppContextType {
  loading: boolean;
  projects: Project[];
  users: User[];
  departments: Department[];
  userDepartments: UserDepartment[];
  currentUser: User | null;
  view: string;
  setView: (view: string) => void;
  updateProjectStage: (projectId: string, newStage: ProjectStage) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  uploadUserAvatar: (file: File) => Promise<void>;
  addDepartment: (deptData: Omit<Department, 'id'>) => Promise<Department | void>;
  updateDepartment: (deptData: Department) => Promise<void>;
  deleteDepartment: (deptId: string) => Promise<void>;
  updateDepartmentMembers: (departmentId: string, memberIds: string[]) => Promise<void>;
  getComments: (projectId: string) => Promise<Comment[]>;
  getHistory: (projectId: string) => Promise<ProjectHistory[]>;
  addComment: (projectId: string, content: string) => Promise<void>;
  initialDepartmentFilter: string | null;
  setInitialDepartmentFilter: (departmentId: string | null) => void;
  viewingDepartmentId: string | null;
  setViewingDepartmentId: (departmentId: string | null) => void;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  register: (fullName: string, email: string, password?: string) => Promise<void>;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  recentHistory: RecentHistoryEntry[];
  toasts: ToastMessage[];
  addToast: (message: string, type: 'success' | 'error') => void;
  removeToast: (id: string) => void;
  confirmation: ConfirmationOptions | null;
  showConfirmation: (options: ConfirmationOptions) => void;
  hideConfirmation: () => void;
  projectToOpen: string | null;
  setProjectToOpen: (projectId: string | null) => void;
  theme: Theme;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  notifications: Notification[];
  markAllNotificationsAsRead: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('dashboard');
  const [initialDepartmentFilter, setInitialDepartmentFilter] = useState<string | null>(null);
  const [viewingDepartmentId, setViewingDepartmentId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [recentHistory, setRecentHistory] = useState<RecentHistoryEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const [projectToOpen, setProjectToOpen] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const showConfirmation = (options: ConfirmationOptions) => {
    setConfirmation(options);
  };

  const hideConfirmation = () => {
    setConfirmation(null);
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (!session) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (_event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setProjects([]);
        setUsers([]);
        setDepartments([]);
        setUserDepartments([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !session) return;
    setLoading(true);
    try {
      const userProfile = await api.fetchUserProfile(session.user.id);
      setCurrentUser(userProfile);

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
    } catch (error) {
      console.error("Failed to fetch initial data", error);
      addToast('Error al cargar los datos de la aplicación.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, session]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                // Refetch all notifications to get joined data correctly and ensure order
                const newNotifications = await api.fetchNotifications();
                setNotifications(newNotifications);
                addToast('Tienes una nueva notificación', 'success');
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const login = async (email: string, password?: string) => {
    try {
        await api.login(email, password);
        addToast('Inicio de sesión exitoso. ¡Bienvenido!', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error al iniciar sesión.', 'error');
        throw error;
    }
  };

  const register = async (fullName: string, email: string, password?: string) => {
    try {
        await api.register(fullName, email, password);
        addToast('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error en el registro.', 'error');
        throw error;
    }
  };
  
  const requestPasswordReset = async (email: string) => {
    try {
        await api.requestPasswordReset(email);
        addToast('Si existe una cuenta, se ha enviado un enlace de recuperación.', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error al solicitar la recuperación.', 'error');
        throw error;
    }
  };

  const logout = async () => {
    await api.logout();
    setView('dashboard');
    setAuthView('signin');
    addToast('Sesión cerrada correctamente.', 'success');
  };

  const updateProjectStage = async (projectId: string, newStage: ProjectStage) => {
    if (!currentUser) return;
    try {
      await api.updateProjectStage(projectId, newStage, currentUser.id);
      setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? { ...p, stage: newStage } : p));
      addToast('Etapa del proyecto actualizada.', 'success');
    } catch (error) {
      addToast('No se pudo actualizar la etapa del proyecto.', 'error');
    }
  };
  
  const getHistory = async (projectId: string) => {
    return api.fetchProjectHistory(projectId);
  }

  const addProject = async (projectData: Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count'>) => {
    if (!currentUser) return;
    try {
      const newProject = await api.addProject(projectData, currentUser.id);
      setProjects(prev => [...prev, { ...newProject, history: [] }]);
      addToast('Proyecto creado exitosamente.', 'success');
    } catch(e) {
      addToast('Error al crear el proyecto.', 'error');
    }
  };
  
  const updateProject = async (projectData: Project) => {
    if (!currentUser) return;
    try {
      const updatedProject = await api.updateProject(projectData);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      addToast('Proyecto actualizado correctamente.', 'success');
    } catch(e) {
      addToast('Error al actualizar el proyecto.', 'error');
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      addToast('Proyecto eliminado correctamente.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error al eliminar el proyecto.', 'error');
      throw error;
    }
  };

  const updateUser = async (userData: User) => {
    try {
      const updatedUser = await api.updateUser(userData);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
      addToast('Usuario actualizado.', 'success');
    } catch (error) {
      addToast('Error al actualizar el usuario.', 'error');
      throw error;
    }
  };

  const uploadUserAvatar = async (file: File) => {
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
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addToast('Usuario eliminado correctamente.', 'success');
    } catch (error) {
      addToast('Error al eliminar el usuario.', 'error');
    }
  };

  const addDepartment = async (deptData: Omit<Department, 'id'>): Promise<Department | void> => {
    try {
      const newDept = await api.addDepartment(deptData);
      setDepartments(prev => [...prev, newDept]);
      addToast('Departamento creado.', 'success');
      return newDept;
    } catch(e) {
      addToast('Error al crear el departamento.', 'error');
      throw e;
    }
  };
  
  const updateDepartment = async (deptData: Department) => {
    try {
      const updatedDept = await api.updateDepartment(deptData);
      setDepartments(prev => prev.map(d => d.id === updatedDept.id ? updatedDept : d));
      addToast('Departamento actualizado.', 'success');
    } catch(e) {
      addToast('Error al actualizar el departamento.', 'error');
    }
  };

  const deleteDepartment = async (deptId: string) => {
    try {
      await api.deleteDepartment(deptId);
      setDepartments(prev => prev.filter(d => d.id !== deptId));
      setUserDepartments(prev => prev.filter(ud => ud.department_id !== deptId));
      addToast('Departamento eliminado.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error al eliminar el departamento. Asegúrate de que no tenga proyectos asignados.', 'error');
    }
  };

  const updateDepartmentMembers = async (departmentId: string, memberIds: string[]) => {
    try {
      await api.updateDepartmentMembers(departmentId, memberIds);
      const updatedUserDepartments = await api.fetchUserDepartments();
      setUserDepartments(updatedUserDepartments);
      addToast('Miembros del departamento actualizados.', 'success');
    } catch(error) {
      addToast('Error al actualizar los miembros.', 'error');
    }
  };

  const getComments = async (projectId: string) => {
    return api.fetchComments(projectId);
  }

  const addComment = async (projectId: string, content: string): Promise<void> => {
    if (!currentUser) return;
    try {
      await api.addComment(projectId, content, currentUser.id);
      // Increment comment count locally for instant UI update
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === projectId 
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      addToast('No se pudo agregar el comentario.', 'error');
      throw error;
    }
  }

  const markAllNotificationsAsRead = async () => {
    await api.markAllAsRead();
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
  }

  return (
    <AppContext.Provider value={{ 
        loading, projects, users, departments, userDepartments, currentUser, 
        view, setView, updateProjectStage, addProject, updateProject, deleteProject,
        updateUser, deleteUser, uploadUserAvatar,
        getComments, addComment, addDepartment, updateDepartment, deleteDepartment,
        getHistory,
        updateDepartmentMembers,
        initialDepartmentFilter, setInitialDepartmentFilter,
        viewingDepartmentId, setViewingDepartmentId,
        isAuthenticated, login, logout, register,
        authView, setAuthView, requestPasswordReset,
        recentHistory,
        toasts, addToast, removeToast,
        confirmation, showConfirmation, hideConfirmation,
        projectToOpen, setProjectToOpen,
        theme, toggleTheme,
        isSidebarOpen, toggleSidebar, closeSidebar,
        notifications, markAllNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};