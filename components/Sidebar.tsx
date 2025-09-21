import React from 'react';
import { 
    DocumentTextIcon, 
    HomeIcon, 
    BriefcaseIcon, 
    UserGroupIcon, 
    CollectionIcon, 
    DatabaseIcon,
    LinkIcon
} from './common/Icons';
import type { View } from '../App';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const navItems: { id: View; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'dashboard', name: '导航', icon: HomeIcon },
  { id: 'quick-links', name: '常用链接', icon: LinkIcon },
  { id: 'business-trips', name: '出差管理', icon: BriefcaseIcon },
  { id: 'meetings', name: '会议管理', icon: UserGroupIcon },
  { id: 'collaborations', name: '引合记录', icon: CollectionIcon },
  { id: 'contracts', name: '合同管理', icon: DocumentTextIcon },
  { id: 'master-data', name: '基础数据', icon: DatabaseIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center text-2xl font-bold">
        综合工作台
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === item.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </button>
        ))}
      </nav>
    </div>
  );
};