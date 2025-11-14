import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { SunIcon, MoonIcon } from '../icons/Icons';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppContext();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-dark-card dark:hover:text-gray-300"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-6 h-6" />
      ) : (
        <SunIcon className="w-6 h-6" />
      )}
    </button>
  );
};

export default ThemeToggle;
