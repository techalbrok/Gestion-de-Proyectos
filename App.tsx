import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectBoard from './components/ProjectBoard';
import UsersPage from './components/UsersPage';
import Dashboard from './components/Dashboard';
import DepartmentsPage from './components/DepartmentsPage';
import CalendarPage from './components/CalendarPage';
import ProfilePage from './components/ProfilePage';
import DepartmentProjectsPage from './components/DepartmentProjectsPage';
import MyTasksPage from './components/MyTasksPage';
import AuthPage from './components/AuthPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import { LoadingSpinner } from './components/icons/Icons';
import Toast from './components/ui/Toast';
import ConfirmationModal from './components/ui/ConfirmationModal';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { useUI } from './hooks/useUI';

const App: React.FC = () => {
  const { isAuthenticated, authView, authToasts } = useAuth();
  const { loading } = useData();
  const { view, toasts, removeToast, confirmation, hideConfirmation, isSidebarOpen, closeSidebar } = useUI();

  if (!isAuthenticated) {
    if (authView === 'forgot-password') {
      return <ForgotPasswordPage />;
    }
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (view) {
      case 'projects':
        return <ProjectBoard />;
      case 'users':
        return <UsersPage />;
      case 'dashboard':
        return <Dashboard />;
      case 'departments':
        return <DepartmentsPage />;
      case 'department-projects':
        return <DepartmentProjectsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'my-tasks':
        return <MyTasksPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <div className="flex h-screen text-gray-800 dark:text-gray-200">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-dark-bg/50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner className="w-12 h-12" />
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>
      {/* Toast Container */}
      <div
        aria-live="assertive"
        className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
      >
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {/* Auth toasts for login/logout messages */}
          {authToasts && authToasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => {}} // Auth toasts auto-remove
            />
          ))}
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmation && (
        <ConfirmationModal
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={() => {
            confirmation.onConfirm();
            hideConfirmation();
          }}
          onCancel={hideConfirmation}
          confirmText={confirmation.confirmText || 'Confirmar'}
        />
      )}
    </>
  );
};

export default App;