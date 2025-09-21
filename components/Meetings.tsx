import React, { useState, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Meeting, Personnel } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, DownloadIcon, ArrowLeftIcon, PhotographIcon, PrinterIcon } from './common/Icons';

const initialMeetingState: Omit<Meeting, 'id'> = {
  title: '',
  date: '',
  attendees: '',
  minutes: '',
};

const commonInputClasses = "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

const exportToCSV = (data: any[], headers: string[], filename: string) => {
    const escapeCSVValue = (value: any): string => {
        if (value === null || value === undefined) {
            return '';
        }
        let strValue = Array.isArray(value) ? value.join('; ') : String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            strValue = strValue.replace(/"/g, '""');
            return `"${strValue}"`;
        }
        return strValue;
    };

    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => escapeCSVValue(row[header])).join(',')
        )
    ];

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

interface MeetingsProps {
    personnel: Personnel[];
}

export const Meetings: React.FC<MeetingsProps> = ({ personnel }) => {
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>('meetings', []);
  const [view, setView] = useState<'list' | 'edit' | 'read'>('list');
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [editingMinutes, setEditingMinutes] = useState('');
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings]);
  
  const openAddView = () => {
    setCurrentMeeting({ ...initialMeetingState, id: '' });
    setEditingMinutes('');
    setView('edit');
  };
  
  const openEditView = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    setEditingMinutes(meeting.minutes);
    setView('edit');
  };

  const openReadView = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    setView('read');
  };

  const handleSave = () => {
    if (!currentMeeting || !currentMeeting.title || !currentMeeting.date) return;
    const finalMeeting = { ...currentMeeting, minutes: editingMinutes };
    
    setMeetings(prev => {
        if (finalMeeting.id) {
            return prev.map(m => m.id === finalMeeting.id ? finalMeeting : m);
        } else {
            return [...prev, { ...finalMeeting, id: crypto.randomUUID() }];
        }
    });
    setView('list');
  };

  const handleDelete = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    setView('list');
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setEditingMinutes(loadEvent.target?.result as string);
        };
        reader.readAsText(file);
    }
    e.target.value = '';
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            const markdownImage = `![${file.name}](${base64Image})`;
            const textarea = editorTextareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const newText = text.substring(0, start) + markdownImage + text.substring(end);
                setEditingMinutes(newText);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleExportAllToCSV = () => {
    const headers = ['id', 'title', 'date', 'attendees', 'minutes'];
    exportToCSV(sortedMeetings, headers, 'all-meetings.csv');
  };

  const handleExportToPDF = async () => {
    const contentElement = pdfContentRef.current;
    if (!contentElement) return;

    const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 20;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    const imgProps = pdf.getImageProperties(imgData);
    const scaledImgHeight = (imgProps.height * contentWidth) / imgProps.width;
    
    let heightLeft = scaledImgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledImgHeight);
    heightLeft -= contentHeight;
    
    while (heightLeft > 0) {
      position -= contentHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, scaledImgHeight);
      heightLeft -= contentHeight;
    }
    
    pdf.save(`${currentMeeting?.title || 'meeting'}.pdf`);
  };
  

  const renderListView = () => (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-3xl font-bold text-gray-800">会议管理</h2>
        <div className="flex items-center space-x-2">
            <button onClick={handleExportAllToCSV} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                <DownloadIcon className="w-5 h-5 mr-2" />
                导出CSV
            </button>
            <button onClick={openAddView} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                <PlusIcon className="w-5 h-5 mr-2" />
                新建会议纪要
            </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMeetings.map(meeting => (
          <div key={meeting.id} className="bg-white rounded-lg shadow p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{meeting.title}</h3>
              <p className="text-sm text-gray-500 mb-1">日期: {meeting.date}</p>
              <p className="text-sm text-gray-500 mb-3 truncate">参会: {meeting.attendees}</p>
              <p className="text-sm text-gray-600 h-20 overflow-hidden line-clamp-4">{meeting.minutes.replace(/!\[.*?\]\(.*?\)/g, '[图片]')}</p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <button onClick={() => openReadView(meeting)} className="text-sm text-indigo-600 hover:underline">阅读更多</button>
              <div className="flex items-center space-x-2">
                <button onClick={() => openEditView(meeting)} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={() => handleDelete(meeting.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
        ))}
         {sortedMeetings.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">暂无会议记录</p>}
      </div>
    </div>
  );
  
  const renderReadView = () => (
    <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800 truncate" title={currentMeeting?.title}>{currentMeeting?.title}</h2>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            <button onClick={handleExportToPDF} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                <PrinterIcon className="w-5 h-5 mr-2" />
                导出PDF
            </button>
            <button onClick={() => setView('list')} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                返回列表
            </button>
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow flex justify-center">
            <div ref={pdfContentRef} className="w-full">
                <div className="border-b pb-4 mb-4">
                    <h1 className="text-3xl font-bold">{currentMeeting?.title}</h1>
                    <p className="text-gray-500 mt-2">日期: {currentMeeting?.date}</p>
                    <p className="text-gray-500">参会: {currentMeeting?.attendees}</p>
                </div>
                <article className="prose prose-xl max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentMeeting?.minutes || ''}</ReactMarkdown>
                </article>
            </div>
        </div>
    </div>
  );

  const renderEditView = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-3xl font-bold text-gray-800">{currentMeeting?.id ? '编辑会议纪要' : '新建会议纪要'}</h2>
        <div className="flex items-center space-x-2">
            <button onClick={() => setView('list')} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                取消
            </button>
             <button onClick={handleSave} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                保存
            </button>
        </div>
      </div>
      <div className="bg-white p-8 rounded-lg shadow mb-6 space-y-6">
        <div>
            <label htmlFor="title" className={commonLabelClasses}>会议主题</label>
            <input id="title" value={currentMeeting?.title} onChange={e => setCurrentMeeting(m => m ? {...m, title: e.target.value} : null)} className={commonInputClasses}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="date" className={commonLabelClasses}>会议日期</label>
                <input id="date" type="date" value={currentMeeting?.date} onChange={e => setCurrentMeeting(m => m ? {...m, date: e.target.value} : null)} className={commonInputClasses}/>
            </div>
        </div>
        <div>
            <label htmlFor="attendees" className={commonLabelClasses}>参会人员</label>
            <textarea id="attendees" value={currentMeeting?.attendees} onChange={e => setCurrentMeeting(m => m ? {...m, attendees: e.target.value} : null)} rows={2} className={commonInputClasses}/>
             {personnel.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                    <p className="font-medium mb-1">可用人员 (点击添加):</p>
                    <div className="flex flex-wrap gap-1">
                        {personnel.map(p => 
                            <button key={p.id} onClick={() => setCurrentMeeting(m => {
                                if (!m) return null;
                                const attendees = m.attendees ? m.attendees.split(',').map(s => s.trim()).filter(Boolean) : [];
                                if (!attendees.includes(p.name)) {
                                    attendees.push(p.name);
                                }
                                return {...m, attendees: attendees.join(', ')}
                            })} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-300 transition-colors">{p.name}</button>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-2 border-b flex items-center space-x-2">
            <input type="file" id="md-upload" accept=".md" className="hidden" onChange={handleFileUpload} />
            <label htmlFor="md-upload" className="cursor-pointer flex items-center text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300">
                <DownloadIcon className="w-4 h-4 mr-2" />
                导入 .md 文件
            </label>
             <input type="file" id="img-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <label htmlFor="img-upload" className="cursor-pointer flex items-center text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300">
                <PhotographIcon className="w-4 h-4 mr-2" />
                插入图片
            </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 h-[60vh] border-t">
            <textarea 
                ref={editorTextareaRef}
                value={editingMinutes}
                onChange={e => setEditingMinutes(e.target.value)}
                placeholder="在此输入Markdown格式的会议纪要..."
                className="w-full h-full p-4 border-r resize-none focus:outline-none"
            />
            <article className="prose max-w-none p-4 overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{editingMinutes}</ReactMarkdown>
            </article>
        </div>
      </div>
    </div>
  );
  
  switch(view) {
      case 'read': return renderReadView();
      case 'edit': return renderEditView();
      default: return renderListView();
  }
};