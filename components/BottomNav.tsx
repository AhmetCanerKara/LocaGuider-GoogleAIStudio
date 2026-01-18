import React from 'react';
import { TabView } from '../types';
import { Map, List, Heart, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems: { id: TabView; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'Map', icon: <Map size={24} /> },
    { id: 'nearby', label: 'Nearby', icon: <List size={24} /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={24} /> },
    { id: 'profile', label: 'Profile', icon: <User size={24} /> },
  ];

  return (
    <nav className="bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              currentTab === item.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
