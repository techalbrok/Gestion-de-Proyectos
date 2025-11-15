import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ToastMessage, ConfirmationOptions } from '../types';

type Theme = 'light' | 'dark';

interface UIContextType {
  view: string;
  setView: (view: string) => void;
  initialDepartmentFilter: string | null;
  setInitialDepartmentFilter: (departmentId: string | null) => void;
  viewingDepartmentId: string | null;
  setViewingDepartmentId: (departmentId: string | null) => void;
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
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [view, setView] = useState('dashboard');
  const [initialDepartmentFilter, setInitialDepartmentFilter] = useState<string | null>(null);
  const [viewingDepartmentId, setViewingDepartmentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const [projectToOpen, setProjectToOpen] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    // Default to light mode, only use dark if explicitly set in localStorage.
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  
  const showConfirmation = useCallback((options: ConfirmationOptions) => setConfirmation(options), []);
  const hideConfirmation = useCallback(() => setConfirmation(null), []);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const value = useMemo(() => ({
      view, setView,
      initialDepartmentFilter, setInitialDepartmentFilter,
      viewingDepartmentId, setViewingDepartmentId,
      toasts, addToast, removeToast,
      confirmation, showConfirmation, hideConfirmation,
      projectToOpen, setProjectToOpen,
      theme, toggleTheme,
      isSidebarOpen, toggleSidebar, closeSidebar,
  }), [
    view,
    initialDepartmentFilter,
    viewingDepartmentId,
    toasts, addToast, removeToast,
    confirmation, showConfirmation, hideConfirmation,
    projectToOpen,
    theme, toggleTheme,
    isSidebarOpen, toggleSidebar, closeSidebar
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};