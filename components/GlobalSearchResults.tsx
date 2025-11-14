
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Project, Department, User } from '../types';
import { ClipboardListIcon, BuildingLibraryIcon, UsersIcon } from './icons/Icons';

type SearchResult = (Project & { type: 'project' }) | (Department & { type: 'department' }) | (User & { type: 'user' });

interface GlobalSearchResultsProps {
  results: SearchResult[];
  query: string;
  onClose: () => void;
}

const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-bold text-primary dark:text-red-400">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};


const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ results, query, onClose }) => {
  const { setView, setProjectToOpen, setViewingDepartmentId } = useAppContext();

  const handleProjectClick = (projectId: string) => {
    setView('projects');
    setProjectToOpen(projectId);
    onClose();
  };

  const handleDepartmentClick = (departmentId: string) => {
    setView('department-projects');
    setViewingDepartmentId(departmentId);
    onClose();
  };

  const handleUserClick = (userId: string) => {
    setView('users');
    // Potentially highlight the user in the future
    onClose();
  };
  
  const groupedResults = results.reduce((acc, item) => {
    (acc[item.type] = acc[item.type] || []).push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const renderResultItem = (item: SearchResult) => {
    switch(item.type) {
      case 'project':
        return (
          <button onClick={() => handleProjectClick(item.id)} className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg">
            <ClipboardListIcon className="w-5 h-5 mr-3 text-gray-500" />
            <Highlight text={item.title} highlight={query} />
          </button>
        );
      case 'department':
        return (
          <button onClick={() => handleDepartmentClick(item.id)} className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg">
            <BuildingLibraryIcon className="w-5 h-5 mr-3 text-gray-500" />
            <Highlight text={item.name} highlight={query} />
          </button>
        );
      case 'user':
        return (
          <button onClick={() => handleUserClick(item.id)} className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg">
            <UsersIcon className="w-5 h-5 mr-3 text-gray-500" />
            <Highlight text={item.full_name} highlight={query} />
          </button>
        );
      default:
        return null;
    }
  }

  const sections = [
    { title: 'Proyectos', key: 'project', data: groupedResults.project },
    { title: 'Departamentos', key: 'department', data: groupedResults.department },
    { title: 'Usuarios', key: 'user', data: groupedResults.user },
  ];

  return (
    <div className="absolute top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-dark-border z-20">
      {results.length > 0 ? (
        <div className="p-2">
            {sections.map(section => section.data && section.data.length > 0 && (
                <div key={section.key} className="mb-2">
                    <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</h4>
                    <ul>
                        {section.data.map(item => (
                            <li key={item.id}>{renderResultItem(item)}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-gray-500">
          No se encontraron resultados para "{query}"
        </div>
      )}
    </div>
  );
};

export default GlobalSearchResults;
