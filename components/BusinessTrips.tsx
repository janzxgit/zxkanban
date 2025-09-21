import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { BusinessTrip, TripReport } from '../types';
import { Modal } from './common/Modal';
import { PlusIcon, TrashIcon, PencilIcon, ChevronDownIcon, DownloadIcon } from './common/Icons';

const initialTripState: Omit<BusinessTrip, 'id' | 'status' | 'report'> = { destination: '', startDate: '', endDate: '', purpose: '' };
const initialReportState: TripReport = { content: '', achievements: '', issues: '', expenses: 0 };

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

const commonInputClasses = "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";


export const BusinessTrips: React.FC = () => {
  const [trips, setTrips] = useLocalStorage<BusinessTrip[]>('businessTrips', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Omit<BusinessTrip, 'id' | 'status' | 'report'>>(initialTripState);
  const [currentReport, setCurrentReport] = useState<TripReport>(initialReportState);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTrip(prev => ({ ...prev, [name]: value }));
  };
  
  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';
    setCurrentReport(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
  };

  const openAddModal = () => {
    setEditingTripId(null);
    setCurrentTrip(initialTripState);
    setIsModalOpen(true);
  };

  const openEditModal = (trip: BusinessTrip) => {
    setEditingTripId(trip.id);
    setCurrentTrip({ destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, purpose: trip.purpose });
    setIsModalOpen(true);
  };
  
  const openReportModal = (trip: BusinessTrip) => {
      setEditingTripId(trip.id);
      setCurrentReport(trip.report || initialReportState);
      setIsReportModalOpen(true);
  };

  const handleSubmit = () => {
    if (!currentTrip.destination || !currentTrip.startDate || !currentTrip.endDate) return;
    if (editingTripId) {
      setTrips(prev => prev.map(t => t.id === editingTripId ? { ...t, ...currentTrip } : t));
    } else {
      setTrips(prev => [...prev, { ...currentTrip, id: crypto.randomUUID(), status: 'Planned' }]);
    }
    setIsModalOpen(false);
  };

  const handleReportSubmit = () => {
    if (!editingTripId) return;
    setTrips(prev => prev.map(t => t.id === editingTripId ? {...t, report: currentReport, status: 'Completed'} : t));
    setIsReportModalOpen(false);
    setEditingTripId(null);
  };

  const handleDelete = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };
  
  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [trips]);

  const handleExport = () => {
    const flattenedData = sortedTrips.map(trip => ({
        id: trip.id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        purpose: trip.purpose,
        status: trip.status,
        report_content: trip.report?.content || '',
        report_achievements: trip.report?.achievements || '',
        report_issues: trip.report?.issues || '',
        report_expenses: trip.report?.expenses || 0,
    }));
    const headers = ['id', 'destination', 'startDate', 'endDate', 'purpose', 'status', 'report_content', 'report_achievements', 'report_issues', 'report_expenses'];
    exportToCSV(flattenedData, headers, 'business-trips.csv');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-3xl font-bold text-gray-800">出差管理</h2>
        <div className="flex items-center space-x-2">
            <button onClick={handleExport} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200 shadow-sm">
                <DownloadIcon className="w-5 h-5 mr-2" />
                导出CSV
            </button>
            <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
            <PlusIcon className="w-5 h-5 mr-2" />
            新建出差申请
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
            {sortedTrips.map(trip => (
                <div key={trip.id}>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}>
                        <div className="flex-1">
                            <p className="font-semibold text-indigo-700">{trip.destination}</p>
                            <p className="text-sm text-gray-500">{trip.startDate} to {trip.endDate}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trip.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {trip.status === 'Completed' ? '已完成' : '计划中'}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(trip);}} className="p-2 text-gray-400 hover:text-blue-600"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(trip.id);}} className="p-2 text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedTripId === trip.id ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                    {expandedTripId === trip.id && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <h4 className="font-semibold text-gray-700 mb-2">出差事由:</h4>
                            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{trip.purpose}</p>
                            
                            {trip.report ? (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">出差报告:</h4>
                                    <div className="space-y-3 text-sm text-gray-800 p-3 bg-white rounded-md border">
                                        <p><strong>工作内容:</strong> {trip.report.content}</p>
                                        <p><strong>成果:</strong> {trip.report.achievements}</p>
                                        <p><strong>遇到的问题:</strong> {trip.report.issues}</p>
                                        <p><strong>费用:</strong> ¥{trip.report.expenses.toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => openReportModal(trip)} className="mt-3 text-sm text-indigo-600 hover:underline">编辑报告</button>
                                </div>
                            ) : (
                                <button onClick={() => openReportModal(trip)} className="text-sm bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">撰写报告</button>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {sortedTrips.length === 0 && <p className="p-6 text-center text-gray-500">暂无出差记录</p>}
        </div>
      </div>

      {/* Trip Application Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTripId ? "编辑出差申请" : "新建出差申请"}>
        <div className="space-y-6">
          <div>
            <label htmlFor="destination" className={commonLabelClasses}>目的地</label>
            <input id="destination" name="destination" value={currentTrip.destination} onChange={handleInputChange} placeholder="目的地" className={commonInputClasses}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="startDate" className={commonLabelClasses}>开始日期</label>
                <input id="startDate" name="startDate" type="date" value={currentTrip.startDate} onChange={handleInputChange} className={commonInputClasses}/>
            </div>
            <div>
                <label htmlFor="endDate" className={commonLabelClasses}>结束日期</label>
                <input id="endDate" name="endDate" type="date" value={currentTrip.endDate} onChange={handleInputChange} className={commonInputClasses}/>
            </div>
          </div>
          <div>
            <label htmlFor="purpose" className={commonLabelClasses}>出差事由</label>
            <textarea id="purpose" name="purpose" value={currentTrip.purpose} onChange={handleInputChange} placeholder="出差事由" rows={4} className={commonInputClasses}/>
          </div>
          <div className="flex justify-end pt-2"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button></div>
        </div>
      </Modal>

      {/* Trip Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="撰写/编辑出差报告">
        <div className="space-y-6">
          <div>
            <label htmlFor="content" className={commonLabelClasses}>工作内容</label>
            <textarea id="content" name="content" value={currentReport.content} onChange={handleReportChange} placeholder="工作内容" rows={3} className={commonInputClasses}/>
          </div>
          <div>
            <label htmlFor="achievements" className={commonLabelClasses}>成果</label>
            <textarea id="achievements" name="achievements" value={currentReport.achievements} onChange={handleReportChange} placeholder="成果" rows={3} className={commonInputClasses}/>
          </div>
          <div>
            <label htmlFor="issues" className={commonLabelClasses}>遇到的问题</label>
            <textarea id="issues" name="issues" value={currentReport.issues} onChange={handleReportChange} placeholder="遇到的问题" rows={3} className={commonInputClasses}/>
          </div>
          <div>
            <label htmlFor="expenses" className={commonLabelClasses}>费用情况</label>
            <input id="expenses" name="expenses" type="number" value={currentReport.expenses} onChange={handleReportChange} placeholder="费用情况" className={commonInputClasses}/>
          </div>
          <div className="flex justify-end pt-2"><button onClick={handleReportSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存报告</button></div>
        </div>
      </Modal>
    </div>
  );
};