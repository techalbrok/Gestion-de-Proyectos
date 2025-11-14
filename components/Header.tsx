
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { BellIcon, SearchIcon, ChevronDownIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon } from './icons/Icons';
import Avatar from './ui/Avatar';
import GlobalSearchResults from './GlobalSearchResults';
import { Project, Department, User } from '../types';
import ThemeToggle from './ui/ThemeToggle';
import NotificationsPanel from './NotificationsPanel';

type SearchResult = (Project & { type: 'project' }) | (Department & { type: 'department' }) | (User & { type: 'user' });

const Header: React.FC = () => {
  const { currentUser, setView, logout, projects, departments, users, toggleSidebar, notifications, markAllNotificationsAsRead } = useAppContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (view: string) => {
    setView(view);
    setIsDropdownOpen(false);
  }

  const handleToggleNotifications = () => {
    setIsNotificationsOpen(prev => {
        if (!prev && unreadCount > 0) {
            markAllNotificationsAsRead();
        }
        return !prev;
    });
  }

  const performSearch = useCallback((query: string) => {
    if (query.length < 2) {
        setSearchResults([]);
        return;
    }
    const lowerCaseQuery = query.toLowerCase();
    
    const filteredProjects = projects
        .filter(p => p.title.toLowerCase().includes(lowerCaseQuery))
        .map(p => ({ ...p, type: 'project' as const }));
        
    const filteredDepartments = departments
        .filter(d => d.name.toLowerCase().includes(lowerCaseQuery))
        .map(d => ({ ...d, type: 'department' as const }));

    const filteredUsers = users
        .filter(u => u.full_name.toLowerCase().includes(lowerCaseQuery))
        .map(u => ({ ...u, type: 'user' as const }));
        
    setSearchResults([...filteredProjects, ...filteredDepartments, ...filteredUsers]);
  }, [projects, departments, users]);

  useEffect(() => {
      const handler = setTimeout(() => {
          performSearch(searchQuery);
      }, 300); // Debounce search

      return () => {
          clearTimeout(handler);
      };
  }, [searchQuery, performSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setShowSearchResults(true);
  }

  const closeSearch = () => {
      setShowSearchResults(false);
      setSearchQuery('');
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center flex-1 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-dark-card focus:outline-none"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-xs" ref={searchRef}>
          <SearchIcon className="absolute w-5 h-5 text-gray-400 top-2.5 left-3" />
          <input
            type="text"
            placeholder="Buscar proyectos, usuarios..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSearchResults(true)}
            className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 border border-transparent rounded-lg dark:bg-dark-card dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {showSearchResults && searchQuery.length > 0 && (
              <GlobalSearchResults 
                results={searchResults} 
                query={searchQuery} 
                onClose={closeSearch}
              />
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <div className="relative" ref={notificationsRef}>
            <button 
                onClick={handleToggleNotifications}
                className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-dark-card dark:hover:text-gray-300"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5">
                        <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
                        <span className="relative inline-flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>
            {isNotificationsOpen && (
                <NotificationsPanel
                    notifications={notifications}
                    onClose={() => setIsNotificationsOpen(false)}
                />
            )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 cursor-pointer">
            {currentUser && (
              <>
                <Avatar user={currentUser} size="md" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentUser.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg dark:bg-dark-card ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                <button onClick={() => handleNavigation('profile')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-bg">
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  Mi Perfil
                </button>
                <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-bg">
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;