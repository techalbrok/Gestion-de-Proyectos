import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  error?: string | null;
}

const Input: React.FC<InputProps> = ({ label, className, error, ...props }) => {
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  const defaultClasses = 'border-gray-300 dark:border-dark-border focus:ring-primary focus:border-primary';

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-gray-800 bg-white border rounded-md shadow-sm focus:outline-none ${error ? errorClasses : defaultClasses} dark:bg-dark-card dark:text-gray-200 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
