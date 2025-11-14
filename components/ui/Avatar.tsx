import React from 'react';
import { User } from '../../types';

interface AvatarProps {
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md' }) => {
  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const getInitials = (name: string) => {
    if (typeof name !== 'string' || !name) return '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden bg-gray-200 dark:bg-gray-600 rounded-full ${sizeClasses[size]} border-2 border-white dark:border-gray-800`}
      title={user.full_name}
    >
      {user.avatar_url ? (
        <img className="absolute w-full h-full object-cover" src={user.avatar_url} alt={user.full_name} />
      ) : (
        <span className="font-medium text-gray-600 dark:text-gray-300">{getInitials(user.full_name)}</span>
      )}
    </div>
  );
};

export default Avatar;
