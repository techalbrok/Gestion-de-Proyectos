import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '../icons/Icons';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setShow(true);

    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(id), 300); // Allow for fade-out animation
  };

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50 dark:bg-green-900/50' : 'bg-red-50 dark:bg-red-900/50';
  const borderColor = isSuccess ? 'border-green-400 dark:border-green-600' : 'border-red-400 dark:border-red-600';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';

  return (
    <div
      className={`relative w-full max-w-sm p-4 my-2 overflow-hidden border-l-4 rounded-md shadow-lg ${bgColor} ${borderColor} transition-all duration-300 ease-in-out transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <CheckCircleIcon className={`w-6 h-6 ${iconColor}`} />
          ) : (
            <ExclamationTriangleIcon className={`w-6 h-6 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${isSuccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {message}
          </p>
        </div>
        <div className="pl-3 ml-auto">
            <button
                onClick={handleClose}
                className={`p-1 rounded-md -mx-1.5 -my-1.5 ${isSuccess ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-800/50' : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50' } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;