import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

type AuthView = 'signin' | 'forgot-password';

interface AuthContextType {
  session: Session | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  register: (fullName: string, email: string, password?: string) => Promise<void>;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  authToasts: Array<{id: string, message: string, type: 'success' | 'error'}>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session) {
          setSession(session);
          try {
            const profile = await api.fetchUserProfile(session.user.id);
            if (mounted) {
              setCurrentUser(profile);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error("Error loading profile:", error);
            if (mounted) {
              await supabase.auth.signOut();
              setSession(null);
              setCurrentUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          setSession(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (!mounted) return;

        if (session) {
          setSession(session);
          try {
            const profile = await api.fetchUserProfile(session.user.id);
            if (mounted) {
              setCurrentUser(profile);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error("Error loading profile on auth change:", error);
            if (mounted) {
              setCurrentUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          setSession(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  const login = useCallback(async (email: string, password?: string) => {
    try {
      await api.login(email, password);
      addToast('Inicio de sesión exitoso. ¡Bienvenido!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error al iniciar sesión.', 'error');
      throw error;
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, password?: string) => {
    try {
      await api.register(fullName, email, password);
      addToast('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error en el registro.', 'error');
      throw error;
    }
  }, []);
  
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await api.requestPasswordReset(email);
      addToast('Si existe una cuenta, se ha enviado un enlace de recuperación.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error al solicitar la recuperación.', 'error');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
      setAuthView('signin');
      addToast('Sesión cerrada correctamente.', 'success');
    } catch (error: any) {
      console.error('Error during logout:', error);
      setAuthView('signin');
      if (error.message && !error.message.includes('session_not_found')) {
        addToast('Error al cerrar sesión.', 'error');
      } else {
        addToast('Sesión cerrada correctamente.', 'success');
      }
    }
  }, []);

  const value = useMemo(() => ({
    session,
    currentUser,
    isAuthenticated,
    login,
    logout,
    register,
    requestPasswordReset,
    authView,
    setAuthView,
    setCurrentUser,
    authToasts: toasts
  }), [session, currentUser, isAuthenticated, login, logout, register, requestPasswordReset, authView, toasts]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};