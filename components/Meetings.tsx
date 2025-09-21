
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Meeting } from '../types';
import { Modal } from './common/Modal';
import { PlusIcon, TrashIcon, PencilIcon } from './common/Icons';

const initialMeetingState: Omit<Meeting, 'id'> = { title: '', date: '', attendees: '', minutes: '' };

export const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>('meetings', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Omit<Meeting, 'id'>>(initialMeetingState);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentMeeting(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingMeetingId(null);
    setCurrentMeeting(initialMeetingState);
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setCurrentMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!currentMeeting.title || !currentMeeting.date) return;
    if (editingMeetingId) {
      setMeetings(meetings.map(m => m.id === editingMeetingId ? { ...currentMeeting, id: editingMeetingId } : m));
    } else {
      setMeetings([...meetings, { ...currentMeeting, id: crypto.randomUUID() }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setMeetings(meetings.filter(m => m.id !== id));
  };
  
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">营业会议管理</h2>
        <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
          <PlusIcon className="w-5 h-5 mr-2" />
          新建会议
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会议主题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参会人员</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {sortedMeetings.map(meeting => (
                    <tr key={meeting.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meeting.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{meeting.attendees}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openEditModal(meeting)} className="text-indigo-600 hover:text-indigo-900 mr-4"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDelete(meeting.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
                {sortedMeetings.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-500">暂无会议记录</td></tr>
                )}
            </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMeetingId ? "编辑会议" : "新建会议"}>
        <div className="space-y-4">
            <input name="title" value={currentMeeting.title} onChange={handleInputChange} placeholder="会议主题" className="w-full p-2 border rounded"/>
            <input name="date" type="date" value={currentMeeting.date} onChange={handleInputChange} className="w-full p-2 border rounded"/>
            <textarea name="attendees" value={currentMeeting.attendees} onChange={handleInputChange} placeholder="参会人员 (用逗号分隔)" rows={2} className="w-full p-2 border rounded"/>
            <textarea name="minutes" value={currentMeeting.minutes} onChange={handleInputChange} placeholder="会议纪要" rows={6} className="w-full p-2 border rounded"/>
          <div className="flex justify-end"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button></div>
        </div>
      </Modal>
    </div>
  );
};
