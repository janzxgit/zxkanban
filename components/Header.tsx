
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-semibold text-gray-700">Welcome</h2>
      </div>
      <div>
        {/* Placeholder for user info or actions */}
      </div>
    </header>
  );
};
