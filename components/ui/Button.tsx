import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "border-transparent bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:bg-primary/70",
    secondary: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-card dark:text-gray-200 dark:border-dark-border dark:hover:bg-gray-700 focus:ring-primary",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-600/70",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};

export default Button;