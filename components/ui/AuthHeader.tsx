import React from 'react';

interface AuthHeaderProps {
  title: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title }) => {
  return (
    <div className="text-center">
      <img src="/images/LOGO-SIN-DGS-1.png" alt="Albroksa Logo" className="h-16 w-auto mx-auto mb-6 block dark:hidden" />
      <img src="/images/logo_albrok_blanco_transp.png" alt="Albroksa Logo" className="h-16 w-auto mx-auto mb-6 hidden dark:block" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
        {title}
      </h1>
    </div>
  );
};

export default AuthHeader;