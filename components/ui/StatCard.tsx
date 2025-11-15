import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: 'dashboard' | 'department';
  color?: string; // For dashboard variant's icon background
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, variant = 'dashboard', color = 'bg-primary' }) => {
  
  // Department-specific style
  if (variant === 'department') {
    return (
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="bg-red-100 dark:bg-primary/20 p-3 rounded-full">
            <Icon className="w-6 h-6 text-primary dark:text-red-300" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    );
  }

  // Dashboard style (default)
  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};

export default StatCard;