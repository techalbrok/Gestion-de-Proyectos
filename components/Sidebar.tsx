
import React from 'react';
import { ClipboardListIcon, UsersIcon, BuildingLibraryIcon, ChartPieIcon, Cog6ToothIcon, QuestionMarkCircleIcon, CalendarDaysIcon, UserCircleIcon } from './icons/Icons';
import { useAppContext } from '../hooks/useAppContext';

const Sidebar: React.FC = () => {
  const { view, setView, isSidebarOpen, closeSidebar } = useAppContext();

  const navItems = [
    { id: 'dashboard', icon: ChartPieIcon, label: 'Dashboard' },
    { id: 'projects', icon: ClipboardListIcon, label: 'Proyectos' },
    { id: 'calendar', icon: CalendarDaysIcon, label: 'Calendario' },
    { id: 'users', icon: UsersIcon, label: 'Usuarios' },
    { id: 'departments', icon: BuildingLibraryIcon, label: 'Departamentos' },
  ];

  const secondaryNavItems = [
    { id: 'profile', icon: UserCircleIcon, label: 'Mi Perfil' },
    { id: 'settings', icon: Cog6ToothIcon, label: 'Configuración' },
    { id: 'help', icon: QuestionMarkCircleIcon, label: 'Ayuda' },
  ];

  const handleLinkClick = (id: string) => {
    setView(id);
    closeSidebar();
  };

  const NavLink: React.FC<{ icon: React.ElementType, label: string, id: string }> = ({ icon: Icon, label, id }) => (
    <button
      onClick={() => handleLinkClick(id)}
      className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-left ${
        view === id
          ? 'bg-primary text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-card'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span>{label}</span>
    </button>
  );

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-dark-border">
        <img src="/images/logo_albrok_rojo_transp.png" alt="Albroxfera Logo" className="h-8 block dark:hidden" />
        <img src="/images/logo_albrok_blanco_transp.png" alt="Albroxfera Logo" className="h-8 hidden dark:block" />
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => <NavLink key={item.id} {...item} />)}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200 dark:border-dark-border">
         <div className="space-y-2">
            {secondaryNavItems.map(item => <NavLink key={item.id} {...item} />)}
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
