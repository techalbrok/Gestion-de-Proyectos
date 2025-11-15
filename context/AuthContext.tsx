import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import { useUI } from '../hooks/useUI';

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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [loading, setLoading] = useState(true);

  // We need addToast for login/logout messages
  const { addToast } = useUI();

  const handleLogoutAndError = useCallback(async (errorMessage: string) => {
      addToast(errorMessage, 'error');
      await api.logout();
      setCurrentUser(null);
      setSession(null);
      setIsAuthenticated(false);
  }, [addToast]);

  useEffect(() => {
    const fetchAndSetUserProfile = async (session: Session) => {
        try {
            const profile = await api.fetchUserProfile(session.user.id);
            setCurrentUser(profile);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Critical error: User authenticated but profile not found. Logging out.", error);
            handleLogoutAndError("Error al cargar tu perfil. Se cerrará la sesión.");
        }
    }

    // Initial session check.
    // This is wrapped in an async IIFE to handle promises cleanly and ensure
    // the loading state is always set to false.
    (async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                await fetchAndSetUserProfile(session);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Error fetching initial session:", error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    })();


    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchAndSetUserProfile(session);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleLogoutAndError]);
  
  const login = useCallback(async (email: string, password?: string) => {
    try {
        await api.login(email, password);
        addToast('Inicio de sesión exitoso. ¡Bienvenido!', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error al iniciar sesión.', 'error');
        throw error;
    }
  }, [addToast]);

  const register = useCallback(async (fullName: string, email: string, password?: string) => {
    try {
        await api.register(fullName, email, password);
        addToast('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error en el registro.', 'error');
        throw error;
    }
  }, [addToast]);
  
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
        await api.requestPasswordReset(email);
        addToast('Si existe una cuenta, se ha enviado un enlace de recuperación.', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error al solicitar la recuperación.', 'error');
        throw error;
    }
  }, [addToast]);

  const logout = useCallback(async () => {
    await api.logout();
    setAuthView('signin');
    addToast('Sesión cerrada correctamente.', 'success');
  }, [addToast]);

  const value = useMemo(() => ({
    session, currentUser, isAuthenticated,
    login, logout, register, requestPasswordReset,
    authView, setAuthView,
    setCurrentUser
  }), [session, currentUser, isAuthenticated, login, logout, register, requestPasswordReset, authView]);

  if (loading) {
      return null; // Or a loading spinner for the whole app
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};