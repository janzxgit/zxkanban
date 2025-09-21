import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Meeting, Personnel } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon, PhotographIcon, CloudUploadIcon } from './common/Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


const initialMeetingState: Omit<Meeting, 'id'> = { title: '', date: '', attendees: '', minutes: '' };

interface MeetingsProps {
    personnel: Personnel[];
}

export const Meetings: React.FC<MeetingsProps> = ({ personnel }) => {
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>('meetings', []);
  const [view, setView] = useState<'list' | 'edit' | 'read'>('list');
  const [currentMeeting, setCurrentMeeting] = useState<Omit<Meeting, 'id'>>(initialMeetingState);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const minutesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mdImportRef = useRef<HTMLInputElement>(null);
  const imageImportRef = useRef<HTMLInputElement>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentMeeting(prev => ({ ...prev, [name]: value }));
  };

  const addAttendee = (name: string) => {
    setCurrentMeeting(prev => {
        const currentAttendees = prev.attendees.split(',').map(a => a.trim()).filter(Boolean);
        if (currentAttendees.includes(name)) return prev;
        return { ...prev, attendees: [...currentAttendees, name].join(', ') }
    });
  };

  const openAddView = () => {
    setEditingMeetingId(null);
    setCurrentMeeting(initialMeetingState);
    setView('edit');
  };

  const openEditView = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setCurrentMeeting({ title: meeting.title, date: meeting.date, attendees: meeting.attendees, minutes: meeting.minutes });
    setView('edit');
  };

  const openReadView = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setCurrentMeeting({ title: meeting.title, date: meeting.date, attendees: meeting.attendees, minutes: meeting.minutes });
    setView('read');
  };

  const handleSubmit = () => {
    if (!currentMeeting.title || !currentMeeting.date) return;
    if (editingMeetingId) {
      setMeetings(meetings.map(m => m.id === editingMeetingId ? { ...currentMeeting, id: editingMeetingId } : m));
    } else {
      setMeetings([...meetings, { ...currentMeeting, id: crypto.randomUUID() }]);
    }
    setView('list');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this meeting record?')) {
        setMeetings(meetings.filter(m => m.id !== id));
    }
  };
  
  const handleMarkdownImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        setCurrentMeeting(prev => ({...prev, minutes: content}));
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };
  
  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64Image = event.target?.result as string;
          const imageMarkdown = `\n![${file.name}](${base64Image})\n`;
          
          const textarea = minutesTextareaRef.current;
          if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const text = textarea.value;
              const newText = text.substring(0, start) + imageMarkdown + text.substring(end);
              setCurrentMeeting(prev => ({...prev, minutes: newText}));
          }
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset file input
  };

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings]);

  if (view === 'read') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{currentMeeting.title}</h2>
          <button onClick={() => setView('list')} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            返回列表
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow space-y-2 mb-6 border-b">
            <p className="text-md text-gray-500"><span className="font-semibold text-gray-700">日期:</span> {currentMeeting.date}</p>
            <p className="text-md text-gray-500"><span className="font-semibold text-gray-700">参会人员:</span> {currentMeeting.attendees}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
             <article className="prose lg:prose-xl max-w-none">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentMeeting.minutes || "No content."}</ReactMarkdown>
            </article>
        </div>
      </div>
    );
  }

  if (view === 'edit') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{editingMeetingId ? '编辑会议纪要' : '新建会议纪要'}</h2>
          <button onClick={() => setView('list')} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            返回列表
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="title" value={currentMeeting.title} onChange={handleInputChange} placeholder="会议主题" className="w-full p-2 border rounded"/>
                <input name="date" type="date" value={currentMeeting.date} onChange={handleInputChange} className="w-full p-2 border rounded"/>
            </div>
            <textarea name="attendees" value={currentMeeting.attendees} onChange={handleInputChange} placeholder="参会人员 (用逗号分隔)" rows={2} className="w-full p-2 border rounded"/>
            {personnel.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-600 self-center">快速添加:</span>
                    {personnel.map(p => (
                        <button key={p.id} onClick={() => addAttendee(p.name)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300">
                           + {p.name}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-2 mb-4 border-b pb-4">
                <h3 className="text-xl font-semibold text-gray-700">会议纪要 (Markdown)</h3>
                <input type="file" ref={mdImportRef} onChange={handleMarkdownImport} accept=".md,.markdown" className="hidden" />
                <button onClick={() => mdImportRef.current?.click()} className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">
                    <CloudUploadIcon className="w-4 h-4 mr-2" /> 导入 .md 文件
                </button>
                 <input type="file" ref={imageImportRef} onChange={handleImageInsert} accept="image/*" className="hidden" />
                <button onClick={() => imageImportRef.current?.click()} className="flex items-center text-sm bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                    <PhotographIcon className="w-4 h-4 mr-2" /> 插入图片
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50vh]">
                <textarea ref={minutesTextareaRef} name="minutes" value={currentMeeting.minutes} onChange={handleInputChange} placeholder="在此处输入会议内容..." className="w-full h-full p-2 border rounded font-mono text-sm min-h-[50vh]"/>
                <div className="prose lg:prose-lg max-w-none p-4 border rounded bg-gray-50 overflow-y-auto min-h-[50vh]">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentMeeting.minutes || "内容预览..."}</ReactMarkdown>
                </div>
            </div>
        </div>
        
        <div className="flex justify-end mt-6">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 text-lg">保存</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">营业会议管理</h2>
        <button onClick={openAddView} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
          <PlusIcon className="w-5 h-5 mr-2" />
          新建会议
        </button>
      </div>
      
      {sortedMeetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl text-gray-600">还没有任何会议记录</h3>
            <p className="text-gray-400 mt-2">点击 "新建会议" 开始记录吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMeetings.map(meeting => (
                <div key={meeting.id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{meeting.title}</h3>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => openEditView(meeting)} className="text-gray-400 hover:text-indigo-600"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(meeting.id)} className="text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{meeting.date}</p>
                        <p className="text-sm text-gray-600 font-medium mb-4 truncate"><strong>参会:</strong> {meeting.attendees}</p>
                        <div className="prose prose-sm max-w-none h-24 overflow-hidden relative">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{meeting.minutes}</ReactMarkdown>
                           <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                        </div>
                    </div>
                    <button onClick={() => openReadView(meeting)} className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold text-sm self-start">
                        阅读更多 &rarr;
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};