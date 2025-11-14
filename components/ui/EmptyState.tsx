
import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action }) => {
  return (
    <div className="text-center bg-gray-50 dark:bg-dark-card/50 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg p-12 w-full">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
