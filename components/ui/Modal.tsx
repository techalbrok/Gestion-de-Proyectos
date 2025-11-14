import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '../icons/Icons';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setShow(true);

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 200); // Match duration of animation
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-colors duration-200 ${show ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
      aria-modal="true" 
      role="dialog"
      onClick={handleClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white dark:bg-dark-bg rounded-lg shadow-xl flex flex-col transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-card">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;