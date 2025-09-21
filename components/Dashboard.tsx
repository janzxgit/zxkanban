import React from 'react';
import { BriefcaseIcon, UserGroupIcon, DocumentTextIcon } from './common/Icons';

export const Dashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">仪表盘</h2>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-xl font-semibold text-gray-700">欢迎回来!</h3>
        <p className="text-gray-500 mt-2">这是您的综合工作台。从左侧的侧边栏选择一个模块开始，或查看下面的摘要。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <BriefcaseIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">出差管理</p>
            <p className="text-2xl font-bold text-gray-800">即将推出</p>
            <p className="text-xs text-gray-400 mt-1">快速查看计划中的行程</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-start space-x-4">
          <div className="bg-green-100 p-3 rounded-full">
            <UserGroupIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">会议纪要</p>
            <p className="text-2xl font-bold text-gray-800">即将推出</p>
            <p className="text-xs text-gray-400 mt-1">查看最近的会议记录</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-start space-x-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <DocumentTextIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">待办合同</p>
            <p className="text-2xl font-bold text-gray-800">即将推出</p>
            <p className="text-xs text-gray-400 mt-1">跟踪需要您关注的合同</p>
          </div>
        </div>
      </div>
    </div>
  );
};