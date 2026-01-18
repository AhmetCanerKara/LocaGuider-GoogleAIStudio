import React from 'react';

export const Splash: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-blue-600 text-white">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 bg-white rounded-full opacity-20 animate-ping"></div>
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl z-10">
          <span className="text-3xl font-bold text-blue-600">LG</span>
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-wider">LocaGuider</h1>
      <p className="text-blue-200 text-sm mt-2">Discover Your City</p>
    </div>
  );
};
