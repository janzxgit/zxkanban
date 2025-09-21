// Fix: Implement the Sidebar navigation component.
import React from 'react';
import { HomeIcon, BriefcaseIcon, UsersIcon, ShareIcon, DatabaseIcon } from './common/Icons';

type View = 'dashboard' | 'trips' | 'meetings' | 'collaborations' | 'master-data';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const navItems: { id: View; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'dashboard', name: '仪表盘', icon: HomeIcon },
    { id: 'trips', name: '出差管理', icon: BriefcaseIcon },
    { id: 'meetings', name: '会议管理', icon: UsersIcon },
    { id: 'collaborations', name: '引合记录', icon: ShareIcon },
    { id: 'master-data', name: '主数据', icon: DatabaseIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
        企业看板
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {navItems.map(item => (
            <li key={item.id} className="mb-2">
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center px-4 py-2 rounded-md text-left transition-colors duration-200 ${
                  currentView === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6 mr-3" />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};