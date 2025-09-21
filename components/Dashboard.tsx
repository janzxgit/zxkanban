
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { QuickLink } from '../types';
import { Modal } from './common/Modal';
import { PlusIcon, TrashIcon, ExternalLinkIcon } from './common/Icons';

export const Dashboard: React.FC = () => {
  const [links, setLinks] = useLocalStorage<QuickLink[]>('quickLinks', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' });

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      setLinks([...links, { ...newLink, id: crypto.randomUUID() }]);
      setNewLink({ title: '', url: '', description: '' });
      setIsModalOpen(false);
    }
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLink(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">导航与常用链接</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          添加链接
        </button>
      </div>

      {links.length === 0 ? (
         <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl text-gray-600">还没有任何链接</h3>
            <p className="text-gray-400 mt-2">点击 "添加链接" 来创建你的第一个快速访问入口吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {links.map(link => (
            <div key={link.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{link.title}</h3>
                        <button onClick={() => handleDeleteLink(link.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{link.description || '无简介'}</p>
                </div>
                <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto self-start flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                    访问
                    <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </a>
            </div>
            ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="添加新链接">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">标题</label>
            <input
              type="text"
              name="title"
              id="title"
              value={newLink.title}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如：公司内网"
            />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
            <input
              type="text"
              name="url"
              id="url"
              value={newLink.url}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">简介</label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={newLink.description}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="关于这个链接的简短说明"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleAddLink}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
